from django.shortcuts import render, redirect

from . import util


def index(request):
    return render(request, "encyclopedia/index.html", {
        "entries": util.list_entries()
        
    })

def entry_page(request, entry_name):
    entry_content = util.get_entry(entry_name)
    if entry_content:
        return render(request, "encyclopedia/entry_page.html", {
            "title": entry_name,
            "content": entry_content,
        })
    else:
        return render(request, "encyclopedia/entry_page.html", {
            "message": f"Entry '{entry_name}' not founded."
        }, status=404)
    
def create_page(request):
    return render(request, "encyclopedia/create_page.html")

