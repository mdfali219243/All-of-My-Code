from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from decimal import Decimal, InvalidOperation

from .models import User, Category, Listing, Bid, Comment, Watchlist


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
    listings = Listing.objects.filter(category=category, is_active=True).order_by("-create_at") 
    return render(request, "auctions/category_listings.html", {
        "category": category,
        "listings": listings
    })
@login_required
def create_listing(request):
    if request.method == "POST":
        print("DEBUG: Inside POST block of create_listing.")

        title = request.POST.get("title")
        description = request.POST.get("description")
        starting_bid_str = request.POST.get("starting_bid")
        image_url = request.POST.get("image_url")
        category_id_str = request.POST.get("category")

        category_instance = None
        if category_id_str:
            try:
                category_instance = Category.objects.get(pk=category_id_str)
            except Category.DoesNotExist:
                categories_list = Category.objects.all().order_by('name')
                return render(request, "auctions/createListing.html", {
                    "message": "Invalid category selected. Please choose from the list.",
                    "categories": categories_list
                })
        else:
            categories_list = Category.objects.all().order_by('name')
            return render(request, "auctions/createListing.html", {
                "message": "Please select a category for your listing.",
                "categories": categories_list
            })

        try:
            starting_bid = float(starting_bid_str)
            if starting_bid < 0:
                raise ValueError
        except (ValueError, TypeError):
            categories_list = Category.objects.all().order_by('name')
            return render(request, "auctions/createListing.html", {
                "message": "Starting bid must be a valid positive number.",
                "categories": categories_list
            })

        if not request.user.is_authenticated:
            return redirect(reverse("login"))

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
            return redirect("index")

        except IntegrityError as e:
            categories_list = Category.objects.all().order_by('name')
            return render(request, "auctions/createListing.html", {
                "message": f"A database error occurred: {e}",
                "categories": categories_list
            })
        except Exception as e:
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
    
    is_on_watchlist = False
    if request.user.is_authenticated:
        is_on_watchlist = Watchlist.objects.filter(user=request.user, listing=listing).exists()

    context = {
        "listing": listing,
        "is_on_watchlist": is_on_watchlist, 
    }
    return render(request, "auctions/listing_detail.html", context)

@login_required 
def toggle_watchlist(request, listing_id):
    print(f"DEBUG: toggle_watchlist accessed for listing_id: {listing_id}, method: {request.method}")

    if request.method == "POST":
        listing = get_object_or_404(Listing, pk=listing_id)
        user = request.user

        print(f"DEBUG: User attempting toggle: {user.username}, Listing: {listing.title} (ID: {listing.id})")


        watchlist_item = Watchlist.objects.filter(user=user, listing=listing)

        if watchlist_item.exists():
            # Item is on watchlist, so remove it
            print(f"DEBUG: Watchlist item for {user.username} and {listing.title} EXISTS. Deleting...")
            watchlist_item.delete()
            # if messages: messages.success(request, f"{listing.title} removed from your watchlist.")
            print(f"DEBUG: Item deleted. Remaining watchlist items for user '{user.username}': {Watchlist.objects.filter(user=user).count()}")
        else:
            # Item is not on watchlist, so add it
            print(f"DEBUG: Watchlist item for {user.username} and {listing.title} NOT FOUND. Creating...")
            Watchlist.objects.create(user=user, listing=listing)
            # if messages: messages.success(request, f"{listing.title} added to your watchlist.")
            print(f"DEBUG: Item created. Total watchlist items for user '{user.username}': {Watchlist.objects.filter(user=user).count()}")

        # Redirect back to the listing detail page
        return redirect(reverse("listing_detail", args=[listing.id]))
    
    # If a GET request somehow hits this endpoint, redirect to index
    print("DEBUG: toggle_watchlist accessed with GET method. Redirecting to index.")
    return redirect(reverse("index"))

@login_required 
def watchlist_view(request):
    print(f"DEBUG: watchlist_view accessed by user: {request.user.username}")

    watchlist_items = Watchlist.objects.filter(user=request.user)
    
    listings = [item.listing for item in watchlist_items] 
    
    print(f"DEBUG: Listings extracted for watchlist: {[l.title for l in listings]}")
    
    return render(request, "auctions/watchlist.html", {
        "listings": listings # Pass this list of Listing objects to the template
    })

@login_required 
def place_bid(request, listing_id):
    print(f"DEBUG: place_bid accessed for listing_id: {listing_id}, method: {request.method}")

    listing = get_object_or_404(Listing, pk=listing_id)

    if request.method == "POST":
        bid_amount_str = request.POST.get('amount') 

        print(f"DEBUG: Received bid amount string: '{bid_amount_str}'")

        try:
            new_bid_amount = Decimal(bid_amount_str) 
        except (InvalidOperation, TypeError):
            print("DEBUG: Invalid bid amount received.")
            return redirect(reverse("listing_detail", args=[listing.id]))

        # Ensure bid is positive
        if new_bid_amount <= 0:
            return redirect(reverse("listing_detail", args=[listing.id]))

        current_bid = listing.get_current_bid() #

        if new_bid_amount <= current_bid:
            print(f"DEBUG: Bid {new_bid_amount} is not higher than current bid {current_bid}.")
        elif request.user == listing.created_by:
            print(f"DEBUG: User cannot bid on their own listing.")
        else:
            Bid.objects.create(
                user=request.user,
                listing=listing,
                amount=new_bid_amount
            )
            print(f"DEBUG: Bid ${new_bid_amount} placed by {request.user.username} on {listing.title}")
    return redirect(reverse("listing_detail", args=[listing.id]))


@login_required # Only logged-in users can add comments
def add_comment(request, listing_id):
    print(f"DEBUG: add_comment accessed for listing_id: {listing_id}, method: {request.method}")

    listing = get_object_or_404(Listing, pk=listing_id)

    if request.method == "POST":
        comment_text = request.POST.get('comment_text', '').strip() 


        print(f"DEBUG: Received comment text: '{comment_text}' for listing {listing.title}")

        if comment_text: 
            Comment.objects.create(
                user=request.user,
                listing=listing,
                text=comment_text
            )
            print(f"DEBUG: Comment by {request.user.username} added to {listing.title}")
        else:
            print("DEBUG: Comment text was empty.")

    return redirect(reverse("listing_detail", args=[listing.id]))
