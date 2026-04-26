from django.urls import path
from . import views

urlpatterns = [
    path("", views.MerchantListView.as_view(), name="merchant-list"),
    path("<uuid:pk>/", views.MerchantDetailView.as_view(), name="merchant-detail"),
    path("<uuid:pk>/balance/", views.MerchantBalanceView.as_view(), name="merchant-balance"),
]