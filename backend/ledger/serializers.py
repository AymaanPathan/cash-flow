from rest_framework import serializers
from .models import LedgerEntry


class LedgerEntrySerializer(serializers.ModelSerializer):
    amount_inr = serializers.SerializerMethodField()

    class Meta:
        model = LedgerEntry
        fields = [
            "id",
            "entry_type",
            "amount_paise",
            "amount_inr",
            "description",
            "payout",
            "created_at",
        ]

    def get_amount_inr(self, obj):
        return f"{obj.amount_paise / 100:.2f}"