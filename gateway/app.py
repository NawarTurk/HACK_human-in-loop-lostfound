import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from utils import root_dir

# Load ROOT .env file (lostfound/.env) using pathlib
env_path = root_dir / '.env'
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
CORS(app, supports_credentials=True)

# Import and register blueprints
from routes.auth_routes import auth_bp
from routes.image_routes import image_bp
from routes.user_inquiry_routes import user_inquiry_bp
from routes.admin_inquiry_routes import admin_inquiry_bp
from routes.admin_inventory_routes import admin_inventory_bp

app.register_blueprint(auth_bp)
app.register_blueprint(image_bp)
app.register_blueprint(user_inquiry_bp)
app.register_blueprint(admin_inquiry_bp)
app.register_blueprint(admin_inventory_bp)

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

if __name__ == '__main__':
    host = os.getenv('GATEWAY_HOST')
    port = int(os.getenv('GATEWAY_PORT'))
    debug = bool(int(os.getenv('GATEWAY_DEBUG')))
    
    print(f"Loading config from: {env_path}")
    print(f"Starting gateway on {host}:{port} (debug={debug})")
    
    app.run(host=host, port=port, debug=debug)
