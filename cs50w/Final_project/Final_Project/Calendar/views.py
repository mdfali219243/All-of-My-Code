from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from .forms import CustomUserCreationForm
from django.db import IntegrityError
from django.http import HttpResponseRedirect, JsonResponse, HttpResponseBadRequest
from django.urls import reverse
from .models import User, Event, Task
from django.contrib.auth.decorators import login_required
from datetime import datetime
import json


# Create your views here.
def index(request):
    if request.user.is_authenticated:
        return render(request, "Calendar/index.html")
    else:
        return render(request, "Calendar/landing.html")

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "Calendar/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "Calendar/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        print("Registration POST request received")  
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")
        confirmation = request.POST.get("confirmation")
        
        print(f"Username: {username}") 
        print(f"Email: {email}")        
        
        if not all([username, email, password, confirmation]):
            print("Missing required fields") 
            return render(request, "Calendar/register.html", {
                "message": "All fields are required."
            })
            
        if password != confirmation:
            print("Passwords don't match") 
            return render(request, "Calendar/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            print("Attempting to create user") 
            user = User.objects.create_user(username, email, password)
            user.save()
            print(f"User {username} created successfully") 
        except IntegrityError as e:
            print(f"IntegrityError: {e}") 
            return render(request, "Calendar/register.html", {
                "message": "Username already taken."
            })
            
        # Log the user in
        login(request, user)
        print(f"User {username} logged in") 
        
        # Debug: Print session data
        print(f"Session data after login: {request.session.items()}")
        
        # Debug: Try to get the user from the request
        print(f"Request user after login: {request.user}")
        
        # Debug: Try to redirect to index
        print("Redirecting to index")
        return HttpResponseRedirect(reverse("index"))
    else:
        print("Serving registration form") 
        return render(request, "Calendar/register.html")


def settings(request):
    return render(request, "Calendar/settings.html")

def tasks(request):
    return render(request, "Calendar/tasks.html")

# -------------------------
# Events JSON API (simple)
# -------------------------
@login_required
def events_collection(request):
    if request.method == "GET":
        start = request.GET.get("start")
        end = request.GET.get("end")
        qs = Event.objects.filter(user=request.user)
        if start and end:
            # Expect YYYY-MM-DD
            try:
                start_date = datetime.strptime(start, "%Y-%m-%d").date()
                end_date = datetime.strptime(end, "%Y-%m-%d").date()
                qs = qs.filter(date__range=[start_date, end_date])
            except ValueError:
                return HttpResponseBadRequest("Invalid date format; expected YYYY-MM-DD")

        data = [{
            "id": ev.id,
            "title": ev.title,
            "date": ev.date.isoformat(),
            "allDay": ev.all_day,
            "startTime": ev.start_time.strftime("%H:%M") if ev.start_time else None,
            "endTime": ev.end_time.strftime("%H:%M") if ev.end_time else None,
            "color": ev.color,
            "description": ev.description or "",
        } for ev in qs.order_by("date", "start_time")]
        return JsonResponse(data, safe=False)

    elif request.method == "POST":
        # POST create
        try:
            body = json.loads(request.body or "{}")
        except json.JSONDecodeError:
            return HttpResponseBadRequest("Invalid JSON body")

        title = (body.get("title") or "").strip()
        date_str = body.get("date")
        all_day = bool(body.get("allDay", False))
        # Parse HH:MM to time if provided
        start_time = None
        end_time = None
        if body.get("startTime"):
            try:
                start_time = datetime.strptime(body.get("startTime"), "%H:%M").time()
            except (ValueError, TypeError):
                start_time = None
        if body.get("endTime"):
            try:
                end_time = datetime.strptime(body.get("endTime"), "%H:%M").time()
            except (ValueError, TypeError):
                end_time = None
        color = body.get("color") or "#1a73e8"
        description = body.get("description") or ""

        if not title or not date_str:
            return HttpResponseBadRequest("'title' and 'date' are required")
        try:
            date_val = datetime.strptime(date_str, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return HttpResponseBadRequest("Invalid 'date' format; expected YYYY-MM-DD")

        ev = Event.objects.create(
            user=request.user,
            title=title,
            date=date_val,
            all_day=all_day,
            start_time=None if all_day else start_time,
            end_time=None if all_day else end_time,
            color=color,
            description=description,
        )
        return JsonResponse({
            "id": ev.id,
            "title": ev.title,
            "date": ev.date.isoformat(),
            "allDay": ev.all_day,
            "startTime": ev.start_time.strftime("%H:%M") if ev.start_time else None,
            "endTime": ev.end_time.strftime("%H:%M") if ev.end_time else None,
            "color": ev.color,
            "description": ev.description or "",
        }, status=201)


@login_required
def events_detail(request, event_id: int):
    try:
        ev = Event.objects.get(id=event_id, user=request.user)
    except Event.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)

    if request.method == "GET":
        return JsonResponse({
            "id": ev.id,
            "title": ev.title,
            "date": ev.date.isoformat(),
            "allDay": ev.all_day,
            "startTime": ev.start_time.strftime("%H:%M") if ev.start_time else None,
            "endTime": ev.end_time.strftime("%H:%M") if ev.end_time else None,
            "color": ev.color,
            "description": ev.description or "",
        })

    if request.method == "DELETE":
        ev.delete()
        return JsonResponse({"ok": True})

    # Update (PUT/PATCH)
    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return HttpResponseBadRequest("Invalid JSON body")

    # Map incoming fields if present
    if "title" in body:
        ev.title = (body.get("title") or "").strip()
    if "date" in body and body.get("date"):
        try:
            ev.date = datetime.strptime(body["date"], "%Y-%m-%d").date()
        except ValueError:
            return HttpResponseBadRequest("Invalid 'date' format; expected YYYY-MM-DD")
    if "allDay" in body:
        ev.all_day = bool(body.get("allDay"))
    if "startTime" in body:
        try:
            ev.start_time = datetime.strptime(body.get("startTime"), "%H:%M").time() if body.get("startTime") else None
        except ValueError:
            ev.start_time = None
    if "endTime" in body:
        try:
            ev.end_time = datetime.strptime(body.get("endTime"), "%H:%M").time() if body.get("endTime") else None
        except ValueError:
            ev.end_time = None
    if ev.all_day:
        ev.start_time = None
        ev.end_time = None
    if "color" in body and body.get("color"):
        ev.color = body.get("color")
    if "description" in body:
        ev.description = body.get("description") or ""

    ev.save()
    return JsonResponse({
        "id": ev.id,
        "title": ev.title,
        "date": ev.date.isoformat(),
        "allDay": ev.all_day,
        "startTime": ev.start_time.strftime("%H:%M") if ev.start_time else None,
        "endTime": ev.end_time.strftime("%H:%M") if ev.end_time else None,
        "color": ev.color,
        "description": ev.description or "",
    })


# -------------------------
# Tasks JSON API
# -------------------------
@login_required
def tasks_collection(request):
    if request.method == "GET":
        # Get all tasks for the current user
        qs = Task.objects.filter(user=request.user)
        data = [{
            "id": task.id,
            "title": task.title,
            "description": task.description or "",
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat(),
            "completed": task.completed,
        } for task in qs.order_by("-created_at")]
        return JsonResponse(data, safe=False)

    elif request.method == "POST":
        # Create a new task
        try:
            body = json.loads(request.body or "{}")
        except json.JSONDecodeError:
            return HttpResponseBadRequest("Invalid JSON body")

        title = (body.get("title") or "").strip()
        description = body.get("description") or ""
        completed = bool(body.get("completed", False))

        if not title:
            return HttpResponseBadRequest("'title' is required")

        task = Task.objects.create(
            user=request.user,
            title=title,
            description=description,
            completed=completed,
        )
        return JsonResponse({
            "id": task.id,
            "title": task.title,
            "description": task.description or "",
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat(),
            "completed": task.completed,
        }, status=201)


@login_required
def tasks_detail(request, task_id: int):
    try:
        task = Task.objects.get(id=task_id, user=request.user)
    except Task.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)

    if request.method == "GET":
        return JsonResponse({
            "id": task.id,
            "title": task.title,
            "description": task.description or "",
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat(),
            "completed": task.completed,
        })

    if request.method == "DELETE":
        task.delete()
        return JsonResponse({"ok": True})

    # Update (PUT/PATCH)
    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return HttpResponseBadRequest("Invalid JSON body")

    # Map incoming fields if present
    if "title" in body:
        task.title = (body.get("title") or "").strip()
    if "description" in body:
        task.description = body.get("description") or ""
    if "completed" in body:
        task.completed = bool(body.get("completed"))

    task.save()
    return JsonResponse({
        "id": task.id,
        "title": task.title,
        "description": task.description or "",
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat(),
        "completed": task.completed,
    })
