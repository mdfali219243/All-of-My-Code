from django.db import models
from django.contrib.auth.models import User

class VideoPost(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    caption = models.CharField(max_length=500, blank=True)
    image_file = models.FileField(upload_to='photos/', blank=True, null=True)
    video_file = models.FileField(upload_to='videos/', blank=True, null=True)
    shared_from = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.CASCADE, related_name='reshares'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(User, related_name='liked_posts', blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

class UserFollow(models.Model):
    follower = models.ForeignKey(User, related_name='following_set', on_delete=models.CASCADE)
    following = models.ForeignKey(User, related_name='followers_set', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')

    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"

class Comment(models.Model):
    post = models.ForeignKey(VideoPost, related_name='comments', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username} on {self.post.id}"

class DebateRoom(models.Model):
    topic = models.CharField(max_length=255)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_debates')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    host_online = models.BooleanField(default=False)
    host_last_seen = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.topic

class Conversation(models.Model):
    user_one = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations_as_one')
    user_two = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations_as_two')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user_one', 'user_two')

    def other_user(self, current_user):
        return self.user_two if self.user_one_id == current_user.id else self.user_one

    @classmethod
    def get_between(cls, user_a, user_b):
        if user_a.id > user_b.id:
            user_a, user_b = user_b, user_a
        conversation, _ = cls.objects.get_or_create(user_one=user_a, user_two=user_b)
        return conversation

    def __str__(self):
        return f'{self.user_one.username} ↔ {self.user_two.username}'

class DirectMessage(models.Model):
    conversation = models.ForeignKey(Conversation, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender.username}: {self.text[:30]}'

class DebateMessage(models.Model):
    room = models.ForeignKey(DebateRoom, related_name='messages', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} in {self.room.topic}: {self.text[:20]}"
