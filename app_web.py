#app_web.py
#/usr/bin/env python3
"""
MYCHAT APP - Web UI server.
Run with: python app_web.py
Then open http://127.0.0.1:5000 in your browser.
"""

import os
import logging
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from voice_assistant import VoiceAssistant

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder="static")

# Enable CORS for all routes (needed for Node.js backend to call this API)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://localhost:5173", "127.0.0.1"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Assistant without mic/TTS for API-only use
assistant = VoiceAssistant(use_voice=False)


@app.route("/")
def index():
    """Serve the master web UI homepage."""
    return send_from_directory("static", "master.html")


@app.route("/classic")
def classic():
    """Serve the classic web UI."""
    return send_from_directory("static", "index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    """Handle chat requests with voice input text or regular text input."""
    try:
        data = request.get_json() or {}
        message = (data.get("message") or "").strip()
        
        if not message:
            logger.warning("Empty message received")
            return jsonify({
                "error": "Message is required", 
                "response": None
            }), 400
        
        logger.info(f"Processing message: {message[:100]}...")
        
        # Get AI response
        response = assistant.get_ai_response(message)
        
        if not response:
            logger.error("No response from AI")
            return jsonify({
                "response": None, 
                "error": "Could not generate response. Please try again."
            }), 500
        
        logger.info(f"Response generated: {response[:100]}...")
        return jsonify({
            "response": response, 
            "error": None
        })
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        return jsonify({
            "response": None, 
            "error": f"An error occurred: {str(e)}"
        }), 500


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "message": "MYCHAT APP is running"})


@app.route("/api/cache", methods=["DELETE"])
def clear_cache():
    """Clear the API response cache."""
    try:
        # If cache_helper is imported, clear it
        from cache_helper import cache
        cache.clear()
        logger.info("Cache cleared")
        return jsonify({"status": "success", "message": "Cache cleared"})
    except Exception as e:
        logger.warning(f"Cache clear failed: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print("=" * 60)
    print("MYCHAT APP - Master Level UI")
    print("=" * 60)
    print(f"Server running at http://127.0.0.1:{port}")
    print(f"Master UI: http://127.0.0.1:{port}")
    print(f"Classic UI: http://127.0.0.1:{port}/classic")
    print("\nFeatures:")
    print("  • Text input - Type your question")
    print("  • Voice input - Click the microphone icon")
    print("  • Voice output - AI speaks the response")
    print("  • Chat history - Sidebar with previous chats")
    print("  • Settings panel - Voice controls, theme toggle")
    print("  • Audio visualization - See voice input levels")
    print("\nInterface:")
    print("  • Multi-view system (Chat, History, Settings)")
    print("  • Dark/Light theme toggle")
    print("  • Responsive mobile design")
    print("  • Professional sidebar navigation")
    print("\nSupported Browsers:")
    print("  • Chrome, Edge, Safari, Firefox")
    print("  • Desktop & Mobile browsers")
    print("=" * 60)
    app.run(host="0.0.0.0", port=port, debug=False)

