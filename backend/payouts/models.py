from django.db import models

class TestUser(models.Model):
    name = models.CharField(max_length=100)