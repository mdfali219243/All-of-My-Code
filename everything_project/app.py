from flask import Flask, render_template, abort
import os

app = Flask(__name__)

@app.route('/')
def home():
    # The default homepage was at homepage/index.html
    return render_template('homepage/index.html')

@app.route('/<path:page>')
def serve_page(page):
    # Try serving as an HTML request
    if not page.endswith('.html'):
        # In case they didn't specify .html but accessed it directly
        if os.path.exists(os.path.join(app.template_folder, f"{page}.html")):
            page = f"{page}.html"
        elif os.path.exists(os.path.join(app.template_folder, page, "index.html")):
            page = f"{page}/index.html"
            
    try:
        return render_template(page)
    except Exception:
        abort(404)

if __name__ == '__main__':
    app.run(debug=True, port=8000)
