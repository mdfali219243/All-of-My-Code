# auctions/models.py (UPDATED)

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


class Category(models.Model):
    # Renamed 'categories' field to 'name' for clarity and consistency
    name = models.CharField(max_length=64, unique=True)

    def __str__(self):
        # Access the field using self.name
        return self.name # Simplified to just return the name


class Listing(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(max_length=1000)
    starting_bid = models.DecimalField(max_digits=10, decimal_places=2)
    image_url = models.URLField(max_length=200, blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="listings", blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_listings")
    is_active = models.BooleanField(default=True)
    winner = models.ForeignKey(User, on_delete=models.SET_NULL, related_name="won_listing", blank=True, null=True)
    create_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} by {self.created_by.username}"

    def get_current_bid(self):
        # Correctly uses 'item_bids' from Bid model's related_name
        if self.item_bids.exists():
            return self.item_bids.order_by('-amount').first().amount
        return self.starting_bid

    def get_bid_count(self):
        # Corrected to use 'item_bids' from Bid model's related_name
        return self.item_bids.count()


class Bid(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bids_placed")
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="item_bids")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-amount', 'timestamp'] # Order by amount descending, then timestamp ascending

    def __str__(self):
        return f"{self.amount} bid by {self.user.username} on {self.listing.title}"


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments") # Changed related_name to 'comments' (singular)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="comments") # Changed related_name to 'comments' (singular)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username} on {self.listing.title} at {self.timestamp.strftime('%Y-%m-%d %H:%M')}" #
    

class Watchlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="watchlist")
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="watchlisted_by")
    name = models.CharField(max_length=64, unique=True)

    def __str__(self):
        return f"{self.name} - {self.user.username} watching {self.listing.title}"