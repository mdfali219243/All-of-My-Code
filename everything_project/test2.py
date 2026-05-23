import posixpath, os
template_dir = 'templates'
root = 'templates/grades'
base_dir = posixpath.relpath(root, template_dir)
print("base_dir:", base_dir)
print("normpath:", posixpath.normpath(posixpath.join(base_dir, '../feature-menu/icons/home.png')))
