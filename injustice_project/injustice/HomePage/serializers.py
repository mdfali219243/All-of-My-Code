from django.contrib.auth.models import User
from rest_framework import serializers

from .models import VideoPost, Comment, UserFollow, DebateRoom


def _source_post(post):
    while post.shared_from_id:
        post = post.shared_from
    return post


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name']

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already exists.')
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'username', 'display_name', 'text', 'created_at']

    def get_display_name(self, obj):
        return obj.user.first_name or obj.user.username


class PostSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    display_name = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    video_url = serializers.SerializerMethodField()
    shared_from_username = serializers.SerializerMethodField()
    source_id = serializers.SerializerMethodField()
    source_username = serializers.SerializerMethodField()
    source_display_name = serializers.SerializerMethodField()

    class Meta:
        model = VideoPost
        fields = [
            'id', 'username', 'display_name', 'caption',
            'image_url', 'video_url', 'created_at',
            'likes_count', 'comments_count', 'is_liked',
            'shared_from_username', 'is_published',
            'source_id', 'source_username', 'source_display_name',
        ]

    def get_display_name(self, obj):
        return obj.user.first_name or obj.user.username

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

    def get_image_url(self, obj):
        if obj.image_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image_file.url)
        return None

    def get_video_url(self, obj):
        if obj.video_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.video_file.url)
        return None

    def get_shared_from_username(self, obj):
        if obj.shared_from_id:
            return obj.shared_from.user.username
        return None

    def get_source_id(self, obj):
        return _source_post(obj).id

    def get_source_username(self, obj):
        return _source_post(obj).user.username

    def get_source_display_name(self, obj):
        source = _source_post(obj)
        return source.user.first_name or source.user.username


class ProfileSerializer(serializers.Serializer):
    user = UserSerializer()
    posts = PostSerializer(many=True)
    photo_posts = PostSerializer(many=True)
    video_posts = PostSerializer(many=True)
    followers_count = serializers.IntegerField()
    following_count = serializers.IntegerField()
    is_following = serializers.BooleanField()
    is_own_profile = serializers.BooleanField()


class DebateSerializer(serializers.ModelSerializer):
    creator_username = serializers.CharField(source='creator.username', read_only=True)
    creator_display_name = serializers.SerializerMethodField()
    is_host = serializers.SerializerMethodField()

    class Meta:
        model = DebateRoom
        fields = [
            'id', 'topic', 'creator_username', 'creator_display_name',
            'created_at', 'is_active', 'is_host',
        ]

    def get_creator_display_name(self, obj):
        return obj.creator.first_name or obj.creator.username

    def get_is_host(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.creator_id == request.user.id
        return False
