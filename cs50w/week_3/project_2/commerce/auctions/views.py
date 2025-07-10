from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse
from django.contrib.auth.decorators import login_required

from .models import User, Category, Listing, Bid, Comment


def index(request):
    listings = Listing.objects.filter(is_active=True).order_by("-create_at") 
    return render(request, "auctions/index.html", {
        "listings": listings
    })


def login_view(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "auctions/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "auctions/login.html")


@login_required
def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]

        if password != confirmation:
            return render(request, "auctions/register.html", {
                "message": "Passwords must match."
            })

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
    """Displays a list of all available categories."""
    categories = Category.objects.all().order_by('name')
    return render(request, "auctions/categories.html", {
        "categories": categories
    })




def category_listings_view(request, category_id):
    category = get_object_or_404(Category, pk=category_id)
    listings = Listing.objects.filter(category=category, is_active=True).order_by("-create_at") # <-- FIX THIS LINE
    return render(request, "auctions/category_listings.html", {
        "category": category,
        "listings": listings
    })
@login_required
def create_listing(request):
    print(f"DEBUG: create_listing view accessed by method: {request.method}")

    if request.method == "POST":
        print("DEBUG: Inside POST block of create_listing.")

        title = request.POST.get("title")
        description = request.POST.get("description")
        starting_bid_str = request.POST.get("starting_bid")
        image_url = request.POST.get("image_url")
        category_id_str = request.POST.get("category")

        print(f"DEBUG: Form data received - Title: '{title}', Category ID: '{category_id_str}', Bid: '{starting_bid_str}', Image URL: '{image_url}'")

        category_instance = None
        if category_id_str:
            try:
                category_instance = Category.objects.get(pk=category_id_str)
                print(f"DEBUG: Successfully found category instance: {category_instance.name} (ID: {category_instance.id})")
            except Category.DoesNotExist:
                print(f"DEBUG: Category with ID '{category_id_str}' DOES NOT EXIST in database. Rendering error.")
                categories_list = Category.objects.all().order_by('name')
                return render(request, "auctions/createListing.html", {
                    "message": "Invalid category selected. Please choose from the list.",
                    "categories": categories_list
                })
        else:
            print("DEBUG: No category selected. Rendering error.")
            categories_list = Category.objects.all().order_by('name')
            return render(request, "auctions/createListing.html", {
                "message": "Please select a category for your listing.",
                "categories": categories_list
            })

        try:
            starting_bid = float(starting_bid_str)
            if starting_bid < 0:
                print(f"DEBUG: Invalid starting bid '{starting_bid_str}'. Rendering error.")
                raise ValueError
        except (ValueError, TypeError):
            categories_list = Category.objects.all().order_by('name')
            return render(request, "auctions/createListing.html", {
                "message": "Starting bid must be a valid positive number.",
                "categories": categories_list
            })

        if not request.user.is_authenticated:
            print("DEBUG: User not authenticated. Redirecting to login.")
            return redirect(reverse("login"))

        print("DEBUG: Attempting to create Listing object...")
        try:
            listing = Listing(
                title=title,
                description=description,
                starting_bid=starting_bid,
                image_url=image_url,
                is_active=True,
                created_by=request.user,
                category=category_instance
            )
            listing.save()
            print(f"DEBUG: Listing '{listing.title}' (ID: {listing.id}) SAVED successfully!")
            return redirect("index")

        except IntegrityError as e:
            print(f"ERROR: IntegrityError when saving listing: {e}")
            categories_list = Category.objects.all().order_by('name')
            return render(request, "auctions/createListing.html", {
                "message": f"A database error occurred: {e}",
                "categories": categories_list
            })
        except Exception as e:
            print(f"ERROR: An unexpected error occurred during listing save: {e}")
            categories_list = Category.objects.all().order_by('name')
            return render(request, "auctions/createListing.html", {
                "message": f"An unexpected error occurred: {e}",
                "categories": categories_list
            })

    else:
        print("DEBUG: Inside GET block of create_listing.")
        categories_list = Category.objects.all().order_by('name')
        return render(request, "auctions/createListing.html", {
            "categories": categories_list
        })


def listing_detail(request, listing_id):
    listing = get_object_or_404(Listing, pk=listing_id)

    context = {
        "listing": listing,
    }
    return render(request, "auctions/listing_detail.html", context)