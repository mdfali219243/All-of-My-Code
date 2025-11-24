from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, "chat.db")

app = Flask(__name__)

# Keep Flask-CORS, but also add an explicit after_request hook so
# every response (including preflight) has the correct headers.
CORS(app)


ALLOWED_ORIGINS = {
    "http://127.0.0.1:5500",
    "http://localhost:5500",
}


@app.after_request
def add_cors_headers(response):
    """Echo the requesting origin when it matches our local dev hosts."""
    origin = request.headers.get("Origin")
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"

    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}
    message = data.get("message", "")
    lower = message.lower()

    # 1) Try to answer from the database based on keyword matches
    row = None
    try:
        conn = get_db_connection()
        cur = conn.execute(
            "SELECT answer FROM faq WHERE ? LIKE '%' || keyword || '%'",
            (lower,),
        )
        row = cur.fetchone()
        conn.close()
    except Exception:
        row = None

    # Optional event creation action
    action = None
    event = None

    # 2) Try to interpret message as a "create event" instruction in a more
    #    natural-language-friendly way.
    import re

    date_str = None
    time_str = None

    iso_date_match = None
    hhmm_match = None
    ampm_match = None
    month_match = None

    # 2a) First, look for an explicit ISO date (YYYY-MM-DD)
    iso_date_match = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", lower)
    if iso_date_match:
        date_str = iso_date_match.group(1)

    # 2b) If no ISO date, look for month-name dates like "december 16" or "dec 16"
    if date_str is None:
        month_map = {
            "january": 1, "jan": 1,
            "february": 2, "feb": 2,
            "march": 3, "mar": 3,
            "april": 4, "apr": 4,
            "may": 5,
            "june": 6, "jun": 6,
            "july": 7, "jul": 7,
            "august": 8, "aug": 8,
            "september": 9, "sep": 9, "sept": 9,
            "october": 10, "oct": 10,
            "november": 11, "nov": 11,
            "december": 12, "dec": 12,
        }

        month_pattern = r"\b(" + "|".join(month_map.keys()) + r")\s+(\d{1,2})\b"
        month_match = re.search(month_pattern, lower)
        if month_match:
            month_name = month_match.group(1)
            day = int(month_match.group(2))

            # Choose a year: explicit year > "next year" > "this year" > current year
            year = datetime.now().year
            year_match = re.search(r"\b(20\d{2})\b", lower)
            if year_match:
                year = int(year_match.group(1))
            elif "next year" in lower:
                year = year + 1
            # "this year" just keeps current year

            month = month_map[month_name]
            try:
                date_str = f"{year:04d}-{month:02d}-{day:02d}"
            except ValueError:
                date_str = None

    # 2b-2) If we still don't have a date, handle relative words like "today" and "tomorrow"
    if date_str is None:
        now = datetime.now()
        if "today" in lower:
            date_str = now.strftime("%Y-%m-%d")
        elif "tomorrow" in lower:
            date_str = (now + timedelta(days=1)).strftime("%Y-%m-%d")

    # 2c) Time: HH:MM, or 3pm/3 pm, or default to 09:00 if none found
    # Look for 24-hour time first
    hhmm_match = re.search(r"\b(\d{1,2}:\d{2})\b", lower)
    if hhmm_match:
        time_str = hhmm_match.group(1)
    else:
        # Look for "3pm", "3 pm", etc.
        ampm_match = re.search(r"\b(\d{1,2})\s*(am|pm)\b", lower)
        if ampm_match:
            hour = int(ampm_match.group(1))
            ampm = ampm_match.group(2)
            if ampm == "pm" and hour != 12:
                hour += 12
            if ampm == "am" and hour == 12:
                hour = 0
            time_str = f"{hour:02d}:00"

    if time_str is None:
        # Sensible default when user omits time
        time_str = "09:00"

    # Only treat this as an event instruction if the word "event" appears
    # and we managed to build a date.
    if "event" in lower and date_str is not None:
        # Extract a simple title from the remaining text
        title = "New event"

        called_idx = lower.find("called")
        if called_idx != -1:
            raw_title = message[called_idx + len("called"):].strip(" .!")
            if raw_title:
                title = raw_title
        else:
            # Try to use text after the date/time as a rough title
            tail_start = 0
            if hhmm_match:
                tail_start = lower.find(hhmm_match.group(1)) + len(hhmm_match.group(1))
            elif ampm_match:
                tail_start = lower.find(ampm_match.group(0)) + len(ampm_match.group(0))
            elif iso_date_match:
                tail_start = lower.find(iso_date_match.group(1)) + len(iso_date_match.group(1))
            elif month_match:
                tail_start = lower.find(month_match.group(0)) + len(month_match.group(0))

            raw_title = message[tail_start:].strip(" ,.!:")
            if raw_title:
                title = raw_title

        event = {
            "date": date_str,
            "time": time_str,
            "title": title,
        }

        action = "create_event"
        reply = f"Got it! I created an event '{title}' on {date_str} at {time_str}."

    elif row is not None:
        # 3) Answer from DB if we found a matching keyword
        reply = row["answer"]
    else:
        # 4) Fallback: simple conditional responses in Python
        if "hello" in lower or "hi" in lower:
            reply = "Hello from the Python backend! How can I help you today?"
        elif "meeting" in lower:
            reply = "Meetings are stored in your calendar. Click a day to add one."
        elif "task" in lower:
            reply = "Tasks are managed in your to-do list section of the app."
        elif "code" in lower or "programming" in lower:
            reply = "This answer is generated by the Python backend using conditions."
        else:
            reply = "I don't have that in my database yet, but I can still try to help."

    payload = {"reply": reply}
    if action is not None and event is not None:
        payload["action"] = action
        payload["event"] = event

    return jsonify(payload)


if __name__ == "__main__":
    # Runs on http://127.0.0.1:5000 by default
    app.run(debug=True)
