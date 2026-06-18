from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import api_views

urlpatterns = [
    path('auth/register/', api_views.RegisterView.as_view(), name='api_register'),
    path('auth/login/', api_views.login_view, name='api_login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='api_token_refresh'),
    path('auth/me/', api_views.me_view, name='api_me'),
    path('posts/', api_views.posts_view, name='api_posts'),
    path('profile/<str:username>/', api_views.profile_view, name='api_profile'),
]
