# auctions/views.py

from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse
from django.contrib.auth.decorators import login_required # Recommended for views requiring login

# Import all relevant models (ensure Bid and Comment are also imported if you use them)
from .models import User, Category, Listing, Bid, Comment # Assuming you have Bid and Comment models


def index(request):
    """
    Displays all active listings on the homepage, ordered by creation date (newest first).
    """
    # Fetch all Listing objects where 'is_active' is True
    # Order them by 'create_at' field in descending order (newest first)
    active_listings = Listing.objects.filter(is_active=True).order_by('-create_at')

    # Debugging print statements to confirm fetched listings
    print(f"DEBUG: Active listings count: {active_listings.count()}")
    for item in active_listings:
        # Use .name to access the category's name field
        category_name_debug = item.category.name if item.category else "No Category"
        print(f"DEBUG: - {item.title} (Active: {item.is_active}, Created At: {item.create_at}, Category: {category_name_debug})")

    # Render the index.html template, passing the active listings
    return render(request, "auctions/index.html", {
        "listings": active_listings
    })


def login_view(request):
    """
    Handles user login.
    """
    if request.method == "POST":
        # Attempt to sign user in using provided credentials
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication was successful
        if user is not None:
            login(request, user) # Log the user in
            return HttpResponseRedirect(reverse("index")) # Redirect to homepage
        else:
            # If authentication fails, render login page with an error message
            return render(request, "auctions/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        # For GET requests, just render the empty login form
        return render(request, "auctions/login.html")


@login_required # Ensures only logged-in users can access this view
def logout_view(request):
    """
    Logs out the current user.
    """
    logout(request)
    return HttpResponseRedirect(reverse("index")) # Redirect to homepage after logout


def register(request):
    """
    Handles new user registration.
    """
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]

        # Ensure password matches confirmation
        if password != confirmation:
            return render(request, "auctions/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save() # Save the new user to the database
        except IntegrityError:
            # Handle case where username already exists
            return render(request, "auctions/register.html", {
                "message": "Username already taken."
            })
        login(request, user) # Log the newly registered user in
        return HttpResponseRedirect(reverse("index")) # Redirect to homepage
    else:
        # For GET requests, just render the empty registration form
        return render(request, "auctions/register.html")


def categories_view(request):
    """
    Displays a list of all available categories.
    """
    # Fetch all Category objects, ordered by their 'name' field
    all_categories = Category.objects.all().order_by('name')
    return render(request, "auctions/categories.html", {
        "categories": all_categories
    })


@login_required # Ensures only logged-in users can create listings
def create_listing(request):
    """
    Handles the creation of a new auction listing.
    """
    print(f"DEBUG: create_listing view accessed by method: {request.method}")

    if request.method == "POST":
        print("DEBUG: Inside POST block of create_listing.")

        # Retrieve data from the submitted form
        title = request.POST.get("title")
        description = request.POST.get("description")
        starting_bid_str = request.POST.get("starting_bid")
        image_url = request.POST.get("image_url") # FIXED: Matches HTML 'name="image_url"'
        category_id_str = request.POST.get("category") # This will be the ID string from the form

        print(f"DEBUG: Form data received - Title: '{title}', Category ID: '{category_id_str}', Bid: '{starting_bid_str}', Image URL: '{image_url}'")


        # --- Category Validation and Retrieval ---
        category_instance = None
        if category_id_str: # Check if a category ID was provided
            try:
                # Attempt to retrieve the Category object using its primary key (ID)
                category_instance = Category.objects.get(pk=category_id_str)
                # Now use category_instance.name for printing, as per updated model
                print(f"DEBUG: Successfully found category instance: {category_instance.name} (ID: {category_instance.id})")
            except Category.DoesNotExist:
                # If the category ID doesn't match an existing category, show an error
                print(f"DEBUG: Category with ID '{category_id_str}' DOES NOT EXIST in database. Rendering error.")
                categories_list = Category.objects.all().order_by('name') # Order by 'name' field
                return render(request, "auctions/createListing.html", {
                    "message": "Invalid category selected. Please choose from the list.",
                    "categories": categories_list
                })
        else:
            # If no category was selected (empty value), show an error
            print("DEBUG: No category selected. Rendering error.")
            categories_list = Category.objects.all().order_by('name') # Order by 'name' field
            return render(request, "auctions/createListing.html", {
                "message": "Please select a category for your listing.",
                "categories": categories_list
            })

        # --- Starting Bid Validation ---
        try:
            # Convert the starting bid string to a floating-point number (DecimalField in model)
            starting_bid = float(starting_bid_str)
            if starting_bid < 0:
                print(f"DEBUG: Invalid starting bid '{starting_bid_str}'. Rendering error.")
                raise ValueError # Ensure bid is not negative
        except (ValueError, TypeError):
            # Handle cases where the starting bid is not a valid number or is negative
            categories_list = Category.objects.all().order_by('name') # Order by 'name' field
            return render(request, "auctions/createListing.html", {
                "message": "Starting bid must be a valid positive number.",
                "categories": categories_list
            })

        # --- User Authentication Check ---
        if not request.user.is_authenticated:
            # This case should ideally be caught by @login_required, but good for robustness
            print("DEBUG: User not authenticated. Redirecting to login.")
            return redirect(reverse("login")) # Redirect to login if not authenticated

        # --- Create and Save the Listing ---
        print("DEBUG: Attempting to create Listing object...")
        try:
            listing = Listing(
                title=title,
                description=description,
                starting_bid=starting_bid,
                image_url=image_url,
                is_active=True,
                created_by=request.user,
                category=category_instance  # FIXED: Matches 'category' field in Listing model (singular)
            )
            listing.save() # Save the new listing to the database
            print(f"DEBUG: Listing '{listing.title}' (ID: {listing.id}) SAVED successfully!")
            return redirect("index") # Redirect to the homepage after successful listing creation

        except IntegrityError as e:
            # Catch database integrity errors (e.g., if a field must be unique)
            print(f"ERROR: IntegrityError when saving listing: {e}")
            categories_list = Category.objects.all().order_by('name') # Order by 'name' field
            return render(request, "auctions/createListing.html", {
                "message": f"A database error occurred: {e}",
                "categories": categories_list
            })
        except Exception as e:
            # Catch any other unexpected errors during save
            print(f"ERROR: An unexpected error occurred during listing save: {e}")
            categories_list = Category.objects.all().order_by('name') # Order by 'name' field
            return render(request, "auctions/createListing.html", {
                "message": f"An unexpected error occurred: {e}",
                "categories": categories_list
            })

    else: # This block handles GET requests for displaying the form
        print("DEBUG: Inside GET block of create_listing.")
        # Fetch all categories to populate the dropdown in the form, ordered by 'name'
        categories_list = Category.objects.all().order_by('name')
        return render(request, "auctions/createListing.html", {
            "categories": categories_list
        })


def listing_detail(request, listing_id):
    """
    View to display the details of a single listing.
    """
    # Retrieve the specific listing object using its ID (primary key)
    # get_object_or_404 will raise a 404 error if the listing doesn't exist
    listing = get_object_or_404(Listing, pk=listing_id)

    # Prepare context data to pass to the template
    context = {
        "listing": listing,
        # Example: Fetching related bids and comments (uncomment if you have these models and relationships)
        # "bids": listing.item_bids.all().order_by('-amount'),
        # "comments": listing.comments.all().order_by('timestamp'),
    }
    return render(request, "auctions/listing_detail.html", context)