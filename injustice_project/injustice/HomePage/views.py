from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login as auth_login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib import messages

# Create your views here.
from .models import VideoPost

@login_required(login_url='login')
def home(request):
    if request.method == 'POST':
        caption = request.POST.get('caption', '')
        video_file = request.FILES.get('video_file')
        
        if video_file:
            # Create a new VideoPost if a valid user uploaded a video
            VideoPost.objects.create(
                user=request.user,
                caption=caption,
                video_file=video_file
            )
            return redirect('home')

    # Fetch all video posts dynamically
    posts = VideoPost.objects.all().order_by('-created_at')
    
    return render(request, 'home.html', {
        'user': request.user,
        'posts': posts
    })

@login_required(login_url='login')

def reels(request):
    return render(request, 'reels.html', {'user': request.user})

@login_required(login_url='login')
def feed(request):
    return render(request, 'feed.html', {'user': request.user})

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
