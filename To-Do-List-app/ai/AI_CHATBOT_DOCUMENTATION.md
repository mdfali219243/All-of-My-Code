# AI Chatbot Documentation

## 📖 Overview

Your calendar application includes an AI chatbot assistant that helps users manage tasks and events through natural language. The chatbot uses a **local AI model (Llama 3.2)** via **Ollama**, ensuring your data stays private on your device.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                 │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │   index.html    │    │   tasks.html    │                    │
│  │   (Calendar)    │    │   (Task Board)  │                    │
│  └────────┬────────┘    └────────┬────────┘                    │
│           │                      │                              │
│           └──────────┬───────────┘                              │
│                      ▼                                          │
│           ┌─────────────────────┐                               │
│           │    ai-chat.js       │  JavaScript Frontend          │
│           │  - Chat UI          │                               │
│           │  - Message handling │                               │
│           │  - localStorage     │                               │
│           └──────────┬──────────┘                               │
└──────────────────────┼──────────────────────────────────────────┘
                       │ HTTP POST (JSON)
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                        BACKEND                                   │
│           ┌─────────────────────┐                                │
│           │   Flask Server      │  Python Backend                │
│           │   (app.py)          │  Port: 5000                    │
│           │  - API endpoints    │                                │
│           │  - Action parsing   │                                │
│           └──────────┬──────────┘                                │
│                      │                                           │
│                      ▼                                           │
│           ┌─────────────────────┐                                │
│           │   Ollama Service    │  Local AI Server               │
│           │   (llama3.2:1b)     │  Port: 11434                   │
│           └─────────────────────┘                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
calendar/
├── javascript/
│   ├── ai-chat.js          # Frontend chat logic
│   ├── tasks.js            # Task board (includes chat integration)
│   └── index.js            # Calendar (includes chat integration)
├── server/
│   ├── app.py              # Flask backend server
│   └── requirements.txt    # Python dependencies
└── style/
    └── (CSS files)         # Chat styling
```

---

## 🔧 How to Run the AI Chatbot

### Step 1: Install Ollama

Ollama is a local AI model runner. Install it from: https://ollama.ai

```bash
# macOS (via Homebrew)
brew install ollama

# Or download from ollama.ai
```

### Step 2: Download the AI Model

```bash
# Pull the Llama 3.2 1B model (lightweight, fast)
ollama pull llama3.2:1b

# Or for better responses (requires more RAM):
ollama pull llama3.2:3b
```

### Step 3: Start Ollama Service

```bash
# Start the Ollama server (runs on port 11434)
ollama serve
```

### Step 4: Install Python Dependencies

```bash
cd calendar/server
pip install -r requirements.txt
```

### Step 5: Start the Flask Server

```bash
cd calendar/server
python app.py
```

The server runs on `http://127.0.0.1:5000`

### Step 6: Open the Calendar

Open `index.html` or `tasks.html` in your browser. The AI chat is ready!

---

## 📡 API Endpoints

### POST `/api/chat`
Send a message to the AI.

**Request:**
```json
{
  "message": "Add a task to buy groceries"
}
```

**Response:**
```json
{
  "reply": "Done! I've added \"buy groceries\" to your tasks.",
  "actions": [
    {
      "type": "ADD_TASK",
      "data": { "title": "buy groceries" }
    }
  ]
}
```

### POST `/api/reset`
Clear the conversation history.

**Response:**
```json
{
  "status": "Conversation reset"
}
```

---

## 💾 Data Storage (Database)

### Current Storage: localStorage

The app uses **browser localStorage** for data persistence. Here's how to access it:

#### Access Chat History
```javascript
// In browser console (F12 → Console)

// Get all chat sessions
const chatHistory = JSON.parse(localStorage.getItem('ai-chat-history') || '[]');
console.log(chatHistory);

// Get saved chats
const savedChats = JSON.parse(localStorage.getItem('chatgpt-chats') || '[]');
console.log(savedChats);
```

#### Access Tasks
```javascript
// Get all tasks from Kanban board
const tasks = JSON.parse(localStorage.getItem('kanban-board') || '{}');
console.log(tasks);

// Structure:
// {
//   "todo-list": [{ text: "Task 1", completed: false }],
//   "inprogress-list": [...],
//   "done-list": [...]
// }
```

#### Access Calendar Events
```javascript
// Get all calendar events
const events = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
console.log(events);

// Structure:
// [
//   {
//     id: "event-123",
//     title: "Meeting",
//     date: "2024-12-07",
//     startTime: "09:00",
//     endTime: "10:00",
//     color: "#4285F4"
//   }
// ]
```

#### Clear All Data
```javascript
// Clear everything (careful!)
localStorage.clear();

// Or clear specific items
localStorage.removeItem('kanban-board');
localStorage.removeItem('calendarEvents');
localStorage.removeItem('ai-chat-history');
```

---

## 🚀 Improvement Ideas

### 1. Add a Real Database (SQLite/PostgreSQL)

Replace localStorage with a proper database for better data management:

```python
# server/app.py - Add SQLite support
import sqlite3

def init_db():
    conn = sqlite3.connect('calendar.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS tasks
                 (id INTEGER PRIMARY KEY, title TEXT, column TEXT, completed BOOLEAN)''')
    c.execute('''CREATE TABLE IF NOT EXISTS events
                 (id INTEGER PRIMARY KEY, title TEXT, date TEXT, start_time TEXT, end_time TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS chat_history
                 (id INTEGER PRIMARY KEY, role TEXT, content TEXT, timestamp DATETIME)''')
    conn.commit()
    conn.close()
```

### 2. Use a Better AI Model

For more accurate responses:

```bash
# Better quality (needs 8GB+ RAM)
ollama pull llama3.2:3b

# Or use GPT-4 via OpenAI API
# Update app.py to use openai library instead of Ollama
```

**Using OpenAI API:**
```python
# server/app.py
import openai

openai.api_key = "your-api-key"

def generate_response(message):
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": message}
        ]
    )
    return response.choices[0].message.content
```

### 3. Add Voice Input

```javascript
// ai-chat.js - Add speech-to-text
const recognition = new webkitSpeechRecognition();
recognition.continuous = false;
recognition.lang = 'en-US';

voiceBtn.addEventListener('click', () => {
    recognition.start();
});

recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    chatInput.value = transcript;
    sendMessage();
};
```

### 4. Add Recurring Tasks/Events

```python
# Enhanced action parsing in app.py
# [ACTION:ADD_EVENT]{"title": "Team meeting", "date": "2024-12-07", "time": "09:00", "recurring": "weekly"}[/ACTION]
```

### 5. Smart Reminders

```javascript
// Add notification support
if (Notification.permission === 'granted') {
    new Notification('Task Reminder', {
        body: 'You have a meeting in 15 minutes',
        icon: '/path/to/icon.png'
    });
}
```

### 6. Natural Language Date Parsing

Install `dateparser` for Python:
```bash
pip install dateparser
```

```python
import dateparser

def parse_date(text):
    # "tomorrow at 3pm" → datetime object
    return dateparser.parse(text)
```

### 7. Add Context Awareness

Improve the system prompt to understand current tasks:
```python
SYSTEM_PROMPT = f"""You are a calendar assistant.
Current date: {get_today()}
User's tasks: {get_user_tasks()}
User's upcoming events: {get_upcoming_events()}
..."""
```

### 8. Multi-User Support

Add user authentication:
```python
from flask_login import LoginManager, UserMixin

# Add user table and session management
```

### 9. Export/Import Data

```javascript
// Export to JSON
function exportData() {
    const data = {
        tasks: JSON.parse(localStorage.getItem('kanban-board')),
        events: JSON.parse(localStorage.getItem('calendarEvents')),
        chats: JSON.parse(localStorage.getItem('ai-chat-history'))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    // Download file
}
```

### 10. Cloud Sync

Sync data across devices using Firebase or your own backend:
```javascript
// Using Firebase
import { getFirestore, collection, addDoc } from 'firebase/firestore';

async function syncToCloud(data) {
    await addDoc(collection(db, 'calendar-data'), data);
}
```

---

## 🐛 Troubleshooting

### "Cannot connect to Ollama"
- Make sure Ollama is running: `ollama serve`
- Check if port 11434 is available

### "Flask server not responding"
- Start the Flask server: `cd server && python app.py`
- Check if port 5000 is available

### "AI responses are slow"
- Use a smaller model: `llama3.2:1b`
- Or upgrade your hardware (more RAM helps)

### CORS Errors
- The Flask server includes CORS headers
- Make sure you're running the frontend from `file://` or a local server

---

## 📊 Data Flow Diagram

```
User types message
        │
        ▼
┌───────────────────┐
│  Frontend (JS)    │
│  ai-chat.js       │
└─────────┬─────────┘
          │ fetch('/api/chat')
          ▼
┌───────────────────┐
│  Flask Backend    │
│  app.py           │
│  - Add context    │
│  - Call Ollama    │
└─────────┬─────────┘
          │ HTTP POST
          ▼
┌───────────────────┐
│  Ollama + Llama   │
│  - Process prompt │
│  - Generate reply │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Flask Backend    │
│  - Parse actions  │
│  - Clean response │
└─────────┬─────────┘
          │ JSON response
          ▼
┌───────────────────┐
│  Frontend (JS)    │
│  - Display reply  │
│  - Execute actions│
│  - Update UI      │
└───────────────────┘
```

---

## 🔐 Security Notes

1. **All data is local** - Nothing leaves your machine unless you add cloud sync
2. **No API keys exposed** - Ollama runs locally, no external API needed
3. **CORS is open** - Only for local development, restrict in production

---

## 📝 Summary

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend  | JavaScript | Chat UI, localStorage |
| Backend   | Flask/Python | API, action parsing |
| AI Model  | Ollama + Llama | Natural language understanding |
| Storage   | localStorage | Tasks, events, chat history |

To improve: Consider adding SQLite, using GPT-4 API, voice input, and cloud sync!
