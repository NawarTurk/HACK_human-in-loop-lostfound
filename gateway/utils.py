"""
Shared utility functions for the gateway application.
"""
import json
import uuid
from pathlib import Path
from datetime import datetime

# Get root directory (lostfound/)
root_dir = Path(__file__).resolve().parent.parent

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
