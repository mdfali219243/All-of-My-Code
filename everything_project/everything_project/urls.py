from django.contrib import admin
from django.urls import path
from everything_project import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('<path:page>', views.serve_page, name='serve_page'),
]
