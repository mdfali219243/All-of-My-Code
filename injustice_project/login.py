from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('login.html')

@app.route('/login', methods=['GET', 'POST'])
def handle_login():
    if request.method == 'GET':
        return render_template('login.html')
        
    username = request.form.get('username')
    password = request.form.get('password')
    
    if not username or not password:
        return "Please fill in all the fields", 400
        
    print(f"User {username} logged in successfully!")
    return redirect(url_for('home_page'))

@app.route('/home')
def home_page():
    return render_template('home.html')

if __name__ == '__main__':
    app.run(debug=True)
