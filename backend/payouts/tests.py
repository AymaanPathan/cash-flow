import uuid
import threading
from django.test import TestCase, TransactionTestCase
from django.db import connection
from ledger.services import get_merchant_balance
from payouts.services import transition_payout, InvalidTransitionError
from payouts.services import transition_payout, InvalidTransitionError
from payouts.services import transition_payout

from merchants.models import Merchant, BankAccount
from ledger.models import LedgerEntry
from payouts.models import Payout, IdempotencyKey
from payouts.services import (
    create_payout,
    InsufficientFundsError,
    IdempotencyConflictError,
)


def _make_merchant(name="Test Merchant", email=None):
    email = email or f"{uuid.uuid4()}@test.com"
    merchant = Merchant.objects.create(name=name, email=email)
    bank = BankAccount.objects.create(
        merchant=merchant,
        account_number="1234567890",
        ifsc_code="HDFC0001234",
        account_holder_name=name,
        is_primary=True,
    )
    return merchant, bank


def _credit(merchant, amount_paise):
    LedgerEntry.objects.create(
        merchant=merchant,
        entry_type=LedgerEntry.CREDIT,
        amount_paise=amount_paise,
        description="Test credit",
    )



class IdempotencyTest(TestCase):

    def setUp(self):
        self.merchant, self.bank = _make_merchant("Idem Merchant")
        _credit(self.merchant, 100_000)  # ₹1000

    def test_same_key_returns_same_payout(self):
        key = str(uuid.uuid4())

        payout1, created1 = create_payout(
            merchant=self.merchant,
            bank_account=self.bank,
            amount_paise=10_000,
            idempotency_key=key,
        )
        self.assertTrue(created1, "First call should create a payout")

        payout2, created2 = create_payout(
            merchant=self.merchant,
            bank_account=self.bank,
            amount_paise=10_000,
            idempotency_key=key,
        )
        self.assertFalse(created2, "Second call with same key should NOT create a new payout")
        self.assertEqual(payout1.id, payout2.id, "Both calls must return the same payout object")

        total_payouts = Payout.objects.filter(merchant=self.merchant).count()
        self.assertEqual(total_payouts, 1, "Exactly one payout must exist in the database")

    def test_different_keys_create_different_payouts(self):
        key_a = str(uuid.uuid4())
        key_b = str(uuid.uuid4())

        payout_a, _ = create_payout(
            merchant=self.merchant,
            bank_account=self.bank,
            amount_paise=10_000,
            idempotency_key=key_a,
        )
        payout_b, _ = create_payout(
            merchant=self.merchant,
            bank_account=self.bank,
            amount_paise=10_000,
            idempotency_key=key_b,
        )

        self.assertNotEqual(payout_a.id, payout_b.id)
        self.assertEqual(Payout.objects.filter(merchant=self.merchant).count(), 2)

    def test_key_scoped_per_merchant(self):
        merchant2, bank2 = _make_merchant("Other Merchant", email="other@test.com")
        _credit(merchant2, 100_000)

        shared_key = str(uuid.uuid4())

        payout1, created1 = create_payout(
            merchant=self.merchant,
            bank_account=self.bank,
            amount_paise=10_000,
            idempotency_key=shared_key,
        )
        payout2, created2 = create_payout(
            merchant=merchant2,
            bank_account=bank2,
            amount_paise=10_000,
            idempotency_key=shared_key,
        )

        self.assertTrue(created1)
        self.assertTrue(created2)
        self.assertNotEqual(payout1.id, payout2.id, "Keys are per-merchant — different payouts expected")

    def test_insufficient_funds_raises_error(self):
        with self.assertRaises(InsufficientFundsError):
            create_payout(
                merchant=self.merchant,
                bank_account=self.bank,
                amount_paise=999_999_999,
                idempotency_key=str(uuid.uuid4()),
            )

    def test_no_payout_created_on_insufficient_funds(self):
        key = str(uuid.uuid4())
        try:
            create_payout(
                merchant=self.merchant,
                bank_account=self.bank,
                amount_paise=999_999_999,
                idempotency_key=key,
            )
        except InsufficientFundsError:
            pass

        self.assertEqual(Payout.objects.filter(merchant=self.merchant).count(), 0)
        self.assertEqual(IdempotencyKey.objects.filter(merchant=self.merchant, key=key).count(), 0)



class ConcurrencyTest(TransactionTestCase):
    def setUp(self):
        self.merchant, self.bank = _make_merchant("Concurrent Merchant", "concurrent@test.com")
        _credit(self.merchant, 10_000)  # ₹100 exactly

    def test_concurrent_payouts_only_one_succeeds(self):
        results = {"succeeded": 0, "failed": 0, "errors": []}
        lock = threading.Lock()

        def attempt_payout(key):
            try:
                create_payout(
                    merchant=self.merchant,
                    bank_account=self.bank,
                    amount_paise=6_000,  
                    idempotency_key=key,
                )
                with lock:
                    results["succeeded"] += 1
            except (InsufficientFundsError, IdempotencyConflictError):
                with lock:
                    results["failed"] += 1
            except Exception as e:
                with lock:
                    results["errors"].append(str(e))
                    results["failed"] += 1
            finally:
                connection.close()

        key_a = str(uuid.uuid4())
        key_b = str(uuid.uuid4())

        thread_a = threading.Thread(target=attempt_payout, args=(key_a,))
        thread_b = threading.Thread(target=attempt_payout, args=(key_b,))

        thread_a.start()
        thread_b.start()
        thread_a.join()
        thread_b.join()

        if results["errors"]:
            self.fail(f"Unexpected errors during concurrent test: {results['errors']}")

        self.assertEqual(results["succeeded"], 1, "Exactly one payout must succeed")
        self.assertEqual(results["failed"], 1, "Exactly one payout must be rejected")

        total_payouts = Payout.objects.filter(merchant=self.merchant).count()
        self.assertEqual(total_payouts, 1, "Exactly one payout row must exist in the database")

        held = Payout.objects.filter(
            merchant=self.merchant,
            status__in=[Payout.PENDING, Payout.PROCESSING],
        ).values_list("amount_paise", flat=True)
        total_held = sum(held)
        self.assertLessEqual(
            total_held,
            10_000,
            f"Total held ({total_held} paise) must not exceed starting balance (10000 paise)",
        )

    def test_balance_invariant_after_concurrent_requests(self):
        payout, _ = create_payout(
            merchant=self.merchant,
            bank_account=self.bank,
            amount_paise=4_000,  # ₹40
            idempotency_key=str(uuid.uuid4()),
        )

        balance = get_merchant_balance(self.merchant)

        self.assertEqual(
            balance["total_credits_paise"] - balance["total_debits_paise"],
            balance["available_balance_paise"] + balance["held_balance_paise"],
            "Ledger invariant violated: credits - debits ≠ available + held",
        )



class StateMachineTest(TestCase):

    def setUp(self):
        self.merchant, self.bank = _make_merchant("StateMachine Merchant", "sm@test.com")
        _credit(self.merchant, 100_000)

    def test_illegal_transition_completed_to_pending_blocked(self):

        payout, _ = create_payout(
            merchant=self.merchant,
            bank_account=self.bank,
            amount_paise=10_000,
            idempotency_key=str(uuid.uuid4()),
        )
        payout.status = Payout.COMPLETED
        payout.save()

        with self.assertRaises(InvalidTransitionError):
            transition_payout(payout, Payout.PENDING)

    def test_illegal_transition_failed_to_completed_blocked(self):

        payout, _ = create_payout(
            merchant=self.merchant,
            bank_account=self.bank,
            amount_paise=10_000,
            idempotency_key=str(uuid.uuid4()),
        )
        payout.status = Payout.FAILED
        payout.save()

        with self.assertRaises(InvalidTransitionError):
            transition_payout(payout, Payout.COMPLETED)

    def test_legal_transition_pending_to_processing(self):

        payout, _ = create_payout(
            merchant=self.merchant,
            bank_account=self.bank,
            amount_paise=10_000,
            idempotency_key=str(uuid.uuid4()),
        )
        payout.refresh_from_db()
        payout.status = Payout.PENDING
        payout.save()

        updated = transition_payout(payout, Payout.PROCESSING)
        self.assertEqual(updated.status, Payout.PROCESSING)
        self.assertIsNotNone(updated.processing_started_at)