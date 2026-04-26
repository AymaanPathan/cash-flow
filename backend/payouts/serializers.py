from rest_framework import serializers
from .models import Payout


class PayoutSerializer(serializers.ModelSerializer):
    amount_inr = serializers.SerializerMethodField()

    class Meta:
        model = Payout
        fields = [
            "id", "merchant", "bank_account", "amount_paise", "amount_inr",
            "status", "attempt_count", "failure_reason",
            "created_at", "updated_at", "processing_started_at", "completed_at",
        ]

    def get_amount_inr(self, obj):
        return f"{obj.amount_paise / 100:.2f}"


class CreatePayoutSerializer(serializers.Serializer):
    amount_paise = serializers.IntegerField(min_value=100)
    bank_account_id = serializers.UUIDField()