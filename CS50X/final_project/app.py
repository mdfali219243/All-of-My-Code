from flask import Flask, render_template, jsonify
import requests

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/quran')
def quran():
    return render_template('quran.html')


if __name__ == '__main__':
    app.run(debug=True)
