from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import Merchant
from .serializers import MerchantSerializer
from ledger.services import get_merchant_balance


class MerchantListView(generics.ListAPIView):
    queryset = Merchant.objects.prefetch_related("bank_accounts").all()
    serializer_class = MerchantSerializer


class MerchantDetailView(generics.RetrieveAPIView):
    queryset = Merchant.objects.prefetch_related("bank_accounts").all()
    serializer_class = MerchantSerializer


class MerchantBalanceView(APIView):
    def get(self, request, pk):
        merchant = get_object_or_404(Merchant, pk=pk)
        balance = get_merchant_balance(merchant)
        return Response(balance)