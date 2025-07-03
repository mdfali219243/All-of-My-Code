from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass



    
class Categories(models.Model):
    categories = models.CharField(max_length=64)

    def __str__(self, categories):
        return f"This product in the categories of {categories}"
    

class CreateListing(models.Model):
    item_name = models.CharField(max_length=100)
    item_bid = models.IntegerField()
    item_description = models.CharField(max_length=1000)
    categories = models.ForeignKey(Categories, on_delete=models.CASCADE, related_name="product")

    def __str__(self):
        return f"{self.item_name}, Which price is {self.price} and about the product is {self.item_details}"