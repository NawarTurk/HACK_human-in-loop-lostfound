from flask import Blueprint, jsonify, request, session
from utils import load_json_file, save_json_file, root_dir

admin_inventory_bp = Blueprint('admin_inventory', __name__, url_prefix='/admin/inventory')

@admin_inventory_bp.route('', methods=['GET'])
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

@admin_inventory_bp.route('/<item_id>', methods=['PATCH'])
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

@admin_inventory_bp.route('/<item_id>', methods=['DELETE'])
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
