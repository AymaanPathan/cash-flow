from rest_framework import generics
from django.shortcuts import get_object_or_404

from merchants.models import Merchant
from .models import LedgerEntry
from .serializers import LedgerEntrySerializer


class MerchantLedgerView(generics.ListAPIView):
    serializer_class = LedgerEntrySerializer

    def get_queryset(self):
        merchant = get_object_or_404(Merchant, pk=self.kwargs["pk"])
        return LedgerEntry.objects.filter(merchant=merchant).select_related("payout")