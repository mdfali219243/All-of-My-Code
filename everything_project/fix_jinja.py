import os, re, posixpath

# The bug: some templates end up with `page='../something'` or `filename='../something'`.
# We need to resolve `../something` relative to the template's directory.

def resolve_path(match, base_dir):
    type_str = match.group(1) # 'serve_page', page= OR 'static', filename=
    quote = match.group(2)
    path = match.group(3)
    
    if path.startswith('../'):
        # resolve it!
        resolved = posixpath.normpath(posixpath.join(base_dir, path))
        return f"{type_str}={quote}{resolved}{quote}"
    return match.group(0)

def fix_all():
    pattern = re.compile(r'(page|filename)=([\'"])([^\'"]+)[\'"]')
    
    for root, dirs, files in os.walk('templates'):
        for f in files:
            if f.endswith('.html'):
                fpath = os.path.join(root, f)
                base_dir = posixpath.relpath(root, 'templates')
                if base_dir == '.':
                    base_dir = ''
                
                with open(fpath, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                # We need to match {{ url_for('something', page='../foo') }}
                new_content = pattern.sub(lambda m: resolve_path(m, base_dir), content)
                
                if new_content != content:
                    with open(fpath, 'w', encoding='utf-8') as file:
                        file.write(new_content)
                    print(f"Fixed {fpath}")

if __name__ == '__main__':
    fix_all()
