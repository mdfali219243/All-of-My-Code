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
    # Simple Events API
    path("api/events", views.events_collection, name="events_collection"),
    path("api/events/<int:event_id>", views.events_detail, name="events_detail"),
    # Tasks API
    path("api/tasks", views.tasks_collection, name="tasks_collection"),
    path("api/tasks/<int:task_id>", views.tasks_detail, name="tasks_detail"),
]
