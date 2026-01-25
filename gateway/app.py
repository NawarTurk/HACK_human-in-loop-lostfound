import os
import json
import uuid
from pathlib import Path
from datetime import datetime
import requests
from flask import Flask, jsonify, request, session, send_file
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

# ============================================
# JSON Persistence Helper Functions
# ============================================

def load_json_file(path):
    """Load JSON file and return list. Returns empty list if file doesn't exist."""
    if not path.exists():
        return []
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []

def save_json_file(path, data_list):
    """Save list to JSON file with pretty formatting."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data_list, f, indent=2, ensure_ascii=False)

def append_inquiry(record_dict, username, is_admin=False):
    """Append inquiry record to user-specific or inventory data.json file."""
    if is_admin:
        # Admin items go to inventory
        inventory_folder = root_dir / 'storage' / 'inventory_items'
        inventory_folder.mkdir(parents=True, exist_ok=True)
        data_path = inventory_folder / 'data.json'
    else:
        # User inquiries go to user-specific folder
        user_folder = root_dir / 'storage' / 'user_inquiries' / username
        user_folder.mkdir(parents=True, exist_ok=True)
        data_path = user_folder / 'data.json'
    
    # Load existing data
    data_list = load_json_file(data_path)
    
    # Add record with unique ID, timestamp, and status
    record_dict['id'] = str(uuid.uuid4())
    record_dict['timestamp'] = datetime.utcnow().isoformat() + 'Z'
    
    # Set status: use provided status or default based on role
    if 'status' not in record_dict or not record_dict['status']:
        record_dict['status'] = 'stored' if is_admin else 'submitted'
    
    # Append and save
    data_list.append(record_dict)
    save_json_file(data_path, data_list)
    
    location = "inventory" if is_admin else f"{username}'s inquiries"
    print(f"[GW] Record saved to {location} with ID: {record_dict['id']}")
    return record_dict['id']

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

@app.route('/images/<username>/<filename>', methods=['GET'])
def serve_image(username, filename):
    """Serve user images securely."""
    user = session.get('user')
    if not user:
        return jsonify({"status": "error", "message": "Not authenticated"}), 403
    
    # Admin can access all images, users can only access their own
    if user.get('role') != 'admin' and user.get('username') != username:
        return jsonify({"status": "error", "message": "Unauthorized"}), 403
    
    # Construct file path (admin images in inventory_items, user images in user_inquiries)
    if username == 'admin':
        image_path = root_dir / 'storage' / 'inventory_items' / filename
    else:
        image_path = root_dir / 'storage' / 'user_inquiries' / username / filename
    
    if not image_path.exists():
        return jsonify({"status": "error", "message": "Image not found"}), 404
    
    return send_file(str(image_path), mimetype='image/jpeg')

@app.route('/inquiry/list', methods=['GET'])
def list_inquiries():
    """Get all inquiries for the logged-in user."""
    user = session.get('user')
    if not user:
        return jsonify({
            "status": "error",
            "message": "Not authenticated"
        }), 401
    
    username = user.get('username')
    user_folder = root_dir / 'storage' / 'user_inquiries' / username
    data_path = user_folder / 'data.json'
    
    # Load user's inquiries
    inquiries = load_json_file(data_path)
    
    # Return inquiries without embeddings (too large for frontend display)
    inquiries_display = []
    for inq in inquiries:
        inq_copy = {k: v for k, v in inq.items() if k not in ['image_embedding', 'text_embedding']}
        
        # Add image_url if image exists
        if inq.get('image_filename'):
            inq_copy['image_url'] = f"/images/{username}/{inq['image_filename']}"
        
        inquiries_display.append(inq_copy)
    
    return jsonify({
        "status": "ok",
        "inquiries": inquiries_display
    })

@app.route('/admin/inquiries', methods=['GET'])
def admin_all_inquiries():
    """Get all user inquiries grouped by username (admin only)."""
    user = session.get('user')
    if not user or user.get('role') != 'admin':
        return jsonify({
            "status": "error",
            "message": "Unauthorized - admin access required"
        }), 403
    
    user_inquiries_folder = root_dir / 'storage' / 'user_inquiries'
    all_inquiries = {}
    
    # Loop through each user folder
    if user_inquiries_folder.exists():
        for user_folder in user_inquiries_folder.iterdir():
            if user_folder.is_dir():
                username = user_folder.name
                data_path = user_folder / 'data.json'
                
                if data_path.exists():
                    inquiries = load_json_file(data_path)
                    
                    # Filter out embeddings
                    inquiries_display = []
                    for inq in inquiries:
                        inq_copy = {k: v for k, v in inq.items() if k not in ['image_embedding', 'text_embedding']}
                        
                        # Add image_url if image exists
                        if inq.get('image_filename'):
                            inq_copy['image_url'] = f"/images/{username}/{inq['image_filename']}"
                        
                        inquiries_display.append(inq_copy)
                    
                    all_inquiries[username] = inquiries_display
    
    return jsonify({
        "status": "ok",
        "inquiries": all_inquiries
    })

@app.route('/admin/inventory', methods=['GET'])
def admin_inventory():
    """Get all inventory items (admin only)."""
    user = session.get('user')
    if not user or user.get('role') != 'admin':
        return jsonify({
            "status": "error",
            "message": "Unauthorized - admin access required"
        }), 403
    
    inventory_path = root_dir / 'storage' / 'inventory_items' / 'data.json'
    inventory_items = load_json_file(inventory_path)
    
    # Filter out embeddings
    items_display = []
    for item in inventory_items:
        item_copy = {k: v for k, v in item.items() if k not in ['image_embedding', 'text_embedding']}
        
        # Add image_url if image exists
        if item.get('image_filename'):
            item_copy['image_url'] = f"/images/admin/{item['image_filename']}"
        
        items_display.append(item_copy)
    
    return jsonify({
        "status": "ok",
        "inventory": items_display
    })

@app.route('/admin/inventory/<item_id>', methods=['PATCH'])
def update_inventory_item(item_id):
    """Update inventory item fields (admin only)."""
    user = session.get('user')
    if not user or user.get('role') != 'admin':
        return jsonify({
            "status": "error",
            "message": "Unauthorized - admin access required"
        }), 403
    
    inventory_path = root_dir / 'storage' / 'inventory_items' / 'data.json'
    inventory_items = load_json_file(inventory_path)
    
    # Find the item
    item_index = None
    for i, item in enumerate(inventory_items):
        if item.get('id') == item_id:
            item_index = i
            break
    
    if item_index is None:
        return jsonify({
            "status": "error",
            "message": "Item not found"
        }), 404
    
    # Get update data
    data = request.get_json()
    if not data:
        return jsonify({
            "status": "error",
            "message": "No update data provided"
        }), 400
    
    # Update allowed fields
    allowed_fields = ['status', 'description', 'color', 'approx_cost', 'size_category', 'place_lost']
    for field in allowed_fields:
        if field in data:
            inventory_items[item_index][field] = data[field]
    
    # Save updated inventory
    save_json_file(inventory_path, inventory_items)
    
    print(f"[GW] Updated inventory item {item_id}")
    
    return jsonify({
        "status": "ok",
        "message": "Item updated successfully"
    })

@app.route('/admin/inventory/<item_id>', methods=['DELETE'])
def delete_inventory_item(item_id):
    """Delete inventory item (admin only)."""
    user = session.get('user')
    if not user or user.get('role') != 'admin':
        return jsonify({
            "status": "error",
            "message": "Unauthorized - admin access required"
        }), 403
    
    inventory_path = root_dir / 'storage' / 'inventory_items' / 'data.json'
    inventory_items = load_json_file(inventory_path)
    
    # Find and remove the item
    item_index = None
    for i, item in enumerate(inventory_items):
        if item.get('id') == item_id:
            item_index = i
            break
    
    if item_index is None:
        return jsonify({
            "status": "error",
            "message": "Item not found"
        }), 404
    
    # Get item details before deleting
    deleted_item = inventory_items[item_index]
    
    # Delete the image file if it exists
    if deleted_item.get('image_filename'):
        image_path = root_dir / 'storage' / 'inventory_items' / deleted_item['image_filename']
        if image_path.exists():
            try:
                image_path.unlink()
                print(f"[GW] Deleted image file: {image_path}")
            except Exception as e:
                print(f"[GW] Failed to delete image file: {str(e)}")
    
    # Remove item from list
    inventory_items.pop(item_index)
    
    # Save updated inventory
    save_json_file(inventory_path, inventory_items)
    
    print(f"[GW] Deleted inventory item {item_id}")
    
    return jsonify({
        "status": "ok",
        "message": "Item deleted successfully"
    })

@app.route('/inquiry/submit', methods=['POST'])
def submit_inquiry():
    # Handle FormData instead of JSON
    inquiry = {
        "description": request.form.get('description'),
        "date_lost": request.form.get('date_lost'),
        "place_lost": request.form.get('place_lost'),
        "username": request.form.get('username'),
        "color": request.form.get('color'),
        "cost": request.form.get('cost'),
        "size_category": request.form.get('size_category'),
        "status": request.form.get('status')  # Can be set by admin
    }
    
    # Validate required fields
    required_fields = ['description', 'date_lost', 'place_lost', 'username', 'color', 'cost', 'size_category']
    for field in required_fields:
        if not inquiry.get(field):
            return jsonify({
                "status": "error",
                "message": "Missing required fields"
            }), 400
    
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
            username = inquiry.get('username')
            
            # Determine storage folder based on role
            if user_role == 'admin':
                storage_folder = Path(__file__).resolve().parent.parent / 'storage' / 'inventory_items'
            else:
                # Create user-specific folder
                storage_folder = Path(__file__).resolve().parent.parent / 'storage' / 'user_inquiries' / username
            
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

                        print("[GW] Embedding received, length =", len(embedding))

                        # attach for later use
                        inquiry["embedding"] = embedding
                    else:
                        print(f"[GW] Embedding FAILED: HTTP {response.status_code}")
            except Exception as e:
                print(f"[GW] Embedding FAILED: {str(e)}")
        else:
            print("ERROR: No user in session!")
    else:
        print("DEBUG: No image uploaded or empty filename")
    
    # Call text embedding service for description
    description = inquiry.get('description')
    if description:
        print("[GW] Starting text embedding...")
        try:
            text_emb_host = os.getenv('TEXT_EMB_HOST')
            text_emb_port = os.getenv('TEXT_EMB_PORT')
            text_emb_url = f"http://{text_emb_host}:{text_emb_port}/embed-text"
            
            response = requests.post(text_emb_url, json={"text": description}, timeout=10)
            if response.status_code == 200:
                text_emb_json = response.json()
                text_embedding = text_emb_json.get("embedding", [])
                
                print("[GW] Text embedding received, length =", len(text_embedding))
                
                # attach for later use
                inquiry["text_embedding"] = text_embedding
            else:
                print(f"[GW] Text embedding FAILED: HTTP {response.status_code}")
        except Exception as e:
            print(f"[GW] Text embedding FAILED: {str(e)}")
    
    # Print to console for now latter for dataaset
    inquiry_print = {k: v for k, v in inquiry.items() if k not in ['embedding', 'text_embedding']}
    print("Inquiry received:", inquiry_print)
    
    # ============================================
    # Save to JSON storage
    # ============================================
    record = {
        "username": inquiry.get('username'),
        "description": inquiry.get('description'),
        "date_lost": inquiry.get('date_lost'),
        "place_lost": inquiry.get('place_lost'),
        "color": inquiry.get('color'),
        "approx_cost": inquiry.get('cost'),
        "size_category": inquiry.get('size_category'),
        "status": inquiry.get('status'),  # Include status from form
        "image_filename": inquiry.get('image_saved_as'),
        "image_embedding": inquiry.get('embedding'),
        "text_embedding": inquiry.get('text_embedding')
    }
    
    try:
        # Check if user is admin
        user = session.get('user')
        is_admin = user and user.get('role') == 'admin'
        
        inquiry_id = append_inquiry(record, inquiry.get('username'), is_admin=is_admin)
    except Exception as e:
        print(f"[GW] Failed to save inquiry to JSON: {str(e)}")
        # Continue anyway - don't fail the request
    
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
