from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import User, Category, Listing


def index(request):

    return render(request, "auctions/index.html")
    


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
            return render(request, "auctions/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "auctions/login.html")


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
            return render(request, "auctions/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "auctions/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "auctions/register.html")


def categories_view(request):
    pass


def create_listing(request):
    if request.method == "POST":
        title = request.POST["title"]
        description = request.POST["description"]
        starting_bid = request.POST["starting_bid"]
        category = request.POST["category"]
        image_url = request.POST["image_url"]

        if not all([title, description, starting_bid, category]):
            return render(request, "auctions/creatListing.html", {
                "message": "All fields are required."
            })
        

        try:
            starting_bid = float(starting_bid)
            if starting_bid <= 0:
                raise ValueError("Starting bid must be greater than zero.")
        except ValueError:
            categories_list = Category.objects.all()
            return render(request, "auctions/creatListing.html", {
                "message": "Starting bid must be a positive number.",
                "categories": categories_list
            })
        selected_category = None
        if category:
            try:
                selected_category = Category.objects.get(name=category)
            except Category.DoesNotExist:
                categories_list = Category.objects.all()
                return render(request, "auctions/creatListing.html", {
                    "message": "Category does not exist.",
                    "categories": categories_list
                })
            
        # Create the listing
        listing = Listing(
            title=title,
            description=description,
            starting_bid=starting_bid,
            category=selected_category,
            image_url=image_url,
            is_active=True,
        )
        listing.save()
        return HttpResponseRedirect(reverse("index"))
    

    else: 
        categories_list = Category.objects.all() 
        return render(request, "auctions/creatListing.html", {
            "categories": categories_list
        })


    return render(request, "auctions/creatListing.html", {
        "categories": categories_list 
    })

def active_listings(request):
    listing = Listing.objects.all()
    return render(request, "auctions/index.html", {
        "listings": listing
    })