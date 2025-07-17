from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.urls import reverse

# Create your views here.

def index(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse("login"))
    return render(request, "users/index.html")
    
def login_view(request):
    return render(request, "users/login.html")

def logout_view(request):
    pass
