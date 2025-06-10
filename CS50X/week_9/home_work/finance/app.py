import os

from cs50 import SQL
from flask import Flask, flash, redirect, render_template, request, session
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash

from helpers import apology, login_required, lookup, usd

# Configure application
app = Flask(__name__)

# Custom filter
app.jinja_env.filters["usd"] = usd

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure CS50 Library to use SQLite database
db = SQL("sqlite:///finance.db")


@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


@app.route("/")
@login_required
def index():
    user_id = session["user_id"]

    stocks = db.execute(
        "SELECT symbol, name, price, SUM(shares) as total_shares FROM transctions WHERE user_id = ? GROUP BY symbol", user_id)
    cash = db.execute("SELECT cash FROM users WHERE id = ?", user_id)[0]["cash"]

    total_cash = cash
    for stock in stocks:
        total_cash += stock["price"] * stock["total_shares"]

    return render_template("index.html", stocks=stocks, cash=cash, usd=usd, total_cash=total_cash)


@app.route("/buy", methods=["GET", "POST"])
@login_required
def buy():
    if request.method == "POST":
        symbol = request.form.get("symbol").upper()
        if not symbol:
            return apology("have to fill the symbol name")

        item = lookup(symbol)
        if not item:
            return apology("Invalid symbol")

        try:
            shares = int(request.form.get("shares"))
        except:
            return apology("have to write the number shares you wanna buy")
        if shares <= 0:
            return apology("Must have write positve number")

        user_id = session["user_id"]
        cash = db.execute("SELECT cash FROM users WHERE id = ?", user_id)[0]["cash"]
        item_name = item["symbol"]
        item_price = item["price"]
        total_price = item_price * shares
        transaction_type = "buy"

        if cash < total_price:
            return apology("Not enough Money")
        else:
            db.execute("UPDATE users SET cash = ? WHERE id = ?", cash - total_price, user_id)
            db.execute("INSERT INTO transctions (user_id, name, shares, price, type, symbol) VALUES(?, ?, ?, ?, ?, ?)",
                       user_id, item_name, shares, item_price, transaction_type, symbol)

        return redirect("/")

    else:
        return render_template("buy.html")


@app.route("/history")
@login_required
def history():
    """Show history of transactions"""
    user_id = session["user_id"]
    transactions = db.execute(
        "SELECT type, symbol, price, shares, time FROM transctions WHERE user_id = ?", user_id)

    return render_template("history.html", transactions=transactions, usd=usd)


@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""

    # Forget any user_id
    session.clear()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":
        # Ensure username was submitted
        if not request.form.get("username"):
            return apology("must provide username", 403)

        # Ensure password was submitted
        elif not request.form.get("password"):
            return apology("must provide password", 403)

        # Query database for username
        rows = db.execute(
            "SELECT * FROM users WHERE username = ?", request.form.get("username")
        )

        # Ensure username exists and password is correct
        if len(rows) != 1 or not check_password_hash(
            rows[0]["hash"], request.form.get("password")
        ):
            return apology("invalid username and/or password", 403)

        # Remember which user has logged in
        session["user_id"] = rows[0]["id"]

        # Redirect user to home page
        return redirect("/")

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("login.html")


@app.route("/logout")
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    # Redirect user to login form
    return redirect("/")


@app.route("/quote", methods=["GET", "POST"])
@login_required
def quote():
    """Get stock quote."""
    if request.method == "POST":
        symbol = request.form.get("symbol").upper()
        if not symbol:
            return apology("Please type the symbol")

        item = lookup(symbol)
        if not item:
            return apology("Invalid symbol")
        return render_template("quoted.html", item=item, usd=usd)
    else:
        return render_template("quote.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    session.clear()

    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        confirmation = request.form.get("confirmation")

    # Check if the  user type everything  that are  required
        if not username:
            return apology("Require  username")
        elif not password:
            return apology("Require  password")
        elif not confirmation:
            return apology("You have to fill the confarmation for the passwords")

    # check if the passwords  and confarmation is match
        if password != confirmation:
            return apology("password doesn't match with the confirmation")

        # Hash the user’s password with generate_password_hash
        hash_i = generate_password_hash(password)

        try:
            db.execute("INSERT INTO users (username, hash) VALUES (?, ?)", username, hash_i)
            return redirect("/")
        except:
            return apology("the user name is already there")
    else:
        return render_template("register.html")


@app.route("/sell", methods=["GET", "POST"])
@login_required
def sell():
    """Sell shares of stock"""
    if request.method == "POST":
        user_id = session["user_id"]
        symbol = request.form.get("symbol")
        shares = int(request.form.get("shares"))

        if shares <= 0:
            return apology("Must have to be positive number")
        item_price = lookup(symbol)["price"]
        item_name = lookup(symbol)["symbol"]
        price = shares * item_price

        shares_own = db.execute(
            "SELECT SUM(shares) as total_shares FROM transctions WHERE user_id = ? AND symbol = ? GROUP BY symbol", user_id, symbol)
        if shares_own and shares_own[0]["total_shares"] < shares:
            return apology("You don't have enough share")

        current_cash = db.execute("SELECT cash FROM users WHERE id = ?", user_id)[0]["cash"]
        db.execute("UPDATE users SET cash = ? WHERE id = ?", current_cash + price, user_id)
        db.execute("INSERT INTO transctions (user_id, name, shares, price, type, symbol) VALUES (?, ?, ?, ?, ?, ?)",
                   user_id, item_name, -shares, item_price, "sell", symbol)
        return redirect("/")
    else:
        user_id = session["user_id"]

        symbols = db.execute(
            "SELECT symbol FROM transctions WHERE user_id = ? GROUP BY symbol", user_id)
        return render_template("sell.html", symbols=symbols)
