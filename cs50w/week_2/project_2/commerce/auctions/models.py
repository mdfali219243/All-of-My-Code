from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


class Listing(models.Model):
    item_name = models.CharField(max_length=100)
    item_price = models.IntegerField
    item_details = models.CharField(max_length=1000)
    

    def __str__(self):
        return f"{self.item_name}, Which price is {self.price} and about the product is {self.item_details}"
    