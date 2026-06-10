from django.db.models import Q
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth import authenticate, login as auth_login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib import messages

from .models import VideoPost, Comment, DebateRoom, DebateMessage, UserFollow, Conversation, DirectMessage


def users_can_message(user_a, user_b):
    if user_a == user_b:
        return False
    return UserFollow.objects.filter(
        Q(follower=user_a, following=user_b) | Q(follower=user_b, following=user_a)
    ).exists()


def get_messageable_users(user):
    following_ids = UserFollow.objects.filter(follower=user).values_list('following_id', flat=True)
    follower_ids = UserFollow.objects.filter(following=user).values_list('follower_id', flat=True)
    return User.objects.filter(id__in=set(following_ids) | set(follower_ids)).order_by('username')


def _connection_label(current_user, other_user):
    i_follow = UserFollow.objects.filter(follower=current_user, following=other_user).exists()
    they_follow = UserFollow.objects.filter(follower=other_user, following=current_user).exists()
    if i_follow and they_follow:
        return 'Friend'
    if i_follow:
        return 'Following'
    return 'Follower'

@login_required(login_url='login')
def profile(request, username):
    profile_user = get_object_or_404(User, username=username)
    posts = VideoPost.objects.filter(user=profile_user).select_related(
        'shared_from', 'shared_from__user'
    ).prefetch_related('likes', 'comments').order_by('-created_at')
    photo_posts = posts.exclude(image_file='').exclude(image_file__isnull=True)
    video_posts = posts.exclude(video_file='').exclude(video_file__isnull=True)
    is_following = UserFollow.objects.filter(follower=request.user, following=profile_user).exists()
    followers_count = UserFollow.objects.filter(following=profile_user).count()
    following_count = UserFollow.objects.filter(follower=profile_user).count()
    return render(request, 'profile.html', {
        'user': request.user,
        'profile_user': profile_user,
        'posts': posts,
        'photo_posts': photo_posts,
        'video_posts': video_posts,
        'is_following': is_following,
        'followers_count': followers_count,
        'following_count': following_count,
    })

@login_required(login_url='login')
def home(request):
    if request.method == 'POST':
        caption = request.POST.get('caption', '')
        video_file = request.FILES.get('video_file')
        
        if video_file or caption.strip():
            # Create a new VideoPost if a valid user uploaded a video or text
            VideoPost.objects.create(
                user=request.user,
                caption=caption,
                video_file=video_file if video_file else None
            )
            return redirect('home')

    # Fetch all video posts dynamically
    posts = VideoPost.objects.select_related('user', 'shared_from', 'shared_from__user').order_by('-created_at')
    debates = DebateRoom.objects.filter(is_active=True).order_by('-created_at')
    
    return render(request, 'home.html', {
        'user': request.user,
        'posts': posts,
        'debates': debates
    })

@login_required(login_url='login')
@require_POST
def upload_photo(request, username):
    profile_user = get_object_or_404(User, username=username)
    if request.user != profile_user:
        return JsonResponse({'status': 'error', 'message': 'Not authorized'}, status=403)

    image_file = request.FILES.get('image_file')
    if not image_file:
        messages.error(request, 'Please select a photo to upload.')
        return redirect('profile', username=username)

    caption = request.POST.get('caption', '').strip()
    VideoPost.objects.create(
        user=request.user,
        image_file=image_file,
        caption=caption,
    )
    return redirect(reverse('profile', kwargs={'username': username}) + '?tab=photos')

@login_required(login_url='login')
def reels(request):
    posts = VideoPost.objects.prefetch_related('likes', 'comments').select_related('user').order_by('-created_at')
    followed_ids = set(
        UserFollow.objects.filter(follower=request.user).values_list('following_id', flat=True)
    )
    return render(request, 'reels.html', {
        'user': request.user,
        'posts': posts,
        'followed_ids': followed_ids,
    })

def _original_post(post):
    while post.shared_from_id:
        post = post.shared_from
    return post


@login_required(login_url='login')
@require_POST
def share_post(request, post_id):
    post = get_object_or_404(VideoPost, id=post_id)
    original = _original_post(post)
    action = request.POST.get('action')

    if action == 'feed':
        if original.user == request.user:
            return JsonResponse({'status': 'error', 'message': "You can't share your own post to your profile."}, status=400)
        if VideoPost.objects.filter(user=request.user, shared_from=original).exists():
            return JsonResponse({'status': 'error', 'message': 'Already shared on your profile.'}, status=400)
        VideoPost.objects.create(user=request.user, shared_from=original)
        return JsonResponse({'status': 'ok', 'message': 'Shared to your profile!'})

    if action == 'dm':
        username = request.POST.get('username', '').strip()
        recipient = get_object_or_404(User, username=username)
        if not users_can_message(request.user, recipient):
            return JsonResponse({'status': 'error', 'message': 'You can only send to followers and friends.'}, status=403)
        link = request.build_absolute_uri(reverse('home')) + f'#post-{original.id}'
        preview = original.caption[:80] + ('…' if len(original.caption) > 80 else '') if original.caption else 'a post'
        text = f'Check out this post by @{original.user.username}: "{preview}"\n{link}'
        conversation = Conversation.get_between(request.user, recipient)
        DirectMessage.objects.create(conversation=conversation, sender=request.user, text=text)
        conversation.save()
        return JsonResponse({'status': 'ok', 'message': f'Sent to @{username}'})

    return JsonResponse({'status': 'error', 'message': 'Invalid action'}, status=400)


@login_required(login_url='login')
def get_share_contacts(request):
    contacts = [{
        'username': u.username,
        'display_name': u.first_name or u.username,
    } for u in get_messageable_users(request.user)]
    return JsonResponse({'contacts': contacts})


@login_required(login_url='login')
@require_POST
def like_post(request, post_id):
    post = get_object_or_404(VideoPost, id=post_id)
    if request.user in post.likes.all():
        post.likes.remove(request.user)
        liked = False
    else:
        post.likes.add(request.user)
        liked = True
    return JsonResponse({'liked': liked, 'likes_count': post.likes.count()})

@login_required(login_url='login')
@require_POST
def add_comment(request, post_id):
    post = get_object_or_404(VideoPost, id=post_id)
    text = request.POST.get('comment_text', '').strip()
    if not text:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'status': 'error', 'message': 'Comment cannot be empty'}, status=400)
        return redirect('home')

    comment = Comment.objects.create(post=post, user=request.user, text=text)
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'ok',
            'comments_count': post.comments.count(),
            'comment': {
                'id': comment.id,
                'username': comment.user.username,
                'display_name': comment.user.first_name or comment.user.username,
                'text': comment.text,
                'created_at': comment.created_at.strftime('%b %d'),
            },
        })
    return redirect('home')

@login_required(login_url='login')
def get_post_comments(request, post_id):
    post = get_object_or_404(VideoPost, id=post_id)
    comments = post.comments.select_related('user').order_by('-created_at')
    data = [{
        'id': c.id,
        'username': c.user.username,
        'display_name': c.user.first_name or c.user.username,
        'text': c.text,
        'created_at': c.created_at.strftime('%b %d'),
    } for c in comments]
    return JsonResponse({'comments': data, 'comments_count': len(data)})

@login_required(login_url='login')
@require_POST
def follow_user(request, username):
    target = get_object_or_404(User, username=username)
    if target == request.user:
        return JsonResponse({'status': 'error', 'message': 'Cannot follow yourself'}, status=400)

    follow, created = UserFollow.objects.get_or_create(follower=request.user, following=target)
    if not created:
        follow.delete()
        following = False
    else:
        following = True
    return JsonResponse({'following': following})

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            auth_login(request, user)
            return redirect('home')
        else:
            messages.error(request, 'Invalid username or password.')
            
    return render(request, 'login.html')

def register(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email', '') # Ensure email field is collected
        password = request.POST.get('password')
        first_name = request.POST.get('first_name', '')
        last_name = request.POST.get('last_name', '')
        
        # Check if username exists
        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already exists.')
            return render(request, 'register.html')
            
        user = User.objects.create_user(
            username=username, 
            email=email, 
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        auth_login(request, user)
        return redirect('home')
        
    return render(request, 'register.html')

def logout_view(request):
    logout(request)
    return redirect('login')

@login_required(login_url='login')
def inbox(request, username=None):
    conversations = Conversation.objects.filter(
        Q(user_one=request.user) | Q(user_two=request.user)
    ).select_related('user_one', 'user_two').order_by('-updated_at')

    conversation_list = []
    for conv in conversations:
        other = conv.other_user(request.user)
        last_msg = conv.messages.order_by('-created_at').first()
        unread = conv.messages.filter(is_read=False).exclude(sender=request.user).count()
        conversation_list.append({
            'conversation': conv,
            'other_user': other,
            'last_message': last_msg,
            'unread_count': unread,
            'connection_label': _connection_label(request.user, other),
        })

    conversation_user_ids = {item['other_user'].id for item in conversation_list}
    contacts = []
    for contact in get_messageable_users(request.user):
        if contact.id in conversation_user_ids:
            continue
        contacts.append({
            'user': contact,
            'connection_label': _connection_label(request.user, contact),
        })

    active_user = None
    active_messages = []
    if username:
        active_user = get_object_or_404(User, username=username)
        if not users_can_message(request.user, active_user):
            messages.error(request, 'You can only message followers and friends.')
            return redirect('inbox')
        active_messages = Conversation.get_between(
            request.user, active_user
        ).messages.select_related('sender').order_by('created_at')
        active_messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)

    return render(request, 'inbox.html', {
        'user': request.user,
        'conversations': conversation_list,
        'contacts': contacts,
        'active_user': active_user,
        'active_messages': active_messages,
    })


@login_required(login_url='login')
@require_POST
def send_inbox_message(request, username):
    recipient = get_object_or_404(User, username=username)
    if not users_can_message(request.user, recipient):
        return JsonResponse({'status': 'error', 'message': 'Not allowed'}, status=403)

    text = request.POST.get('message', '').strip()
    if not text:
        return JsonResponse({'status': 'error', 'message': 'Message cannot be empty'}, status=400)

    conversation = Conversation.get_between(request.user, recipient)
    msg = DirectMessage.objects.create(
        conversation=conversation,
        sender=request.user,
        text=text,
    )
    conversation.save()

    return JsonResponse({
        'status': 'ok',
        'message': {
            'id': msg.id,
            'text': msg.text,
            'created_at': msg.created_at.strftime('%H:%M'),
            'is_me': True,
        },
    })


@login_required(login_url='login')
def get_inbox_messages(request, username):
    other = get_object_or_404(User, username=username)
    if not users_can_message(request.user, other):
        return JsonResponse({'status': 'error'}, status=403)

    conversation = Conversation.get_between(request.user, other)
    last_id = int(request.GET.get('last_id', 0))
    new_messages = conversation.messages.filter(id__gt=last_id).select_related('sender').order_by('created_at')
    new_messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)

    data = [{
        'id': msg.id,
        'text': msg.text,
        'created_at': msg.created_at.strftime('%H:%M'),
        'is_me': msg.sender_id == request.user.id,
    } for msg in new_messages]

    return JsonResponse({'messages': data})


@login_required(login_url='login')
def create_debate(request):
    if request.method == 'POST':
        topic = request.POST.get('topic', '').strip()
        if topic:
            room = DebateRoom.objects.create(topic=topic, creator=request.user)
            return redirect('debate_room', room_id=room.id)
    return redirect('home')

@login_required(login_url='login')
def debate_room(request, room_id):
    room = get_object_or_404(DebateRoom, id=room_id)
    if not room.is_active:
        messages.info(request, "This live debate has ended. You can find the recording in the host's posts.")
        return redirect('home')
    return render(request, 'debate_room.html', {'room': room, 'user': request.user})

@login_required(login_url='login')
@require_POST
def send_debate_message(request, room_id):
    room = get_object_or_404(DebateRoom, id=room_id)
    text = request.POST.get('message', '').strip()
    if text:
        msg = DebateMessage.objects.create(room=room, user=request.user, text=text)
        return JsonResponse({'status': 'ok'})
    return JsonResponse({'status': 'error'})

@login_required(login_url='login')
def get_debate_messages(request, room_id):
    room = get_object_or_404(DebateRoom, id=room_id)
    last_id = request.GET.get('last_id', 0)
    messages = room.messages.filter(id__gt=last_id).order_by('created_at')
    
    data = []
    for msg in messages:
        data.append({
            'id': msg.id,
            'user': msg.user.first_name or msg.user.username,
            'text': msg.text,
            'created_at': msg.created_at.strftime('%H:%M'),
            'is_me': msg.user == request.user
        })
    return JsonResponse({'messages': data})

@login_required(login_url='login')
@require_POST
def end_debate_upload(request, room_id):
    room = get_object_or_404(DebateRoom, id=room_id)
    
    # Only creator can end debate
    if request.user != room.creator:
        return JsonResponse({'status': 'error', 'message': 'Not authorized'}, status=403)
        
    room.is_active = False
    room.save()
    
    video_file = request.FILES.get('video_file')
    if video_file:
        # Save as a VideoPost so it shows up in the feed
        VideoPost.objects.create(
            user=request.user,
            caption=f"Live Debate Recording: {room.topic}",
            video_file=video_file
        )
        
    return JsonResponse({'status': 'ok'})
