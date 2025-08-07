from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from .forms import CustomUserCreationForm
from django.db import IntegrityError
from django.http import HttpResponseRedirect
from django.urls import reverse
from .models import User


# Create your views here.
def index(request):
    return render(request, "Calendar/index.html")

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "Calendar/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "Calendar/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        print("Registration POST request received")  
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")
        confirmation = request.POST.get("confirmation")
        
        print(f"Username: {username}") 
        print(f"Email: {email}")        
        
        if not all([username, email, password, confirmation]):
            print("Missing required fields") 
            return render(request, "Calendar/register.html", {
                "message": "All fields are required."
            })
            
        if password != confirmation:
            print("Passwords don't match") 
            return render(request, "Calendar/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            print("Attempting to create user") 
            user = User.objects.create_user(username, email, password)
            user.save()
            print(f"User {username} created successfully") 
        except IntegrityError as e:
            print(f"IntegrityError: {e}") 
            return render(request, "Calendar/register.html", {
                "message": "Username already taken."
            })
            
        # Log the user in
        login(request, user)
        print(f"User {username} logged in") 
        
        # Debug: Print session data
        print(f"Session data after login: {request.session.items()}")
        
        # Debug: Try to get the user from the request
        print(f"Request user after login: {request.user}")
        
        # Debug: Try to redirect to index
        print("Redirecting to index")
        return HttpResponseRedirect(reverse("index"))
    else:
        print("Serving registration form") 
        return render(request, "Calendar/register.html")


def settings(request):
    return render(request, "Calendar/settings.html")

def tasks(request):
    return render(request, "Calendar/tasks.html")
