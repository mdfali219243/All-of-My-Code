from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    content = models.TextField(max_length=1000)
    timestamp = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(User, related_name="likes", blank=True)

    def __str__(self):
        return f"Post {self.id} by {self.user}"

    class Meta:
        ordering = ["-timestamp"]




class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followings")
    def __str__(self):
        return f"{self.follower} follows {self.following}"
    class Meta:
        unique_together = ('follower', 'following')
        