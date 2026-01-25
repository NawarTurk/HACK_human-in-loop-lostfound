import os
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from embed_text_gemini import embed_text_gemini

# Load ROOT .env file (lostfound/.env) using pathlib
root_dir = Path(__file__).resolve().parent.parent.parent
env_path = root_dir / '.env'
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)
CORS(app)

@app.route("/embed-text", methods=["POST"])
def embed_text():
    print("[TXT-EMB] Received text")
    
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({"status": "error", "message": "No text provided"}), 400
    
    text = data['text']
    
    try:
        embedding = embed_text_gemini(text)
        
        print(f"[TXT-EMB] Returning embedding, dim = {len(embedding)}")
        
        return jsonify({
            "status": "ok",
            "embedding": embedding
        })
    
    except Exception as e:
        print(f"[TXT-EMB] Error: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    host = os.getenv("TEXT_EMB_HOST", "localhost")
    port = int(os.getenv("TEXT_EMB_PORT", 8020))
    
    print(f"Loading config from: {env_path}")
    print(f"Starting text embedding service on {host}:{port}")
    
    app.run(host=host, port=port, debug=True)
