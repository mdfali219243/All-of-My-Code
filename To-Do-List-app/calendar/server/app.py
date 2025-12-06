from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import openai

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure OpenAI API
# Ideally, this should come from environment variables
# For now, we will expect the user to set OPENAI_API_KEY environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')

    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

    if not openai.api_key:
        return jsonify({
            'reply': "OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable in the server terminal."
        })

    try:
        # Call OpenAI API (using new 1.0.0+ syntax or compatible old syntax)
        # Using chat completions
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful calendar assistant. You help users manage their schedule."},
                {"role": "user", "content": user_message}
            ]
        )
        
        reply = response.choices[0].message.content
        return jsonify({'reply': reply})

    except Exception as e:
        print(f"Error calling OpenAI: {e}")
        return jsonify({'reply': f"Error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
