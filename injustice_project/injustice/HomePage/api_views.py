from django.contrib.auth.models import User
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    VideoPost, Comment, DebateRoom, DebateMessage,
    UserFollow, Conversation, DirectMessage,
)
from .serializers import (
    RegisterSerializer, UserSerializer, PostSerializer,
    CommentSerializer, DebateSerializer,
)
from .views import (
    users_can_message, get_messageable_users, _connection_label, _original_post,
)


def _tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'user': UserSerializer(user).data,
            'tokens': _tokens_for_user(user),
        }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    from django.contrib.auth import authenticate

    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response(
            {'detail': 'Username and password are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(username=username, password=password)
    if user is None:
        return Response(
            {'detail': 'Invalid username or password.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    return Response({
        'user': UserSerializer(user).data,
        'tokens': _tokens_for_user(user),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response(UserSerializer(request.user).data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def posts_view(request):
    if request.method == 'POST':
        caption = request.data.get('caption', '')
        video_file = request.FILES.get('video_file')
        image_file = request.FILES.get('image_file')

        if not video_file and not image_file and not caption.strip():
            return Response(
                {'detail': 'Caption or media is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        post = VideoPost.objects.create(
            user=request.user,
            caption=caption,
            video_file=video_file if video_file else None,
            image_file=image_file if image_file else None,
        )
        serializer = PostSerializer(post, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    posts = VideoPost.objects.select_related(
        'user', 'shared_from', 'shared_from__user'
    ).prefetch_related('likes', 'comments').order_by('-created_at')
    serializer = PostSerializer(posts, many=True, context={'request': request})
    return Response({'posts': serializer.data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reels_view(request):
    posts = VideoPost.objects.prefetch_related('likes', 'comments').select_related(
        'user', 'shared_from', 'shared_from__user'
    ).order_by('-created_at')
    followed_ids = list(
        UserFollow.objects.filter(follower=request.user).values_list('following_id', flat=True)
    )
    serializer = PostSerializer(posts, many=True, context={'request': request})
    return Response({'posts': serializer.data, 'followed_ids': followed_ids})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request, username):
    profile_user = User.objects.filter(username=username).first()
    if not profile_user:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    posts = VideoPost.objects.filter(user=profile_user).select_related(
        'shared_from', 'shared_from__user'
    ).prefetch_related('likes', 'comments').order_by('-created_at')

    photo_posts = posts.exclude(image_file='').exclude(image_file__isnull=True)
    video_posts = posts.exclude(video_file='').exclude(video_file__isnull=True)
    ctx = {'request': request}

    return Response({
        'user': UserSerializer(profile_user).data,
        'posts': PostSerializer(posts, many=True, context=ctx).data,
        'photo_posts': PostSerializer(photo_posts, many=True, context=ctx).data,
        'video_posts': PostSerializer(video_posts, many=True, context=ctx).data,
        'followers_count': UserFollow.objects.filter(following=profile_user).count(),
        'following_count': UserFollow.objects.filter(follower=profile_user).count(),
        'is_following': UserFollow.objects.filter(
            follower=request.user, following=profile_user
        ).exists(),
        'is_own_profile': request.user == profile_user,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_photo_view(request, username):
    profile_user = get_object_or_404(User, username=username)
    if request.user != profile_user:
        return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

    image_file = request.FILES.get('image_file')
    if not image_file:
        return Response({'detail': 'Please select a photo to upload.'}, status=status.HTTP_400_BAD_REQUEST)

    caption = request.data.get('caption', '').strip()
    post = VideoPost.objects.create(
        user=request.user,
        image_file=image_file,
        caption=caption,
    )
    serializer = PostSerializer(post, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debates_view(request):
    debates = DebateRoom.objects.filter(is_active=True).select_related('creator').order_by('-created_at')
    serializer = DebateSerializer(debates, many=True, context={'request': request})
    return Response({'debates': serializer.data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_debate_view(request):
    topic = request.data.get('topic', '').strip()
    if not topic:
        return Response({'detail': 'Topic is required.'}, status=status.HTTP_400_BAD_REQUEST)

    room = DebateRoom.objects.create(topic=topic, creator=request.user)
    serializer = DebateSerializer(room, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debate_detail_view(request, room_id):
    room = get_object_or_404(DebateRoom, id=room_id)
    serializer = DebateSerializer(room, context={'request': request})
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def debate_messages_view(request, room_id):
    room = get_object_or_404(DebateRoom, id=room_id)

    if request.method == 'POST':
        text = request.data.get('message', '').strip()
        if not text:
            return Response({'detail': 'Message cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        msg = DebateMessage.objects.create(room=room, user=request.user, text=text)
        return Response({
            'message': {
                'id': msg.id,
                'text': msg.text,
                'created_at': msg.created_at.strftime('%H:%M'),
                'is_me': True,
                'sender_id': request.user.id,
                'sender_username': request.user.username,
                'display_name': request.user.first_name or request.user.username,
            },
        })

    last_id = int(request.GET.get('last_id', 0))
    messages = room.messages.filter(id__gt=last_id).select_related('user').order_by('created_at')
    data = [{
        'id': msg.id,
        'text': msg.text,
        'created_at': msg.created_at.strftime('%H:%M'),
        'is_me': msg.user_id == request.user.id,
        'sender_id': msg.user_id,
        'sender_username': msg.user.username,
        'display_name': msg.user.first_name or msg.user.username,
    } for msg in messages]
    return Response({'messages': data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def end_debate_view(request, room_id):
    room = get_object_or_404(DebateRoom, id=room_id)

    if request.user != room.creator:
        return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

    room.is_active = False
    room.save()

    video_file = request.FILES.get('video_file')
    if video_file:
        VideoPost.objects.create(
            user=request.user,
            caption=f"Live Debate Recording: {room.topic}",
            video_file=video_file,
        )

    return Response({'status': 'ok'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def inbox_view(request):
    conversations = Conversation.objects.filter(
        Q(user_one=request.user) | Q(user_two=request.user)
    ).select_related('user_one', 'user_two').order_by('-updated_at')

    conversation_list = []
    conversation_user_ids = set()
    for conv in conversations:
        other = conv.other_user(request.user)
        conversation_user_ids.add(other.id)
        last_msg = conv.messages.order_by('-created_at').first()
        unread = conv.messages.filter(is_read=False).exclude(sender=request.user).count()
        conversation_list.append({
            'username': other.username,
            'display_name': other.first_name or other.username,
            'last_message': last_msg.text if last_msg else None,
            'last_message_time': last_msg.created_at.strftime('%H:%M') if last_msg else None,
            'unread_count': unread,
            'connection_label': _connection_label(request.user, other),
        })

    contacts = []
    for contact in get_messageable_users(request.user):
        if contact.id in conversation_user_ids:
            continue
        contacts.append({
            'username': contact.username,
            'display_name': contact.first_name or contact.username,
            'connection_label': _connection_label(request.user, contact),
        })

    return Response({'conversations': conversation_list, 'contacts': contacts})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def inbox_messages_view(request, username):
    other = get_object_or_404(User, username=username)
    if not users_can_message(request.user, other):
        return Response({'detail': 'Not allowed.'}, status=status.HTTP_403_FORBIDDEN)

    conversation = Conversation.get_between(request.user, other)

    if request.method == 'POST':
        text = request.data.get('message', '').strip()
        if not text:
            return Response({'detail': 'Message cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        msg = DirectMessage.objects.create(
            conversation=conversation,
            sender=request.user,
            text=text,
        )
        conversation.save()

        return Response({
            'message': {
                'id': msg.id,
                'text': msg.text,
                'created_at': msg.created_at.strftime('%H:%M'),
                'is_me': True,
            },
        })

    last_id = int(request.GET.get('last_id', 0))
    new_messages = conversation.messages.filter(id__gt=last_id).select_related('sender').order_by('created_at')
    new_messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)

    data = [{
        'id': msg.id,
        'text': msg.text,
        'created_at': msg.created_at.strftime('%H:%M'),
        'is_me': msg.sender_id == request.user.id,
    } for msg in new_messages]

    return Response({'messages': data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_post_view(request, post_id):
    post = get_object_or_404(VideoPost, id=post_id)
    if request.user in post.likes.all():
        post.likes.remove(request.user)
        liked = False
    else:
        post.likes.add(request.user)
        liked = True
    return Response({'liked': liked, 'likes_count': post.likes.count()})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def post_comments_view(request, post_id):
    post = get_object_or_404(VideoPost, id=post_id)

    if request.method == 'POST':
        text = request.data.get('comment_text', '').strip()
        if not text:
            return Response({'detail': 'Comment cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        comment = Comment.objects.create(post=post, user=request.user, text=text)
        return Response({
            'comments_count': post.comments.count(),
            'comment': CommentSerializer(comment).data,
        })

    comments = post.comments.select_related('user').order_by('-created_at')
    serializer = CommentSerializer(comments, many=True)
    return Response({'comments': serializer.data, 'comments_count': comments.count()})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def share_post_view(request, post_id):
    post = get_object_or_404(VideoPost, id=post_id)
    original = _original_post(post)
    action = request.data.get('action')

    if action == 'feed':
        if original.user == request.user:
            return Response(
                {'detail': "You can't share your own post to your profile."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if VideoPost.objects.filter(user=request.user, shared_from=original).exists():
            return Response({'detail': 'Already shared on your profile.'}, status=status.HTTP_400_BAD_REQUEST)
        VideoPost.objects.create(user=request.user, shared_from=original)
        return Response({'status': 'ok', 'message': 'Shared to your profile!'})

    if action == 'dm':
        username = request.data.get('username', '').strip()
        recipient = get_object_or_404(User, username=username)
        if not users_can_message(request.user, recipient):
            return Response({'detail': 'You can only send to followers and friends.'}, status=status.HTTP_403_FORBIDDEN)
        link = request.build_absolute_uri('/') + f'#post-{original.id}'
        preview = original.caption[:80] + ('…' if len(original.caption) > 80 else '') if original.caption else 'a post'
        text = f'Check out this post by @{original.user.username}: "{preview}"\n{link}'
        conversation = Conversation.get_between(request.user, recipient)
        DirectMessage.objects.create(conversation=conversation, sender=request.user, text=text)
        conversation.save()
        return Response({'status': 'ok', 'message': f'Sent to @{username}'})

    return Response({'detail': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def share_contacts_view(request):
    contacts = [{
        'username': u.username,
        'display_name': u.first_name or u.username,
    } for u in get_messageable_users(request.user)]
    return Response({'contacts': contacts})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def follow_user_view(request, username):
    target = get_object_or_404(User, username=username)
    if target == request.user:
        return Response({'detail': 'Cannot follow yourself.'}, status=status.HTTP_400_BAD_REQUEST)

    follow, created = UserFollow.objects.get_or_create(follower=request.user, following=target)
    if not created:
        follow.delete()
        following = False
    else:
        following = True
    return Response({'following': following})


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root_view(request):
    return Response({
        'name': 'Injustice API',
        'endpoints': {
            'register': '/api/auth/register/',
            'login': '/api/auth/login/',
            'token_refresh': '/api/auth/token/refresh/',
            'me': '/api/auth/me/',
            'posts': '/api/posts/',
            'reels': '/api/reels/',
            'debates': '/api/debates/',
            'inbox': '/api/inbox/',
            'profile': '/api/profile/<username>/',
        },
    })
