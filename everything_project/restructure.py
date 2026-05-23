import os
import shutil

src_dirs = ['calendar', 'feature-menu', 'foysal', 'grades', 'homepage', 'zaeem']

def restructure():
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static', exist_ok=True)

    for src_dir in src_dirs:
        for root, dirs, files in os.walk(src_dir):
            for file in files:
                file_path = os.path.join(root, file)
                
                # Exclude python files or already known
                if file.endswith('.py') or root.startswith(('templates', 'static', 'venv', '.git')):
                    continue
                
                if file.endswith('.html'):
                    target_dir = os.path.join('templates', root)
                else:
                    target_dir = os.path.join('static', root)
                
                os.makedirs(target_dir, exist_ok=True)
                new_path = os.path.join(target_dir, file)
                print(f"Moving {file_path} -> {new_path}")
                shutil.move(file_path, new_path)

if __name__ == '__main__':
    restructure()
    # Cleanup empty directories
    for src_dir in src_dirs:
        if os.path.exists(src_dir):
            try:
                # Remove empty folders, bottom up
                for root, dirs, files in os.walk(src_dir, topdown=False):
                    for name in dirs:
                        try:
                            os.rmdir(os.path.join(root, name))
                        except Exception:
                            pass
                os.rmdir(src_dir)
            except Exception:
                pass
