from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth import authenticate, login as auth_login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib import messages

from .models import VideoPost, Comment, DebateRoom, DebateMessage

@login_required(login_url='login')
def profile(request, username):
    profile_user = get_object_or_404(User, username=username)
    posts = VideoPost.objects.filter(user=profile_user).order_by('-created_at')
    return render(request, 'profile.html', {
        'user': request.user,
        'profile_user': profile_user,
        'posts': posts
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
    posts = VideoPost.objects.all().order_by('-created_at')
    debates = DebateRoom.objects.filter(is_active=True).order_by('-created_at')
    
    return render(request, 'home.html', {
        'user': request.user,
        'posts': posts,
        'debates': debates
    })

@login_required(login_url='login')
def reels(request):
    posts = VideoPost.objects.all().order_by('-created_at')
    return render(request, 'reels.html', {'user': request.user, 'posts': posts})

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
    if text:
        Comment.objects.create(post=post, user=request.user, text=text)
    return redirect('home')

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
