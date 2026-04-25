from django.db.models import Sum, Q
from django.db.models.functions import Coalesce
from django.db.models import Value, BigIntegerField
from payouts.models import Payout
from .models import LedgerEntry


def get_merchant_balance(merchant) -> dict:
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

    available = total_credits - total_debits

    return {
        "available_balance_paise": available,
        "held_balance_paise": held,
        "total_credits_paise": total_credits,
        "total_debits_paise": total_debits,
        "available_balance_inr": f"{available / 100:.2f}",
        "held_balance_inr": f"{held / 100:.2f}",
    }