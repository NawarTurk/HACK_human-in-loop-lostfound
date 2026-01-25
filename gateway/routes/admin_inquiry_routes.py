from flask import Blueprint, jsonify, session
from utils import load_json_file, root_dir

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
