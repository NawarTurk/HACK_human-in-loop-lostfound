import os
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import embed_gemini
import embed_local

# Load ROOT .env file (lostfound/.env) using pathlib
root_dir = Path(__file__).resolve().parent.parent.parent
env_path = root_dir / '.env'
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)
CORS(app)

@app.route("/embed", methods=["POST"])
def embed():
    print("[IMG-EMB] Request received")
    
    image = request.files.get("image")
    if not image:
        return jsonify({"status": "error", "message": "No image provided"}), 400
    
    print(f"[IMG-EMB] Filename: {image.filename}")
    
    # Read image bytes and mime type
    image_bytes = image.read()
    mime_type = image.content_type
    
    # Determine embedding mode
    mode = os.getenv("IMAGE_EMB_MODE", "local")
    print(f"[IMG-EMB] Mode: {mode}")
    
    try:
        if mode == "gemini":
            embedding = embed_gemini.embed_with_gemini(image_bytes, mime_type)
        else:  # local
            embedding = embed_local.embed_locally(image_bytes)
        
        print(f"[IMG-EMB] Returning embedding, dim = {len(embedding)}")
        
        return jsonify({
            "status": "ok",
            "embedding": embedding
        })
    
    except Exception as e:
        print(f"[IMG-EMB] Error: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    host = os.getenv("IMG_EMB_HOST", "localhost")
    port = int(os.getenv("IMG_EMB_PORT", 8010))
    
    print(f"Loading config from: {env_path}")
    print(f"Starting image embedding service on {host}:{port}")
    
    app.run(host=host, port=port, debug=True)





# genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
# app = Flask(__name__)
# CORS(app)

# @app.route('/embed', methods=['POST'])
# def embed():
#     print("[IMG-EMB] Request received")
    
#     image = request.files.get('image')
#     if not image:
#         return jsonify({"status": "error", "message": "No image provided"}), 400
    
#     image_bytes = image.read()
    
#     try:
#         # Step 1: Vision model -> description
#         model = genai.GenerativeModel("gemini-2.0-flash")
#         response = model.generate_content([
#             "Describe this lost/found item briefly (color, type, size, distinctive marks):",
#             {"mime_type": image.content_type, "data": image_bytes}
#         ])
#         description = response.text
#         print(f"[IMG-EMB] Description: {description}")
        
#         # Step 2: Embed description
#         embed_result = genai.embed_content(
#             model="models/text-embedding-004",
#             content=description
#         )
#         embedding = embed_result['embedding']
#         print(f"[IMG-EMB] Embedding dim = {len(embedding)}")
        
#         return jsonify({
#             "status": "ok",
#             "description": description,
#             "embedding": embedding
#         })
    
#     except Exception as e:
#         print(f"[IMG-EMB] Error: {str(e)}")
#         return jsonify({"status": "error", "message": str(e)}), 500

# if __name__ == '__main__':
#     host = os.getenv('IMG_EMB_HOST', 'localhost')
#     port = int(os.getenv('IMG_EMB_PORT', 8010))
    
#     print(f"Starting on {host}:{port}")
#     app.run(host=host, port=port, debug=True)

