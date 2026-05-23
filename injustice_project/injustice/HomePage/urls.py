from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register, name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('reels/', views.reels, name='reels'),
    path('profile/<str:username>/', views.profile, name='profile'),
    path('post/<int:post_id>/like/', views.like_post, name='like_post'),
    path('post/<int:post_id>/comment/', views.add_comment, name='add_comment'),
    path('debate/create/', views.create_debate, name='create_debate'),
    path('debate/<int:room_id>/', views.debate_room, name='debate_room'),
    path('debate/<int:room_id>/send/', views.send_debate_message, name='send_debate_message'),
    path('debate/<int:room_id>/messages/', views.get_debate_messages, name='get_debate_messages'),
    path('debate/<int:room_id>/end_upload/', views.end_debate_upload, name='end_debate_upload'),
]