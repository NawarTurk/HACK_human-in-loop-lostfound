import json
from pathlib import Path

def load_users():
    """Load and return users from users.json"""
    users_file = Path(__file__).resolve().parent / 'users.json'
    with open(users_file, 'r') as f:
        data = json.load(f)
    return data.get('users', [])

def login_user(username, password):
    """Check credentials and return user dict or None"""
    users = load_users()
    for user in users:
        if user['username'] == username and user['password'] == password:
            # Return user without password
            return {
                'username': user['username'],
                'role': user['role']
            }
    return None

# TODO: Add registration later
# TODO: Hash passwords instead of plain text
# TODO: Move users.json out of gateway/ and into a real database
