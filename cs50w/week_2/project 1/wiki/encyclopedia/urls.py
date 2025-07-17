from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("wiki/<str:entry_name>", views.entry_page, name="entry_page"),
    path("create_page/", views.create_page, name="create_page"),
    path("random/", views.random_page, name="random"),
    path("edit/<str:entry_name>", views.edit_entry, name="edit_entry"),
    path("search/", views.search, name="search")
]


