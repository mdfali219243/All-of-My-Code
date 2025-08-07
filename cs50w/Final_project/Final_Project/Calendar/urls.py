from django.urls import path
from django.contrib.auth import views as auth_views
from django.urls import reverse_lazy
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", auth_views.LoginView.as_view(template_name="Calendar/login.html"), name="login"),
    path("logout", auth_views.LogoutView.as_view(next_page=reverse_lazy('index')), name="logout"),
    path("register", views.register, name="register"),
    path("settings", views.settings, name="settings"),
    path("tasks", views.tasks, name="tasks"),
]
