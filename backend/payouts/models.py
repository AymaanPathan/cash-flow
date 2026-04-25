import uuid
from django.db import models
from django.utils import timezone


class Payout(models.Model):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (PROCESSING, "Processing"),
        (COMPLETED, "Completed"),
        (FAILED, "Failed"),
    ]

    LEGAL_TRANSITIONS = {
        PENDING: {PROCESSING},
        PROCESSING: {COMPLETED, FAILED},
        COMPLETED: set(),  
        FAILED: set(),     
    }

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(
        "merchants.Merchant", on_delete=models.PROTECT, related_name="payouts"
    )
    bank_account = models.ForeignKey(
        "merchants.BankAccount", on_delete=models.PROTECT, related_name="payouts"
    )

    amount_paise = models.BigIntegerField()

    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=PENDING)
    attempt_count = models.PositiveSmallIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processing_started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    failure_reason = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["merchant", "status"]),
            models.Index(fields=["status", "processing_started_at"]),
        ]

    def __str__(self):
        return f"Payout {self.id} — ₹{self.amount_paise/100:.2f} [{self.status}]"

    def can_transition_to(self, new_status: str) -> bool:
        return new_status in self.LEGAL_TRANSITIONS.get(self.status, set())


class IdempotencyKey(models.Model):
    IN_FLIGHT = "in_flight"
    COMPLETE = "complete"

    STATUS_CHOICES = [
        (IN_FLIGHT, "In flight"),
        (COMPLETE, "Complete"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(
        "merchants.Merchant", on_delete=models.CASCADE, related_name="idempotency_keys"
    )
    key = models.CharField(max_length=255)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=IN_FLIGHT)

    cached_response = models.JSONField(null=True, blank=True)

    payout = models.OneToOneField(
        Payout,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="idempotency_key",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("merchant", "key")]
        indexes = [
            models.Index(fields=["merchant", "key"]),
            models.Index(fields=["created_at"]),
        ]

    def is_expired(self) -> bool:
        from datetime import timedelta
        return timezone.now() > self.created_at + timedelta(hours=24)

    def __str__(self):
        return f"IdempotencyKey {self.key[:8]}… [{self.merchant}]"