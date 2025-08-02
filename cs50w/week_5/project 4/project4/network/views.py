from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import User, Post, Follow


def index(request):
    if request.user.is_authenticated:
        followers = request.user.followers.all()
        followers_count = followers.count()
        following = request.user.followings.all()
        following_count = following.count()
        posts = Post.objects.all()
        return render(request, "network/index.html", {
            "posts": posts,
            "profile": request.user,
            "followers_count": followers_count,
            "following_count": following_count,
            "followers": followers,
            "following": following,
            "posts_count": posts.count(),
            })
    else:
        return render(request, "network/login.html")

def profile(request):
    if request.user.is_authenticated:
        followers = request.user.followers.all()
        followers_count = followers.count()
        following = request.user.followings.all()
        following_count = following.count()
        posts = Post.objects.all()
        return render(request, "network/profile.html", {
            "posts": posts,
            "profile": request.user,
            "followers_count": followers_count,
            "following_count": following_count,
            "followers": followers,
            "following": following,
            "posts_count": posts.count(),
            })
    else:
        return render(request, "network/login.html")

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
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


