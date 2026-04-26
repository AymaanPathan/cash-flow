from django.contrib import admin
from django.urls import path, include
from ledger.views import MerchantLedgerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/merchants/", include("merchants.urls")),
    path("api/v1/merchants/<uuid:pk>/ledger/", MerchantLedgerView.as_view(), name="merchant-ledger"),
    path("api/v1/payouts/", include("payouts.urls")),
]