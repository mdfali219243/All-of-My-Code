# auctions/urls.py (VERIFY THIS CONTENT)

from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("categories", views.categories_view, name="categories"),  
    path("createListing", views.create_listing, name="create_listing"),
    path("listing/<int:listing_id>/", views.listing_detail, name="listing_detail"),
    path("category/<int:category_id>/", views.category_listings_view, name="category_listings"),
    path("toggle_watchlist/<int:listing_id>/", views.toggle_watchlist, name="toggle_watchlist"),
    path("watchlist", views.watchlist_view, name="watchlist"),
    path("place_bid/<int:listing_id>/", views.place_bid, name="place_bid"),
    path("add_comment/<int:listing_id>/", views.add_comment, name="add_comment"),
]