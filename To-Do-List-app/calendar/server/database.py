"""
SQLite Database Module for Calendar App
Handles all database operations for tasks, events, and chat history
"""

import sqlite3
import os
from datetime import datetime

# Use a directory outside the project to avoid triggering dev server reloads
DATA_DIR = os.path.expanduser('~/.calendar_app_data')
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)
DATABASE_PATH = os.path.join(DATA_DIR, 'calendar.db')

def get_db_connection():
    """Get a database connection with row factory for dict-like access"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database with required tables"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Tasks table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            column_id TEXT NOT NULL DEFAULT 'todo-list',
            completed BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Events table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            date TEXT NOT NULL,
            start_time TEXT,
            end_time TEXT,
            description TEXT,
            color TEXT DEFAULT '#4285F4',
            all_day BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Chat history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            session_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized successfully!")

# ============ TASK OPERATIONS ============

def get_all_tasks():
    """Get all tasks grouped by column"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM tasks ORDER BY created_at DESC')
    rows = cursor.fetchall()
    conn.close()
    
    # Group by column
    tasks_by_column = {
        'todo-list': [],
        'inprogress-list': [],
        'done-list': []
    }
    
    for row in rows:
        task = {
            'id': row['id'],
            'text': row['title'],
            'completed': bool(row['completed'])
        }
        column = row['column_id']
        if column in tasks_by_column:
            tasks_by_column[column].append(task)
    
    return tasks_by_column

def create_task(title, column_id='todo-list', completed=False):
    """Create a new task"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO tasks (title, column_id, completed) VALUES (?, ?, ?)',
        (title, column_id, completed)
    )
    task_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {'id': task_id, 'text': title, 'column_id': column_id, 'completed': completed}

def update_task(task_id, title=None, column_id=None, completed=None):
    """Update an existing task"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    updates = []
    values = []
    
    if title is not None:
        updates.append('title = ?')
        values.append(title)
    if column_id is not None:
        updates.append('column_id = ?')
        values.append(column_id)
    if completed is not None:
        updates.append('completed = ?')
        values.append(completed)
    
    if updates:
        updates.append('updated_at = CURRENT_TIMESTAMP')
        values.append(task_id)
        query = f"UPDATE tasks SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, values)
    
    conn.commit()
    conn.close()
    return True

def delete_task(task_id):
    """Delete a task"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
    conn.commit()
    conn.close()
    return True

def save_all_tasks(tasks_by_column):
    """Save all tasks from frontend (bulk update)"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Clear existing tasks
    cursor.execute('DELETE FROM tasks')
    
    # Insert all tasks
    for column_id, tasks in tasks_by_column.items():
        for task in tasks:
            title = task.get('text', task.get('title', ''))
            completed = task.get('completed', False)
            cursor.execute(
                'INSERT INTO tasks (title, column_id, completed) VALUES (?, ?, ?)',
                (title, column_id, completed)
            )
    
    conn.commit()
    conn.close()
    return True

# ============ EVENT OPERATIONS ============

def get_all_events():
    """Get all events"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM events ORDER BY date, start_time')
    rows = cursor.fetchall()
    conn.close()
    
    events = []
    for row in rows:
        events.append({
            'id': f"event-{row['id']}",
            'title': row['title'],
            'date': row['date'],
            'startTime': row['start_time'],
            'endTime': row['end_time'],
            'description': row['description'] or '',
            'color': row['color'],
            'allDay': bool(row['all_day'])
        })
    
    return events

def create_event(title, date, start_time=None, end_time=None, description='', color='#4285F4', all_day=False):
    """Create a new event"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''INSERT INTO events (title, date, start_time, end_time, description, color, all_day) 
           VALUES (?, ?, ?, ?, ?, ?, ?)''',
        (title, date, start_time, end_time, description, color, all_day)
    )
    event_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {
        'id': f"event-{event_id}",
        'title': title,
        'date': date,
        'startTime': start_time,
        'endTime': end_time,
        'description': description,
        'color': color,
        'allDay': all_day
    }

def update_event(event_id, **kwargs):
    """Update an existing event"""
    # Extract numeric ID from "event-123" format
    if isinstance(event_id, str) and event_id.startswith('event-'):
        event_id = int(event_id.replace('event-', ''))
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    field_mapping = {
        'title': 'title',
        'date': 'date',
        'startTime': 'start_time',
        'endTime': 'end_time',
        'description': 'description',
        'color': 'color',
        'allDay': 'all_day'
    }
    
    updates = []
    values = []
    
    for js_key, db_key in field_mapping.items():
        if js_key in kwargs:
            updates.append(f'{db_key} = ?')
            values.append(kwargs[js_key])
    
    if updates:
        updates.append('updated_at = CURRENT_TIMESTAMP')
        values.append(event_id)
        query = f"UPDATE events SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, values)
    
    conn.commit()
    conn.close()
    return True

def delete_event(event_id):
    """Delete an event"""
    # Extract numeric ID from "event-123" format
    if isinstance(event_id, str) and event_id.startswith('event-'):
        event_id = int(event_id.replace('event-', ''))
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM events WHERE id = ?', (event_id,))
    conn.commit()
    conn.close()
    return True

def save_all_events(events):
    """Save all events from frontend (bulk update)"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Clear existing events
    cursor.execute('DELETE FROM events')
    
    # Insert all events
    for event in events:
        cursor.execute(
            '''INSERT INTO events (title, date, start_time, end_time, description, color, all_day) 
               VALUES (?, ?, ?, ?, ?, ?, ?)''',
            (
                event.get('title', ''),
                event.get('date', ''),
                event.get('startTime', ''),
                event.get('endTime', ''),
                event.get('description', ''),
                event.get('color', '#4285F4'),
                event.get('allDay', False)
            )
        )
    
    conn.commit()
    conn.close()
    return True

# ============ CHAT HISTORY OPERATIONS ============

def save_chat_message(role, content, session_id=None):
    """Save a chat message"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO chat_history (role, content, session_id) VALUES (?, ?, ?)',
        (role, content, session_id)
    )
    conn.commit()
    conn.close()

def get_chat_history(session_id=None, limit=50):
    """Get chat history, optionally filtered by session"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if session_id:
        cursor.execute(
            'SELECT * FROM chat_history WHERE session_id = ? ORDER BY created_at DESC LIMIT ?',
            (session_id, limit)
        )
    else:
        cursor.execute(
            'SELECT * FROM chat_history ORDER BY created_at DESC LIMIT ?',
            (limit,)
        )
    
    rows = cursor.fetchall()
    conn.close()
    
    return [{'role': row['role'], 'content': row['content'], 'timestamp': row['created_at']} for row in rows]

def clear_chat_history(session_id=None):
    """Clear chat history"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if session_id:
        cursor.execute('DELETE FROM chat_history WHERE session_id = ?', (session_id,))
    else:
        cursor.execute('DELETE FROM chat_history')
    
    conn.commit()
    conn.close()

# Initialize database when module is imported
if __name__ == '__main__':
    init_db()
