import os
from pathlib import Path
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load ROOT .env file (lostfound/.env) using pathlib
root_dir = Path(__file__).resolve().parent.parent
env_path = root_dir / '.env'
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "service": "gateway"
    })

@app.route('/config', methods=['GET'])
def config():
    host = os.getenv('GATEWAY_HOST', '127.0.0.1')
    port = os.getenv('GATEWAY_PORT', '8000')
    debug = os.getenv('GATEWAY_DEBUG', '1')
    
    return jsonify({
        "host": host,
        "port": int(port),
        "debug": debug == '1'
    })

if __name__ == '__main__':
    host = os.getenv('GATEWAY_HOST', '127.0.0.1')
    port = int(os.getenv('GATEWAY_PORT', 8000))
    debug = bool(int(os.getenv('GATEWAY_DEBUG', 1)))
    
    print(f"Loading config from: {env_path}")
    print(f"Starting gateway on {host}:{port} (debug={debug})")
    
    app.run(host=host, port=port, debug=debug)
