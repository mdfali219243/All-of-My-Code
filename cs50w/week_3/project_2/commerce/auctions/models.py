from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


class Category(models.Model):
    categories = models.CharField(max_length=64)

    def __str__(self): 
        return f"Category: {self.categories}" # Access the field using self.categories

class Listing(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(max_length=1000)
    starting_bid = models.DecimalField(max_digits=10, decimal_places=2)
    image_url = models.URLField(max_length=200, blank=True, null=True)
    categories = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="product_type", blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_listings")
    is_active = models.BooleanField(default=True)
    winner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="won_listing")
    create_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.title} by {self.created_by.username}"
    
    def get_current_bid(self):
        highest_bid = self.bids.order_by('-amount').first()
        return highest_bid if highest_bid else self.starting_bid
    
    def get_bid_count(self):
        return self.bids.count()
    

class Bid(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bids_placed")
    listing= models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="item_bids")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-amount', 'timestamp']

    def __str__(self):
        return f"{self.amount} bid by {self.user.username} on {self.listing.title}"

class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comment")
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="comment")
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username} on {self.listing.title} at {self.timestamp}"