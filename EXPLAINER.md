# EXPLAINER.md

## 1. The Ledger

**Balance calculation query** (`ledger/services.py`):

```python
total_credits = LedgerEntry.objects.filter(
    merchant=merchant, entry_type=LedgerEntry.CREDIT
).aggregate(
    total=Coalesce(Sum("amount_paise"), Value(0, output_field=BigIntegerField()))
)["total"]

total_debits = LedgerEntry.objects.filter(
    merchant=merchant, entry_type=LedgerEntry.DEBIT
).aggregate(
    total=Coalesce(Sum("amount_paise"), Value(0, output_field=BigIntegerField()))
)["total"]

held = Payout.objects.filter(
    merchant=merchant,
    status__in=[Payout.PENDING, Payout.PROCESSING],
).aggregate(
    total=Coalesce(Sum("amount_paise"), Value(0, output_field=BigIntegerField()))
)["total"]

available = total_credits - total_debits - held
```

**Why this model?**

Credits and debits are separate immutable `LedgerEntry` rows — never edits to a single balance column. This is the append-only ledger pattern: every money movement appends a row. You get a full audit trail for free, and balance is always recomputable from `SUM(credits) - SUM(debits)`.

**Design choice — held balance via Payout query, not ledger debit at request time.**

There are two valid approaches:

| Approach | How it works |
|---|---|
| **A — debit at request time** | Write a debit entry when payout is created; reverse it (credit) if it fails |
| **B — live Payout query (what we use)** | Write no ledger entry at creation; query `SUM(pending + processing)` separately; only write the debit on `COMPLETED` |

We use approach B. The invariant is:

```
available = SUM(credits) - SUM(completed debits) - SUM(pending/processing payout amounts)
```

A `PENDING` or `PROCESSING` payout has no corresponding ledger row yet — which is exactly why we need the separate Payout query to subtract those from available. The debit ledger entry is only written when a payout reaches `COMPLETED`. On `FAILED`, there is nothing to undo in the ledger — funds are released the instant the status column flips.

The trade-off: approach A gives a pure-ledger model (everything in one table) but requires a compensating credit on failure, which is two writes and harder to reason about atomically. Approach B is simpler — failure means nothing to reverse — but the balance formula must always include the held Payout query. We document this explicitly so no future developer silently removes it and creates overdrafts.

**Why DB-level aggregation?**

Two reasons: (1) fetching thousands of rows to sum in Python is wasteful; (2) there is a TOCTOU window if we fetch rows then sum — a concurrent payout could change the balance between those two operations. `SUM()` in PostgreSQL is atomic within the transaction.

`Coalesce(..., 0)` guards against `NULL` — SQL `SUM` of an empty set returns `NULL`, not `0`, which would crash integer arithmetic.

`BigIntegerField` in paise (not rupees, not floats). 1 rupee = 100 paise. Integer arithmetic on paise is exact. Floats have binary representation errors that compound across millions of transactions.

---

## 2. The Lock

**Exact code** (`payouts/services.py`, inside `create_payout`):

```python
with transaction.atomic():
    try:
        with transaction.atomic():  # savepoint — prevents poisoned outer transaction
            merchant_locked = (
                Merchant.objects.select_for_update(nowait=True).get(pk=merchant.pk)
            )
    except OperationalError:
        try:
            IdempotencyKey.objects.filter(merchant=merchant, key=idempotency_key).delete()
        except Exception:
            pass
        raise InsufficientFundsError(
            "Another payout is being processed. Please retry."
        )

    # balance check and payout creation happen here, while lock is held
```

**Database primitive:** `SELECT FOR UPDATE NOWAIT` in PostgreSQL.

This translates to: `SELECT ... FROM merchants_merchant WHERE id = $1 FOR UPDATE NOWAIT`.

- `FOR UPDATE` acquires a row-level exclusive lock on the merchant row for the duration of the transaction.
- `NOWAIT` means: if another transaction already holds the lock, fail immediately with `OperationalError` instead of blocking. Without `NOWAIT`, the second request would wait for the first to commit, then proceed and re-read the balance — but by then funds may already be deducted.

**Why the inner `transaction.atomic()` savepoint?**

When `select_for_update(nowait=True)` raises `OperationalError`, PostgreSQL marks the current transaction as aborted. Any subsequent DB call in the same transaction raises `current transaction is aborted, commands ignored until end of transaction block`. The inner `atomic()` creates a savepoint — the `OperationalError` rolls back only to the savepoint, leaving the outer transaction healthy so we can clean up the idempotency key.

**Why lock the merchant row, not the payout table?**

The race is on the balance check, which spans the merchant's entire ledger. Locking a payout row would not prevent two transactions from simultaneously reading the same balance and both deciding they have enough funds. Locking the merchant row serializes the entire check-then-deduct per merchant.

---

## 3. The Idempotency

**How the system recognizes a seen key** (`payouts/models.py` + `payouts/services.py`):

`IdempotencyKey` has a `UNIQUE (merchant_id, key)` constraint. On every request:

1. Look up `IdempotencyKey` by `(merchant, key)`.
2. Found, `status = complete` → return the linked payout. No new payout created.
3. Found, `status = in_flight` → return 409 Conflict.
4. Not found → `get_or_create(merchant, key, status=in_flight)`.

**What if the first request is still in flight when the second arrives?**

The `in_flight` row acts as a reservation marker. Between step 1 (check) and step 4 (create), a second concurrent request could slip through — which is why we use `get_or_create` at step 4. If the second request finds an existing `in_flight` row, it raises `IdempotencyConflictError` → HTTP 409. If it loses the race at the DB unique constraint, `IntegrityError` is caught and also raises `IdempotencyConflictError`.

**Why 409 instead of blocking?**

If the first request is still in flight, we don't have a response to replay yet. Two honest options: 202 (poll for result) or 409 (retry with backoff). We chose 409 because our clients are server-side integrations that handle it with a short sleep-and-retry. The `in_flight` marker already stores everything needed to build a 202 polling endpoint — a natural next step.

**Key scoping and expiry:**

Keys are scoped per merchant via `unique_together = [("merchant", "key")]`. Two merchants can use the same UUID without collision.

Keys expire after 24 hours, checked at lookup time:

```python
def is_expired(self) -> bool:
    from datetime import timedelta
    return timezone.now() > self.created_at + timedelta(hours=24)
```

An expired key is deleted and the request proceeds as new.

---

## 4. The State Machine

**Legal transitions:**
```
PENDING → PROCESSING → COMPLETED
                    → FAILED
```

**Where illegal transitions are blocked** (`payouts/models.py`):

```python
LEGAL_TRANSITIONS = {
    PENDING:    {PROCESSING},
    PROCESSING: {COMPLETED, FAILED},
    COMPLETED:  set(),   # terminal — no exits
    FAILED:     set(),   # terminal — no exits
}

def can_transition_to(self, new_status: str) -> bool:
    return new_status in self.LEGAL_TRANSITIONS.get(self.status, set())
```

```python
# In services.py — called before EVERY state write:
def transition_payout(payout, new_status, failure_reason=""):
    if not payout.can_transition_to(new_status):
        raise InvalidTransitionError(
            f"Cannot transition {payout.id} from {payout.status!r} to {new_status!r}."
        )
```

`COMPLETED → PENDING` is blocked because `LEGAL_TRANSITIONS[COMPLETED]` is an empty set.
`FAILED → COMPLETED` is blocked because `LEGAL_TRANSITIONS[FAILED]` is an empty set.

**Atomic fund return on failure:**

When a payout moves to `FAILED`, the debit ledger entry was never written (only written on `COMPLETED`). The balance formula excludes `FAILED` payouts from the held sum. Funds are released the moment the status column flips — no separate reversal needed, and it is atomic because the status write and any downstream effects happen inside the same `transaction.atomic()`.

---

## 5. The AI Audit

**What AI gave me (wrong) — idempotency key cleanup inside a transaction:**

When generating the insufficient funds path, AI wrote:

```python
# AI's version — WRONG
with transaction.atomic():
    # ... balance check ...
    if amount_paise > available:
        idem_key.delete()  # ← inside the atomic block
        raise InsufficientFundsError("Insufficient funds.")
```

**Why this is wrong:**

`idem_key.delete()` runs inside `transaction.atomic()`. When `InsufficientFundsError` propagates out, Django rolls back the entire transaction — including the `delete()`. The idempotency key row survives with `status = in_flight`. Any retry with the same key now hits the `in_flight` branch and gets a 409 Conflict forever, making the error permanently unretryable.

This passed a casual code review because the delete call looks correct in isolation. The bug is invisible until you trace what happens to the transaction on exception.

**What I replaced it with:**

```python
# Correct — delete OUTSIDE the transaction after rollback
with transaction.atomic():
    if amount_paise > available:
        raise InsufficientFundsError("Insufficient funds.")  # no delete here

# In the outer except handler, after the transaction has rolled back:
except (InsufficientFundsError, IdempotencyConflictError) as e:
    if isinstance(e, InsufficientFundsError):
        try:
            IdempotencyKey.objects.filter(merchant=merchant, key=idempotency_key).delete()
        except Exception:
            pass
    raise
```

Using `IdempotencyKey.objects.filter(...).delete()` instead of `idem_key.delete()` because this runs in a fresh implicit transaction outside the rolled-back one, using the queryset API rather than the stale ORM object. This is verified by the test `test_no_payout_created_on_insufficient_funds` which asserts `IdempotencyKey.objects.filter(...).count() == 0` after a failed attempt.

**Second AI error — Python-level locking across processes:**

AI's first concurrency suggestion used `threading.Lock()`:

```python
# AI's version — WRONG
_merchant_locks = {}

def create_payout(merchant, ...):
    if merchant.id not in _merchant_locks:
        _merchant_locks[merchant.id] = threading.Lock()
    with _merchant_locks[merchant.id]:
        balance = get_merchant_balance(merchant)
        if amount > balance:
            raise InsufficientFundsError(...)
```

This is wrong for three reasons: (1) it only works within a single process — Celery workers and web workers are separate OS processes, each with their own `_merchant_locks` dict, providing zero mutual exclusion across them; (2) the dict is lost on restart; (3) the check-then-insert on the dict is itself a race in multi-threaded environments.

Replaced with `SELECT FOR UPDATE NOWAIT` as described in section 2 — enforced by PostgreSQL itself, works across all processes, survives restarts.

---

## Bonus: Retry Logic

Payouts stuck in `PROCESSING` (the 10% hang outcome) cannot use standard Celery task retries — the task already returned `None` successfully. Celery Beat runs `retry_stuck_payouts` every 30 seconds:

```python
CELERY_BEAT_SCHEDULE = {
    "retry-stuck-payouts": {
        "task": "payouts.tasks.retry_stuck_payouts",
        "schedule": 30.0,
    },
}
```

```python
STUCK_THRESHOLD_SECONDS = 30
MAX_ATTEMPTS = 3
BACKOFF_DELAYS = {1: 10, 2: 30, 3: 90}

def retry_stuck_payouts():
    cutoff = timezone.now() - timedelta(seconds=STUCK_THRESHOLD_SECONDS)
    stuck = Payout.objects.filter(
        status=Payout.PROCESSING,
        processing_started_at__lt=cutoff,
    )
    for payout in stuck:
        if payout.attempt_count >= MAX_ATTEMPTS:
            _fail_payout(payout, reason="Exceeded max retry attempts.")
        else:
            payout.status = Payout.PENDING
            payout.save()
            delay = BACKOFF_DELAYS.get(payout.attempt_count, 90)
            process_pending_payout.apply_async(args=[payout.id], countdown=delay)
```

**Why reset to PENDING instead of PROCESSING → PROCESSING?**

The state machine forbids `PROCESSING → PROCESSING`. We reset to `PENDING` as an internal recovery operation and let `process_pending_payout` move it to `PROCESSING` again — keeping attempt count accurate and the state machine clean.

`select_for_update(nowait=True)` in the scan ensures multiple Beat instances don't double-retry the same payout.

---

## Frontend

React + Tailwind dashboard. Redux Toolkit for state. SSE via `django-eventstream` for live payout status updates — each merchant has a scoped channel (`merchant-{id}`) so the dashboard only receives its own events. Balance polling at 30s as a fallback when SSE is unavailable. All amounts displayed in both INR and paise so the integer storage model is visible to the user.