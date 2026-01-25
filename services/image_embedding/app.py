import os
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# Load ROOT .env file (lostfound/.env) using pathlib
root_dir = Path(__file__).resolve().parent.parent.parent
env_path = root_dir / '.env'
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)
CORS(app)

@app.route('/embed', methods=['POST'])
def embed():
    print("[IMG-EMB] Request received")
    
    image = request.files.get('image')
    if image:
        print(f"[IMG-EMB] Filename: {image.filename}")
    
    print("[IMG-EMB] Returning dummy embedding value")
    
    return jsonify({
        "status": "ok",
        "embedding": [0.42]
    })

if __name__ == '__main__':
    host = os.getenv('IMG_EMB_HOST')
    port = int(os.getenv('IMG_EMB_PORT'))
    
    print(f"Loading config from: {env_path}")
    print(f"Starting image embedding service on {host}:{port}")
    
    app.run(host=host, port=port, debug=True)
