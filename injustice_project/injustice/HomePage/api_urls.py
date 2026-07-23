from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import api_views

urlpatterns = [
    path('', api_views.api_root_view, name='api_root'),
    path('auth/register/', api_views.RegisterView.as_view(), name='api_register'),
    path('auth/login/', api_views.login_view, name='api_login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='api_token_refresh'),
    path('auth/me/', api_views.me_view, name='api_me'),
    path('posts/', api_views.posts_view, name='api_posts'),
    path('posts/<int:post_id>/like/', api_views.like_post_view, name='api_like_post'),
    path('posts/<int:post_id>/comments/', api_views.post_comments_view, name='api_post_comments'),
    path('posts/<int:post_id>/share/', api_views.share_post_view, name='api_share_post'),
    path('reels/', api_views.reels_view, name='api_reels'),
    path('debates/', api_views.debates_view, name='api_debates'),
    path('debates/create/', api_views.create_debate_view, name='api_create_debate'),
    path('debates/<int:room_id>/', api_views.debate_detail_view, name='api_debate_detail'),
    path('debates/<int:room_id>/messages/', api_views.debate_messages_view, name='api_debate_messages'),
    path('debates/<int:room_id>/end/', api_views.end_debate_view, name='api_end_debate'),
    path('debates/<int:room_id>/publish/', api_views.publish_debate_view, name='api_publish_debate'),
    path('debates/<int:room_id>/host-heartbeat/', api_views.host_heartbeat_view, name='api_host_heartbeat'),
    path('debates/<int:room_id>/host-leave/', api_views.host_leave_view, name='api_host_leave'),
    path('drafts/', api_views.drafts_view, name='api_drafts'),
    path('posts/<int:post_id>/', api_views.update_post_view, name='api_update_post'),
    path('posts/<int:post_id>/publish/', api_views.publish_post_view, name='api_publish_post'),
    path('inbox/', api_views.inbox_view, name='api_inbox'),
    path('inbox/<str:username>/', api_views.inbox_messages_view, name='api_inbox_messages'),
    path('share/contacts/', api_views.share_contacts_view, name='api_share_contacts'),
    path('users/<str:username>/follow/', api_views.follow_user_view, name='api_follow_user'),
    path('profile/<str:username>/', api_views.profile_view, name='api_profile'),
    path('profile/<str:username>/photos/', api_views.upload_photo_view, name='api_upload_photo'),
    path('search/', api_views.search_view, name='api_search'),
]
