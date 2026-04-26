import uuid
import logging

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from merchants.models import BankAccount
from .models import Payout
from .serializers import PayoutSerializer, CreatePayoutSerializer
from .services import create_payout, InsufficientFundsError, IdempotencyConflictError

logger = logging.getLogger(__name__)


class PayoutCreateView(APIView):
    def post(self, request):
        idempotency_key = request.headers.get("Idempotency-Key", "").strip()
        if not idempotency_key:
            return Response({"error": "Idempotency-Key header is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            uuid.UUID(idempotency_key)
        except ValueError:
            return Response({"error": "Idempotency-Key must be a valid UUID v4."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = CreatePayoutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        amount_paise = serializer.validated_data["amount_paise"]
        bank_account_id = serializer.validated_data["bank_account_id"]
        bank_account = get_object_or_404(BankAccount, pk=bank_account_id)
        merchant = bank_account.merchant

        try:
            payout, created = create_payout(
                merchant=merchant,
                bank_account=bank_account,
                amount_paise=amount_paise,
                idempotency_key=idempotency_key,
            )
        except InsufficientFundsError as e:
            return Response({"error": str(e)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        except IdempotencyConflictError as e:
            return Response({"error": str(e)}, status=status.HTTP_409_CONFLICT)
        except Exception as e:
            logger.exception(f"Unexpected error: {e}")
            return Response({"error": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        http_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(PayoutSerializer(payout).data, status=http_status)


class PayoutListView(generics.ListAPIView):
    serializer_class = PayoutSerializer

    def get_queryset(self):
        queryset = Payout.objects.select_related("merchant", "bank_account")
        merchant_id = self.request.query_params.get("merchant_id")
        if merchant_id:
            queryset = queryset.filter(merchant_id=merchant_id)
        return queryset


class PayoutDetailView(generics.RetrieveAPIView):
    queryset = Payout.objects.select_related("merchant", "bank_account")
    serializer_class = PayoutSerializer