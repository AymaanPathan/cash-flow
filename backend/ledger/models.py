import uuid
from django.db import models


class LedgerEntry(models.Model):

    CREDIT = "credit"
    DEBIT = "debit"
    ENTRY_TYPES = [(CREDIT, "Credit"), (DEBIT, "Debit")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(
        "merchants.Merchant", on_delete=models.PROTECT, related_name="ledger_entries"
    )
    entry_type = models.CharField(max_length=6, choices=ENTRY_TYPES)

    amount_paise = models.BigIntegerField()

    description = models.CharField(max_length=500, blank=True)

    payout = models.ForeignKey(
        "payouts.Payout",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="ledger_entries",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["merchant", "entry_type"]),
            models.Index(fields=["merchant", "created_at"]),
        ]

    def __str__(self):
        return f"{self.entry_type.upper()} ₹{self.amount_paise/100:.2f} — {self.merchant}"