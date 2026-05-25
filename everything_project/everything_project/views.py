from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.models import User
from django.http import Http404
from django.conf import settings
import os

def home(request):
    if not request.user.is_authenticated:
        return redirect('login')
    return render(request, 'homepage/index.html', {'user': request.user})

def serve_page(request, page):
    if not request.user.is_authenticated:
        return redirect('login')
        
    # Flask-like dynamic HTML path resolution
    if not page.endswith('.html'):
        if os.path.exists(os.path.join(settings.BASE_DIR, 'templates', f"{page}.html")):
            page = f"{page}.html"
        elif os.path.exists(os.path.join(settings.BASE_DIR, 'templates', page, "index.html")):
            page = f"{page}/index.html"
            
    try:
        return render(request, page, {'user': request.user})
    except Exception:
        raise Http404("Page not found")

def login_view(request):
    if request.user.is_authenticated:
        return redirect('home')
        
    error_message = None
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            auth_login(request, user)
            return redirect('home')
        else:
            error_message = "Invalid username or password."
            
    return render(request, 'auth/login.html', {'error': error_message})

def register_view(request):
    if request.user.is_authenticated:
        return redirect('home')
        
    error_message = None
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        confirm_password = request.POST.get('confirm_password', '')
        
        if not username or not password:
            error_message = "All fields are required."
        elif password != confirm_password:
            error_message = "Passwords do not match."
        elif User.objects.filter(username=username).exists():
            error_message = "Username is already taken."
        else:
            try:
                # Create secure Django user
                user = User.objects.create_user(username=username, password=password)
                auth_login(request, user)
                return redirect('home')
            except Exception as e:
                error_message = f"An error occurred: {str(e)}"
                
    return render(request, 'auth/register.html', {'error': error_message})

def logout_view(request):
    auth_logout(request)
    return redirect('login')
