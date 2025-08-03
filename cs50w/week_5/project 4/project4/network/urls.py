
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path('profile/<str:username>/', views.profile, name='profile'),
    path("All_posts", views.All_posts, name="All_posts"),
    path("following", views.following, name="following"),
    path("follow/<str:username>", views.follow_user, name="follow"),
    path("unfollow/<str:username>", views.unfollow_user, name="unfollow"),
    path("like/<int:post_id>", views.like_post, name="like"),
    path("edit/<int:post_id>", views.edit_post, name="edit"),
    path("delete/<int:post_id>", views.delete_post, name="delete"),
]
