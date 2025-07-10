# auctions/urls.py (VERIFY THIS CONTENT)

from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    
    # THIS LINE IS CRUCIAL:
    path("categories", views.categories_view, name="categories"),
    
    path("createListing", views.create_listing, name="create_listing"),
    path("listing/<int:listing_id>/", views.listing_detail, name="listing_detail"),
    path("category/<int:category_id>/", views.category_listings_view, name="category_listings"),
]