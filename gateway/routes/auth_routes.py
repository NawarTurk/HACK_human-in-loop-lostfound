from flask import Blueprint, jsonify, request, session
from auth import login_user

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=['POST'])
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

@auth_bp.route('/logout', methods=['GET'])
def logout():
    session.pop('user', None)
    return jsonify({
        "status": "ok",
        "message": "Logged out successfully"
    })

@auth_bp.route('/user', methods=['GET'])
def get_user():
    user = session.get('user')
    return jsonify({"user": user if user else None})
