import os
from pathlib import Path
from datetime import datetime
import requests
from flask import Flask, jsonify, request, session
from flask_cors import CORS
from dotenv import load_dotenv
from auth import login_user

# Load ROOT .env file (lostfound/.env) using pathlib
root_dir = Path(__file__).resolve().parent.parent
env_path = root_dir / '.env'
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
CORS(app, supports_credentials=True)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "service": "gateway"
    })

@app.route('/config', methods=['GET'])
def config():
    host = os.getenv('GATEWAY_HOST')
    port = os.getenv('GATEWAY_PORT')
    debug = os.getenv('GATEWAY_DEBUG')
    
    return jsonify({
        "host": host,
        "port": int(port),
        "debug": debug == '1'
    })

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({
            "status": "error",
            "message": "No data provided"
        }), 400
    
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({
            "status": "error",
            "message": "Username and password required"
        }), 400
    
    user = login_user(username, password)
    if user:
        session['user'] = user
        return jsonify({
            "status": "ok",
            "user": user
        })
    else:
        return jsonify({
            "status": "error",
            "message": "Invalid username or password"
        }), 401

@app.route('/auth/logout', methods=['GET'])
def logout():
    session.pop('user', None)
    return jsonify({
        "status": "ok",
        "message": "Logged out successfully"
    })

@app.route('/auth/user', methods=['GET'])
def get_user():
    user = session.get('user')
    return jsonify({"user": user if user else None})

@app.route('/inquiry/submit', methods=['POST'])
def submit_inquiry():
    # Handle FormData instead of JSON
    inquiry = {
        "description": request.form.get('description'),
        "date_lost": request.form.get('date_lost'),
        "place_lost": request.form.get('place_lost'),
        "username": request.form.get('username')
    }
    
    # Handle image file if provided
    image = request.files.get('image')
    print(f"DEBUG: Image file received: {image}")
    print(f"DEBUG: Image filename: {image.filename if image else 'None'}")
    
    if image and image.filename:
        # Get user role from session
        user = session.get('user')
        print(f"DEBUG: User from session: {user}")
        
        if user:
            user_role = user.get('role', 'user')
            
            # Determine storage folder based on role
            if user_role == 'admin':
                storage_folder = Path(__file__).resolve().parent.parent / 'storage' / 'inventory_items'
            else:
                storage_folder = Path(__file__).resolve().parent.parent / 'storage' / 'user_inquiries'
            
            # Create folder if it doesn't exist
            storage_folder.mkdir(parents=True, exist_ok=True)
            
            # Generate unique filename with timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            safe_filename = f"{timestamp}_{image.filename}"
            file_path = storage_folder / safe_filename
            
            # Save the file
            image.save(str(file_path))
            
            # Add saved filename to inquiry
            inquiry['image_saved_as'] = safe_filename
            print(f"Image saved successfully to: {file_path}")
            
            # Call image embedding service
            print("[GW] Starting image embedding...")
            try:
                emb_host = os.getenv('IMG_EMB_HOST')
                emb_port = os.getenv('IMG_EMB_PORT')
                emb_url = f"http://{emb_host}:{emb_port}/embed"
                
                # Reopen the file to send to embedding service
                with open(file_path, 'rb') as f:
                    files = {'image': (safe_filename, f, 'image/jpeg')}
                    response = requests.post(emb_url, files=files, timeout=10)
                    if response.status_code == 200:
                        emb_json = response.json()
                        embedding = emb_json.get("embedding", [])
                        description = emb_json.get("description", "")

                        print("[GW] Embedding received, length =", len(embedding))
                        print("[GW] AI Description:", description)

                        # attach for later use
                        inquiry["embedding"] = embedding
                        inquiry["ai_description"] = description
                    else:
                        print(f"[GW] Embedding FAILED: HTTP {response.status_code}")
            except Exception as e:
                print(f"[GW] Embedding FAILED: {str(e)}")
        else:
            print("ERROR: No user in session!")
    else:
        print("DEBUG: No image uploaded or empty filename")
    
    # Print to console for now latter for dataaset
    print("Inquiry received:", inquiry)
    
    return jsonify({
        "status": "ok",
        "message": "Inquiry received"
    })

if __name__ == '__main__':
    host = os.getenv('GATEWAY_HOST')
    port = int(os.getenv('GATEWAY_PORT'))
    debug = bool(int(os.getenv('GATEWAY_DEBUG')))
    
    print(f"Loading config from: {env_path}")
    print(f"Starting gateway on {host}:{port} (debug={debug})")
    
    app.run(host=host, port=port, debug=debug)
