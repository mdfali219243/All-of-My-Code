from django.urls import reverse
from django.templatetags.static import static
from jinja2 import Environment

def environment(**options):
    env = Environment(**options)
    
    def url_for(endpoint, **kwargs):
        if endpoint == 'static':
            filename = kwargs.get('filename', '')
            return static(filename)
        elif endpoint == 'home':
            return reverse('home')
        elif endpoint == 'serve_page':
            page = kwargs.get('page', '')
            return reverse('serve_page', kwargs={'page': page})
        elif endpoint == 'login':
            return reverse('login')
        elif endpoint == 'register':
            return reverse('register')
        elif endpoint == 'logout':
            return reverse('logout')
        return '#'
        
    env.globals.update({
        'url_for': url_for,
    })
    return env
