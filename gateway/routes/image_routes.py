from flask import Blueprint, jsonify, session, send_file
from utils import root_dir

image_bp = Blueprint('images', __name__, url_prefix='/images')

@image_bp.route('/<username>/<filename>', methods=['GET'])
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
