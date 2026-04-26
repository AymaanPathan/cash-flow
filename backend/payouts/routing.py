from django.urls import path
from .consumers import PayoutConsumer

websocket_urlpatterns = [
    path("ws/merchant/<uuid:merchant_id>/", PayoutConsumer.as_asgi()),
]