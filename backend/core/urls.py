from django.contrib import admin
from django.urls import path, include
from ledger.views import MerchantLedgerView
import django_eventstream


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/merchants/", include("merchants.urls")),
    path("api/v1/merchants/<uuid:pk>/ledger/", MerchantLedgerView.as_view(), name="merchant-ledger"),
    path("api/v1/payouts/", include("payouts.urls")),
     path("events/<channel>/", include(django_eventstream.urls)),
]