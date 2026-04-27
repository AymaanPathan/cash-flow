from django.db import transaction, IntegrityError, OperationalError
from django.db.models import Sum, Q
from django.db.models.functions import Coalesce
from django.db.models import Value, BigIntegerField
from django.utils import timezone

from merchants.models import Merchant, BankAccount
from ledger.models import LedgerEntry
from .models import Payout, IdempotencyKey


class InsufficientFundsError(Exception):
    pass


class InvalidTransitionError(Exception):
    pass


class IdempotencyConflictError(Exception):
    """Raised when the same key is received while the first request is still in flight."""
    pass


def create_payout(
    merchant: Merchant,
    bank_account: BankAccount,
    amount_paise: int,
    idempotency_key: str,
) -> tuple[Payout, bool]:
    try:
        existing_key = IdempotencyKey.objects.get(merchant=merchant, key=idempotency_key)
        if existing_key.is_expired():
            existing_key.delete()
        elif existing_key.status == IdempotencyKey.IN_FLIGHT:
            raise IdempotencyConflictError(
                "A request with this idempotency key is already in flight."
            )
        elif existing_key.status == IdempotencyKey.COMPLETE and existing_key.payout:
            return existing_key.payout, False
    except IdempotencyKey.DoesNotExist:
        pass

    try:
        idem_key, newly_created = IdempotencyKey.objects.get_or_create(
            merchant=merchant,
            key=idempotency_key,
            defaults={"status": IdempotencyKey.IN_FLIGHT},
        )
        if not newly_created:
            if idem_key.status == IdempotencyKey.IN_FLIGHT:
                raise IdempotencyConflictError(
                    "A request with this idempotency key is already in flight."
                )
            elif idem_key.payout:
                return idem_key.payout, False
    except IntegrityError:
        raise IdempotencyConflictError(
            "A request with this idempotency key is already in flight."
        )

    try:
        with transaction.atomic():
            try:
                with transaction.atomic():  # savepoint prevents poisoned transaction
                    merchant_locked = (
                        Merchant.objects.select_for_update(nowait=True).get(pk=merchant.pk)
                    )
            except OperationalError:
                try:
                    idem_key.delete()
                except Exception:
                    pass
                raise InsufficientFundsError(
                    "Another payout is being processed. Please retry."
                )

            credits = LedgerEntry.objects.filter(
                merchant=merchant_locked, entry_type=LedgerEntry.CREDIT
            ).aggregate(
                total=Coalesce(Sum("amount_paise"), Value(0, output_field=BigIntegerField()))
            )["total"]

            debits = LedgerEntry.objects.filter(
                merchant=merchant_locked, entry_type=LedgerEntry.DEBIT
            ).aggregate(
                total=Coalesce(Sum("amount_paise"), Value(0, output_field=BigIntegerField()))
            )["total"]

            held = Payout.objects.filter(
                merchant=merchant_locked,
                status__in=[Payout.PENDING, Payout.PROCESSING],
            ).aggregate(
                total=Coalesce(Sum("amount_paise"), Value(0, output_field=BigIntegerField()))
            )["total"]

            available = credits - debits - held

            if amount_paise > available:
                try:
                    idem_key.delete()
                except Exception:
                    pass
                raise InsufficientFundsError(
                    f"Insufficient funds. Available: {available} paise, requested: {amount_paise} paise."
                )

            payout = Payout.objects.create(
                merchant=merchant_locked,
                bank_account=bank_account,
                amount_paise=amount_paise,
                status=Payout.PENDING,
            )

            idem_key.payout = payout
            idem_key.status = IdempotencyKey.COMPLETE
            idem_key.save(update_fields=["payout", "status"])

    except (InsufficientFundsError, IdempotencyConflictError) as e:
        if isinstance(e, InsufficientFundsError):
            try:
                IdempotencyKey.objects.filter(merchant=merchant, key=idempotency_key).delete()
            except Exception:
                pass
        raise
    except Exception:
        try:
            IdempotencyKey.objects.filter(merchant=merchant, key=idempotency_key).delete()
        except Exception:
            pass
        raise

    _push_payout_event(payout)
    from .tasks import process_pending_payout
    process_pending_payout.apply_async(
        args=[str(payout.id)],
        countdown=1,
    )

    return payout, True


def transition_payout(payout: Payout, new_status: str, failure_reason: str = "") -> Payout:
    if not payout.can_transition_to(new_status):
        raise InvalidTransitionError(
            f"Cannot transition {payout.id} from {payout.status!r} to {new_status!r}."
        )

    payout.status = new_status
    payout.failure_reason = failure_reason

    if new_status == Payout.PROCESSING:
        payout.processing_started_at = timezone.now()
    elif new_status in (Payout.COMPLETED, Payout.FAILED):
        payout.completed_at = timezone.now()

    payout.save(update_fields=[
        "status", "failure_reason",
        "processing_started_at", "completed_at", "updated_at"
    ])

    if new_status == Payout.COMPLETED:
        from ledger.models import LedgerEntry
        LedgerEntry.objects.create(
            merchant=payout.merchant,
            entry_type=LedgerEntry.DEBIT,
            amount_paise=payout.amount_paise,
            description=f"Payout to bank account {payout.bank_account.account_number[-4:]}",
            payout=payout,
        )

    _push_payout_event(payout)

    return payout


def _push_payout_event(payout: Payout):
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        async_to_sync(get_channel_layer().group_send)(
            f"merchant_{payout.merchant_id}",
            {
                "type": "payout_update",
                "data": {
                    "id": str(payout.id),
                    "status": payout.status,
                    "amount_paise": payout.amount_paise,
                    "amount_inr": f"{payout.amount_paise / 100:.2f}",
                    "failure_reason": payout.failure_reason,
                    "attempt_count": payout.attempt_count,
                    "created_at": payout.created_at.isoformat(),
                    "updated_at": payout.updated_at.isoformat(),
                    "completed_at": payout.completed_at.isoformat() if payout.completed_at else None,
                },
            },
        )
    except Exception as e:
        print(f"[WS] push failed: {e}")