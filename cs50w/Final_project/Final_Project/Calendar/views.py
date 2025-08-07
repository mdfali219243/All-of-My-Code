from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from .forms import CustomUserCreationForm

# Create your views here.
def register(request):
    print("Register view called")  # Debug log
    if request.method == "POST":
        print("POST request received")  # Debug log
        form = CustomUserCreationForm(request.POST)
        print(f"Form is valid: {form.is_valid()}")  # Debug log
        if form.is_valid():
            print("Form is valid, creating user")  # Debug log
            user = form.save()
            login(request, user)
            print(f"User {user.username} created and logged in")  # Debug log
            return redirect("index")
    else:
        print("GET request, showing registration form")  # Debug log
        form = CustomUserCreationForm()
    return render(request, "register.html", {
        "form": form
    })

def index(request):
    return render(request, "index.html")

