from django.shortcuts import render, redirect
import random
from . import util
import markdown2    
import re


def index(request):
    return render(request, "encyclopedia/index.html", {
        "entries": util.list_entries()
        
    })

def entry_page(request, entry_name):
    entry_content = util.get_entry(entry_name)
    if entry_content is None:
        return render(request, "encyclopedia/error.html"), {
            "message": f"Sorry, the entry for '{entry_name}' was not found."
        }
    else:
        html_content = markdown2.markdown(entry_content)
        return render(request, "encyclopedia/entry.html", {
            "title": entry_name, # <-- Pass 'entry_name' to the template as 'title' or 'entry_name'
            "content": html_content
        })

    
def create_page(request):
    if request.method == "POST":
        title = request.POST.get("title")
        content = request.POST.get("content")

        if not title and not content:
           return render(request, "encyclopedia/create_page.html", {
                "error_message": "Title and content are required.",
            })
        if util.get_entry(title) is not None:
             return render(request, "encyclopedia/create_page.html", {
                "error_message": "An entry with this title already exits. please choose different title",
            })
            
        util.save_entry(title=title, content=content)
        return redirect("entry_page.html", title=title)
    else:
        return render(request, "encyclopedia/create_page.html") 

def random_page(request):
    list_of_titles = util.list_entries()
    if list_of_titles:
        random_titles = random.choice(list_of_titles)
    else:
        return render(request, "encyclopedia/error.html", {
            "message": "No entries found to display a random page."
        })
    return redirect("entry_page", entry_name=random_titles)


def edit_entry(request, entry_name):
    if request.method == "POST":
        title = request.POST.get("title")
        content = request.POST.get("content")

        if not title or not content:
            return render(request, "encyclopedia/edit.html", {
                "title": entry_name,
                "content" : util.get_entry(entry_name),
                "error_message": "Both title and content are required."
        })

        util.save_entry(title=title, content=content)

        return redirect("entry_page", entry_name=title)
    
    else:
        content = util.get_entry(entry_name)
        if content is None:
            return render(request, "encyclopedia/error.html", {
                "message": f"Entry '{entry_name}' not found for editing."
            })
        else:
            return render(request, "encyclopedia/edit.html", { 
                "title": entry_name,
                "content": content 
            })
def search(request):
    query = request.GET.get("q", "").strip()

    if not query:
        return redirect("index")
    
    all_entries = util.list_entries()
    exact_match = None
    substring_matches = []

    for entry_title in all_entries:
        if query.lower() == entry_title.lower():
            exact_match = entry_title
            break 

        if query.lower() in entry_title.lower():
            substring_matches.append(entry_title)


    if exact_match:
        return redirect("entry_page", entry_name=exact_match)
    else:
        return render(request, "encyclopedia/search_results.html", {
            "query": query, 
            "entries": substring_matches
        })


