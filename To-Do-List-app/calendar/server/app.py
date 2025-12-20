from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import re
import json
import logging
from datetime import datetime
from database import init_db, get_all_tasks, create_task, update_task, delete_task, save_all_tasks
from database import get_all_events, create_event, update_event, delete_event, save_all_events
from database import save_chat_message, get_chat_history, clear_chat_history

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize database on startup
try:
    init_db()
except Exception as e:
    logger.error(f"Failed to initialize database: {e}")

# Ollama configuration
OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "llama3.2:1b"

# System prompt that instructs AI to return structured actions
SYSTEM_PROMPT = """You are a calendar assistant that helps users manage tasks and events.

IMPORTANT: When the user wants to ADD a task or event, you MUST respond with a JSON action block.

For adding a TASK, respond with:
[ACTION:ADD_TASK]{"title": "task description here"}[/ACTION]
Then add a brief confirmation message.

For adding an EVENT, respond with:
[ACTION:ADD_EVENT]{"title": "event title", "date": "YYYY-MM-DD", "time": "HH:MM"}[/ACTION]
Then add a brief confirmation message. Use today's date if not specified.

Examples:
- User: "add task finish homework" -> [ACTION:ADD_TASK]{"title": "finish homework"}[/ACTION] Done! I've added "finish homework" to your tasks.
- User: "add event meeting at 3pm" -> [ACTION:ADD_EVENT]{"title": "meeting", "date": "2024-12-06", "time": "15:00"}[/ACTION] Done! I've added "meeting" at 3:00 PM today.

For general questions, just respond normally without action blocks.
Keep responses short and helpful."""

# Global conversation history
conversation_history = [{"role": "system", "content": SYSTEM_PROMPT}]

def get_today():
    return datetime.now().strftime("%Y-%m-%d")

# ============ CHAT ENDPOINTS ============

@app.route('/api/reset', methods=['POST'])
def reset_chat():
    global conversation_history
    try:
        conversation_history = [{"role": "system", "content": SYSTEM_PROMPT}]
        clear_chat_history()
        return jsonify({'status': 'Conversation reset'})
    except Exception as e:
        logger.error(f"Error resetting chat: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')

    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

    try:
        sanitized_message = user_message.encode('utf-8', 'ignore').decode('utf-8')
        
        # Save user message to database
        try:
            save_chat_message('user', sanitized_message)
        except Exception as e:
            logger.error(f"DB Error saving user message: {e}")
        
        # Add context about current date
        context_message = f"{sanitized_message} (Today is {get_today()})"
        conversation_history.append({"role": "user", "content": context_message})

        logger.info(f"Sending request to Ollama: {OLLAMA_URL}")
        
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "messages": conversation_history,
                "stream": False
            },
            timeout=60
        )
        
        if response.status_code != 200:
            logger.error(f"Ollama error: status {response.status_code}, response: {response.text}")
            return jsonify({'reply': f"Error: Ollama returned status {response.status_code}"}), 500
        
        result = response.json()
        reply = result.get('message', {}).get('content', 'No response from AI')
        
        conversation_history.append({"role": "assistant", "content": reply})
        
        # Save assistant response to database
        try:
            save_chat_message('assistant', reply)
        except Exception as e:
            logger.error(f"DB Error saving assistant message: {e}")
        
        # Parse for action blocks
        actions = []
        
        # Find ADD_TASK actions
        task_pattern = r'\[ACTION:ADD_TASK\](.*?)\[/ACTION\]'
        task_matches = re.findall(task_pattern, reply, re.DOTALL)
        for match in task_matches:
            try:
                action_data = json.loads(match.strip())
                actions.append({"type": "ADD_TASK", "data": action_data})
                # Also save to database
                create_task(action_data.get('title', ''))
            except Exception as e:
                logger.error(f"Error creating task from AI: {e}")
        
        # Find ADD_EVENT actions
        event_pattern = r'\[ACTION:ADD_EVENT\](.*?)\[/ACTION\]'
        event_matches = re.findall(event_pattern, reply, re.DOTALL)
        for match in event_matches:
            try:
                action_data = json.loads(match.strip())
                actions.append({"type": "ADD_EVENT", "data": action_data})
                # Also save to database
                create_event(
                    title=action_data.get('title', ''),
                    date=action_data.get('date', get_today()),
                    start_time=action_data.get('time', '09:00'),
                    end_time=action_data.get('time', '10:00')
                )
            except Exception as e:
                logger.error(f"Error creating event from AI: {e}")
        
        # Clean the reply (remove action blocks for display)
        clean_reply = re.sub(r'\[ACTION:.*?\].*?\[/ACTION\]', '', reply, flags=re.DOTALL).strip()
        if not clean_reply:
            clean_reply = "Done!"
        
        return jsonify({
            'reply': clean_reply,
            'actions': actions
        })

    except requests.exceptions.ConnectionError:
        logger.error("Connection refused by Ollama")
        return jsonify({'reply': "Error: Cannot connect to Ollama. Make sure it's running (ollama serve)"}), 500
    except Exception as e:
        logger.exception(f"Unexpected error in /api/chat: {e}")
        return jsonify({'reply': f"Error: {str(e)}"}), 500

# ============ TASK ENDPOINTS ============

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    try:
        tasks = get_all_tasks()
        return jsonify(tasks)
    except Exception as e:
        logger.error(f"Error getting tasks: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks', methods=['POST'])
def add_task():
    try:
        data = request.json
        title = data.get('title', data.get('text', ''))
        column_id = data.get('column_id', 'todo-list')
        completed = data.get('completed', False)
        task = create_task(title, column_id, completed)
        return jsonify(task), 201
    except Exception as e:
        logger.error(f"Error adding task: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def modify_task(task_id):
    try:
        data = request.json
        update_task(
            task_id,
            title=data.get('title', data.get('text')),
            column_id=data.get('column_id'),
            completed=data.get('completed')
        )
        return jsonify({'status': 'updated'})
    except Exception as e:
        logger.error(f"Error modifying task: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def remove_task(task_id):
    try:
        delete_task(task_id)
        return jsonify({'status': 'deleted'})
    except Exception as e:
        logger.error(f"Error deleting task: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/sync', methods=['POST'])
def sync_tasks():
    """Bulk sync tasks from frontend"""
    try:
        data = request.json
        save_all_tasks(data)
        return jsonify({'status': 'synced'})
    except Exception as e:
        logger.error(f"Error syncing tasks: {e}")
        return jsonify({'error': str(e)}), 500

# ============ EVENT ENDPOINTS ============

@app.route('/api/events', methods=['GET'])
def get_events():
    try:
        events = get_all_events()
        return jsonify(events)
    except Exception as e:
        logger.error(f"Error getting events: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/events', methods=['POST'])
def add_event():
    try:
        data = request.json
        event = create_event(
            title=data.get('title', ''),
            date=data.get('date', ''),
            start_time=data.get('startTime', ''),
            end_time=data.get('endTime', ''),
            description=data.get('description', ''),
            color=data.get('color', '#4285F4'),
            all_day=data.get('allDay', False)
        )
        return jsonify(event), 201
    except Exception as e:
        logger.error(f"Error adding event: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/events/<event_id>', methods=['PUT'])
def modify_event(event_id):
    try:
        data = request.json
        update_event(event_id, **data)
        return jsonify({'status': 'updated'})
    except Exception as e:
        logger.error(f"Error modifying event: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/events/<event_id>', methods=['DELETE'])
def remove_event(event_id):
    try:
        delete_event(event_id)
        return jsonify({'status': 'deleted'})
    except Exception as e:
        logger.error(f"Error deleting event: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/events/sync', methods=['POST'])
def sync_events():
    """Bulk sync events from frontend"""
    try:
        data = request.json
        save_all_events(data)
        return jsonify({'status': 'synced'})
    except Exception as e:
        logger.error(f"Error syncing events: {e}")
        return jsonify({'error': str(e)}), 500

# ============ CHAT HISTORY ENDPOINTS ============

@app.route('/api/chat/history', methods=['GET'])
def get_history():
    try:
        history = get_chat_history()
        return jsonify(history)
    except Exception as e:
        logger.error(f"Error getting history: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)

