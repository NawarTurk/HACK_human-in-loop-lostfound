import os
from pathlib import Path
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

if __name__ == '__main__':
    host = os.getenv('GATEWAY_HOST')
    port = int(os.getenv('GATEWAY_PORT'))
    debug = bool(int(os.getenv('GATEWAY_DEBUG')))
    
    print(f"Loading config from: {env_path}")
    print(f"Starting gateway on {host}:{port} (debug={debug})")
    
    app.run(host=host, port=port, debug=debug)
