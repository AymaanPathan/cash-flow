import json
from channels.generic.websocket import AsyncWebsocketConsumer

class PayoutConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.merchant_id = self.scope["url_route"]["kwargs"]["merchant_id"]
        self.group = f"merchant_{self.merchant_id}"
        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group, self.channel_name)

    async def payout_update(self, event):
        await self.send(text_data=json.dumps(event["data"]))