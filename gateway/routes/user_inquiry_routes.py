import os
from pathlib import Path
from datetime import datetime
import requests
from flask import Blueprint, jsonify, request, session
from utils import load_json_file, save_json_file, append_inquiry, root_dir

user_inquiry_bp = Blueprint('user_inquiry', __name__, url_prefix='/inquiry')

@user_inquiry_bp.route('/list', methods=['GET'])
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

@user_inquiry_bp.route('/submit', methods=['POST'])
def submit_inquiry():
    # Handle FormData instead of JSON
    inquiry = {
        "description": request.form.get('description'),
        "email": request.form.get('email'),
        "date_lost": request.form.get('date_lost'),
        "place_lost": request.form.get('place_lost'),
        "username": request.form.get('username'),
        "color": request.form.get('color'),
        "cost": request.form.get('cost'),
        "size_category": request.form.get('size_category'),
        "status": request.form.get('status')  # Can be set by admin
    }
    
    # Validate required fields
    required_fields = ['description', 'email', 'date_lost', 'place_lost', 'username', 'color', 'cost', 'size_category']
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
                storage_folder = root_dir / 'storage' / 'inventory_items'
            else:
                # Create user-specific folder
                storage_folder = root_dir / 'storage' / 'user_inquiries' / username
            
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
        "email": inquiry.get('email'),
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

@user_inquiry_bp.route('/<inquiry_id>', methods=['DELETE'])
def delete_inquiry(inquiry_id):
    """Delete a user's inquiry (user can only delete their own)."""
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
    
    # Find the inquiry
    item_index = None
    for i, inquiry in enumerate(inquiries):
        if inquiry.get('id') == inquiry_id:
            item_index = i
            break
    
    if item_index is None:
        return jsonify({
            "status": "error",
            "message": "Inquiry not found"
        }), 404
    
    # Get inquiry details before deleting
    deleted_inquiry = inquiries[item_index]
    
    # Delete the image file if it exists
    if deleted_inquiry.get('image_filename'):
        image_path = user_folder / deleted_inquiry['image_filename']
        if image_path.exists():
            try:
                image_path.unlink()
                print(f"[GW] Deleted image file: {image_path}")
            except Exception as e:
                print(f"[GW] Failed to delete image file: {str(e)}")
    
    # Remove inquiry from list
    inquiries.pop(item_index)
    
    # Save updated inquiries
    save_json_file(data_path, inquiries)
    
    print(f"[GW] User {username} deleted inquiry {inquiry_id}")
    
    return jsonify({
        "status": "ok",
        "message": "Inquiry deleted successfully"
    })
