from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render, get_object_or_404
from django.urls import reverse
from django.views.decorators.http import require_POST, require_http_methods
from django.contrib.auth.decorators import login_required
import json
import random

from .models import User, Post, Follow, Like

def index(request):
    if request.user.is_authenticated:
        posts = Post.objects.all()
        return render(request, "network/index.html", {
            "posts": posts,
            "profile": request.user,
            })
    else:
        return render(request, "network/login.html")

#all posts
@login_required
def All_posts(request):
    if request.method == "POST":
        data = json.loads(request.body)
        content = data.get("content")
        post = Post.objects.create(user=request.user, content=content)
        return JsonResponse({
            "user": {"username": request.user.username},
            "timestamp": post.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "content": post.content
        })
    else:
        return JsonResponse({
            "error": "POST request required.",
            "status": 400
        })

#profile page
def profile(request, username):
    # Get the user profile being viewed
    user = get_object_or_404(User, username=username)

    if request.user.is_authenticated:
        # Check if the logged-in user is following this profile
        # This assumes your User model has a ManyToMany field named 'followers'
        # that correctly links a user to those who follow them.
        is_following = user.followers.filter(pk=request.user.pk).exists()

        followers_count = user.followers.count()
        following_count = user.followings.count()
        posts = Post.objects.filter(user=user)
        
        # Emoji setup
        EMOJIS = ["😀", "😎", "🦄", "🐱", "🌟", "🍕", "🚀", "🐶", "🎉", "👾", "🐼", "🦊", "🐸", "🦁", "🐵", "🐧", "🐢", "🐙", "🦋", "🐞", "🦕"]
        profile_emoji = random.choice(EMOJIS)
        
        return render(request, "network/profile.html", {
            "posts": posts,
            "profile": user,
            "followers_count": followers_count,
            "following_count": following_count,
            "posts_count": posts.count(),
            "profile_emoji": profile_emoji,
            "is_following": is_following,  # <-- The new variable
        })
    else:
        # If the user is not authenticated, redirect them to the login page
        return render(request, "network/login.html")

#following page
@login_required
def following(request):
    # Get all users the current user follows
    following_users = User.objects.filter(followers__follower=request.user)
    # Get posts from those users
    posts = Post.objects.filter(user__in=following_users)
    return render(request, "network/following_posts.html", {
        "posts": posts,
        "profile": request.user,
    })

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


# New views for follow/unfollow functionality
@login_required
@require_POST
def follow_user(request, username):
    """
    Handles a POST request to follow a user.
    """
    try:
        user_to_follow = User.objects.get(username=username)
        # Create a new Follow relationship
        Follow.objects.get_or_create(follower=request.user, following=user_to_follow)
        return JsonResponse({"success": True}, status=200)
    except User.DoesNotExist:
        return JsonResponse({"success": False, "error": "User not found."}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)

@login_required
@require_POST
def unfollow_user(request, username):
    """
    Handles a POST request to unfollow a user.
    """
    try:
        user_to_unfollow = User.objects.get(username=username)
        # Delete the Follow relationship
        Follow.objects.filter(follower=request.user, following=user_to_unfollow).delete()
        return JsonResponse({"success": True}, status=200)
    except User.DoesNotExist:
        return JsonResponse({"success": False, "error": "User not found."}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@login_required
@require_http_methods(["POST"])
def like_post(request, post_id):
    try:
        post = get_object_or_404(Post, id=post_id)
        user = request.user
        liked = False
        
        if user in post.likes.all():
            post.likes.remove(user)
        else:
            post.likes.add(user)
            liked = True
            
        return JsonResponse({
            "success": True,
            "like_count": post.likes.count(),
            "liked": liked
        })
    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=400)


@login_required
@require_http_methods(["POST"])
def edit_post(request, post_id):
    try:
        post = get_object_or_404(Post, id=post_id)
        user = request.user
        
        if post.user != user:
            return JsonResponse({
                "success": False,
                "error": "You do not have permission to edit this post."
            }, status=403)
        
        data = json.loads(request.body)
        new_content = data.get("content")
        
        if not new_content:
            return JsonResponse({
                "success": False,
                "error": "Content is required."
            }, status=400)
        
        post.content = new_content
        post.save()
        
        return JsonResponse({
            "success": True,
            "content": post.content
        })
    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=400)

        

@login_required
@require_http_methods(["POST"])
def delete_post(request, post_id):
    try:
        post = get_object_or_404(Post, id=post_id)
        user = request.user
        
        if post.user != user:
            return JsonResponse({
                "success": False,
                "error": "You do not have permission to delete this post."
            }, status=403)
        
        post.delete()
        
        return JsonResponse({
            "success": True
        })
    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=400)
