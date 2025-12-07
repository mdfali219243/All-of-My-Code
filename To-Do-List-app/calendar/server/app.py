from flask import Flask, request, jsonify
import requests
import re
import json
from datetime import datetime

app = Flask(__name__)

# Manual CORS setup
@app.after_request
def after_request(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    return response

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

@app.route('/api/reset', methods=['POST', 'OPTIONS'])
def reset_chat():
    global conversation_history
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    conversation_history = [{"role": "system", "content": SYSTEM_PROMPT}]
    return jsonify({'status': 'Conversation reset'})

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    data = request.json
    user_message = data.get('message', '')

    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

    try:
        sanitized_message = user_message.encode('utf-8', 'ignore').decode('utf-8')
        
        # Add context about current date
        context_message = f"{sanitized_message} (Today is {get_today()})"
        conversation_history.append({"role": "user", "content": context_message})

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
            return jsonify({'reply': f"Error: Ollama returned status {response.status_code}"}), 500
        
        result = response.json()
        reply = result.get('message', {}).get('content', 'No response from AI')
        
        conversation_history.append({"role": "assistant", "content": reply})
        
        # Parse for action blocks
        actions = []
        
        # Find ADD_TASK actions
        task_pattern = r'\[ACTION:ADD_TASK\](.*?)\[/ACTION\]'
        task_matches = re.findall(task_pattern, reply, re.DOTALL)
        for match in task_matches:
            try:
                action_data = json.loads(match.strip())
                actions.append({"type": "ADD_TASK", "data": action_data})
            except:
                pass
        
        # Find ADD_EVENT actions
        event_pattern = r'\[ACTION:ADD_EVENT\](.*?)\[/ACTION\]'
        event_matches = re.findall(event_pattern, reply, re.DOTALL)
        for match in event_matches:
            try:
                action_data = json.loads(match.strip())
                actions.append({"type": "ADD_EVENT", "data": action_data})
            except:
                pass
        
        # Clean the reply (remove action blocks for display)
        clean_reply = re.sub(r'\[ACTION:.*?\].*?\[/ACTION\]', '', reply, flags=re.DOTALL).strip()
        if not clean_reply:
            clean_reply = "Done!"
        
        return jsonify({
            'reply': clean_reply,
            'actions': actions
        })

    except requests.exceptions.ConnectionError:
        return jsonify({'reply': "Error: Cannot connect to Ollama. Make sure it's running (ollama serve)"}), 500
    except Exception as e:
        print(f"Error calling Ollama: {e}")
        return jsonify({'reply': f"Error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
