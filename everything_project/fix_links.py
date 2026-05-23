import os
import re
import posixpath

template_dir = 'templates'

def normalize_path(base_dir, relative_path):
    # base_dir is something like "homepage", relative_path is "../feature-menu/icons/home.png"
    # We want to resolve this posix path.
    # relative_path might be "style.css"
    if relative_path.startswith('/'):
        # It's an absolute path from old root? Remove the leading slash and treat as relative to root
        return posixpath.normpath(relative_path.lstrip('/'))
    return posixpath.normpath(posixpath.join(base_dir, relative_path))

def repl(match, base_dir):
    attr = match.group(1) # src or href
    quote = match.group(2) # " or '
    url = match.group(3)
    
    # ignore absolute urls, fragments, jinja tags, data:
    if url.startswith(('http://', 'https://', 'mailto:', '#', '{{', '{%', 'data:')):
        return match.group(0)

    # Normalize the path from the base directory
    norm_url = normalize_path(base_dir, url)
    
    # Check if it's an HTML page vs Static resource
    if norm_url.endswith('.html') or '.html#' in norm_url:
        # Route to the page
        if '.html#' in norm_url:
            page, fragment = norm_url.split('#', 1)
            new_url = f"{{{{ url_for('serve_page', page='{page}') }}}}#{fragment}"
        else:
            if norm_url == 'homepage/index.html':
                 new_url = f"{{{{ url_for('home') }}}}"
            else:
                 new_url = f"{{{{ url_for('serve_page', page='{norm_url}') }}}}"
    elif norm_url == '' or norm_url.endswith('/'):
        # Probably pointing to an index page directory
        dir_path = norm_url.strip('/')
        if dir_path == '':
             new_url = f"{{{{ url_for('home') }}}}"
        else:
             page = f"{dir_path}/index.html"
             new_url = f"{{{{ url_for('serve_page', page='{page}') }}}}"
    else:
        # Static file
        new_url = f"{{{{ url_for('static', filename='{norm_url}') }}}}"
        
    return f'{attr}={quote}{new_url}{quote}'

def fix_html_files():
    pattern = re.compile(r'(href|src)=([\'"])([^\'"]+)\2', re.IGNORECASE)
    
    for root, dirs, files in os.walk(template_dir):
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                
                # e.g., root='templates/homepage', base_dir='homepage'
                base_dir = posixpath.relpath(root, template_dir)
                if base_dir == '.':
                    base_dir = ''
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = pattern.sub(lambda m: repl(m, base_dir), content)
                
                if new_content != content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated: {file_path}")

if __name__ == '__main__':
    fix_html_files()
