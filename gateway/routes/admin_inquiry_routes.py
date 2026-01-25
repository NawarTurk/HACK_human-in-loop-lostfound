from flask import Blueprint, jsonify, session, request
from utils import load_json_file, save_json_file, root_dir
from email_notifications import send_claim_notification
from calculate_similarity import find_best_matches

admin_inquiry_bp = Blueprint('admin_inquiry', __name__, url_prefix='/admin')

@admin_inquiry_bp.route('/inquiries', methods=['GET'])
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

@admin_inquiry_bp.route('/inquiries/<username>/<inquiry_id>', methods=['PATCH'])
def update_inquiry_status(username, inquiry_id):
    """Update user inquiry status and send email if transitioning to waiting_user."""
    user = session.get('user')
    if not user or user.get('role') != 'admin':
        return jsonify({
            "status": "error",
            "message": "Unauthorized - admin access required"
        }), 403
    
    # Get the new status from request
    data = request.get_json()
    if not data or 'status' not in data:
        return jsonify({
            "status": "error",
            "message": "Status field required"
        }), 400
    
    new_status = data.get('status')
    
    # Load user inquiries
    user_folder = root_dir / 'storage' / 'user_inquiries' / username
    data_path = user_folder / 'data.json'
    
    if not data_path.exists():
        return jsonify({
            "status": "error",
            "message": "User inquiries not found"
        }), 404
    
    inquiries = load_json_file(data_path)
    
    # Find the inquiry
    inquiry_index = None
    for i, inq in enumerate(inquiries):
        if inq.get('id') == inquiry_id:
            inquiry_index = i
            break
    
    if inquiry_index is None:
        return jsonify({
            "status": "error",
            "message": "Inquiry not found"
        }), 404
    
    inquiry = inquiries[inquiry_index]
    old_status = inquiry.get('status', 'submitted')
    
    # Initialize email_sent if not present
    if 'email_sent' not in inquiry:
        inquiry['email_sent'] = False
    
    # CHECK: Trigger email notification ONLY for submitted -> waiting_user transition
    email_should_send = (
        old_status == 'submitted' and 
        new_status == 'waiting_user' and 
        not inquiry.get('email_sent', False)
    )
    
    if email_should_send:
        student_email = inquiry.get('email')
        if student_email:
            # Send email notification
            email_sent = send_claim_notification(
                student_email,
                inquiry_id,
                inquiry.get('description', 'Unknown item')
            )
            
            if email_sent:
                inquiry['email_sent'] = True
                print(f"[ADMIN] Email sent to {student_email} for inquiry {inquiry_id}")
            else:
                print(f"[ADMIN] Failed to send email to {student_email}")
        else:
            print(f"[ADMIN] No email address for inquiry {inquiry_id}")
    
    # Update status
    inquiry['status'] = new_status
    inquiries[inquiry_index] = inquiry
    
    # Save updated inquiries
    save_json_file(data_path, inquiries)
    
    print(f"[ADMIN] Updated inquiry {inquiry_id}: {old_status} -> {new_status}")
    
    return jsonify({
        "status": "ok",
        "message": "Inquiry status updated",
        "email_sent": inquiry.get('email_sent', False)
    })

@admin_inquiry_bp.route('/inquiries/<username>/<inquiry_id>/match', methods=['POST'])
def process_inquiry_matches(username, inquiry_id):
    """Process an inquiry and find matching inventory items."""
    user = session.get('user')
    if not user or user.get('role') != 'admin':
        return jsonify({
            "status": "error",
            "message": "Unauthorized - admin access required"
        }), 403
    
    # Step 2: Load the inquiry
    user_folder = root_dir / 'storage' / 'user_inquiries' / username
    inquiry_data_path = user_folder / 'data.json'
    
    if not inquiry_data_path.exists():
        return jsonify({
            "status": "error",
            "message": "User inquiries not found"
        }), 404
    
    inquiries = load_json_file(inquiry_data_path)
    
    # Find the specific inquiry
    inquiry = None
    for inq in inquiries:
        if inq.get('id') == inquiry_id:
            inquiry = inq
            break
    
    if not inquiry:
        return jsonify({
            "status": "error",
            "message": "Inquiry not found"
        }), 404
    
    # Step 3: Load INVENTORY items only
    inventory_path = root_dir / 'storage' / 'inventory_items' / 'data.json'
    
    if not inventory_path.exists():
        return jsonify({
            "status": "ok",
            "inquiry_id": inquiry_id,
            "matches": []
        })
    
    inventory_items = load_json_file(inventory_path)
    
    # Step 4: Run similarity calculation (threshold=0 to show all top 5 matches)
    matches = find_best_matches(inquiry, inventory_items, top_k=5, threshold=0.0)
    
    # Step 5: Format results for UI
    match_results = []
    for match in matches:
        item = match['item']
        match_results.append({
            "inventory_id": match['id'],
            "final_similarity": match['final_similarity'],
            "text_similarity": match['text_similarity'],
            "image_similarity": match['image_similarity'],
            # Include item details for display
            "description": item.get('description'),
            "color": item.get('color'),
            "place_lost": item.get('place_lost'),
            "size_category": item.get('size_category'),
            "status": item.get('status'),
            "image_url": f"/images/admin/{item['image_filename']}" if item.get('image_filename') else None
        })
    
    return jsonify({
        "status": "ok",
        "inquiry_id": inquiry_id,
        "matches": match_results
    })
