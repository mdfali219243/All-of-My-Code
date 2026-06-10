from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register, name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('reels/', views.reels, name='reels'),
    path('inbox/', views.inbox, name='inbox'),
    path('inbox/<str:username>/', views.inbox, name='inbox_chat'),
    path('inbox/<str:username>/send/', views.send_inbox_message, name='send_inbox_message'),
    path('inbox/<str:username>/messages/', views.get_inbox_messages, name='get_inbox_messages'),
    path('profile/<str:username>/', views.profile, name='profile'),
    path('profile/<str:username>/upload-photo/', views.upload_photo, name='upload_photo'),
    path('post/<int:post_id>/share/', views.share_post, name='share_post'),
    path('share/contacts/', views.get_share_contacts, name='get_share_contacts'),
    path('post/<int:post_id>/like/', views.like_post, name='like_post'),
    path('post/<int:post_id>/comment/', views.add_comment, name='add_comment'),
    path('post/<int:post_id>/comments/', views.get_post_comments, name='get_post_comments'),
    path('user/<str:username>/follow/', views.follow_user, name='follow_user'),
    path('debate/create/', views.create_debate, name='create_debate'),
    path('debate/<int:room_id>/', views.debate_room, name='debate_room'),
    path('debate/<int:room_id>/send/', views.send_debate_message, name='send_debate_message'),
    path('debate/<int:room_id>/messages/', views.get_debate_messages, name='get_debate_messages'),
    path('debate/<int:room_id>/end_upload/', views.end_debate_upload, name='end_debate_upload'),
]