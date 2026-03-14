import sqlite3
import os

BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, "chat.db")

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

c.execute(
    """
    CREATE TABLE IF NOT EXISTS faq (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT NOT NULL,
        answer TEXT NOT NULL
    )
    """
)

# Example keyword-based answers. You can edit or extend these.
rows = [
    (
        "meeting",
        "Meetings are stored in your calendar. Click a day and use the add-event form to create one.",
    ),
    (
        "task",
        "Tasks are managed in your to-do list. You can create, edit, and complete tasks from there.",
    ),
    (
        "event",
        "Events can have start and end times, colors, and reminders in the calendar view.",
    ),
]

# Simple upsert: avoid duplicate keywords
for keyword, answer in rows:
    existing = c.execute(
        "SELECT id FROM faq WHERE keyword = ?",
        (keyword,),
    ).fetchone()
    if existing is None:
        c.execute(
            "INSERT INTO faq (keyword, answer) VALUES (?, ?)",
            (keyword, answer),
        )

conn.commit()
conn.close()

print("Database initialized at:", DB_PATH)
