#from hte flask python file we are using those function
from flask import Flask, render_template, request

app = Flask(__name__)

SPORTS = ["Basketball", "Soccer", "Ultimate Frisbee"]

@app.route("/")
def index():
    return render_template("index.html", sports=SPORTS)


@app.route("/register", methods=["POST"])
def register():
    if not request.form.get("name"):
        return render_template("faliure.html")
    for sport in request.form.getlist("sport"):
        if sport not in SPORTS:
            return render_template("faliure.html")
    return render_template("success.html")
