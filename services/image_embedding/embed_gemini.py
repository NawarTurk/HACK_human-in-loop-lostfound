import os
import google.generativeai as genai

# Load API key from environment (already loaded in app.py)
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def embed_with_gemini(image_bytes, mime_type):
    """
    Use Gemini to:
    1. Extract description from image using vision model
    2. Embed the description using text embedding model
    
    Returns: embedding as Python list
    """
    print("[GEMINI] Processing image with Gemini Vision...")
    
    # Step 1: Vision model -> description
    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content([
        "Describe this lost/found item briefly (color, type, size, distinctive marks):",
        {"mime_type": mime_type, "data": image_bytes}
    ])
    description = response.text
    print(f"[GEMINI] Description: {description[:100]}...")
    
    # Step 2: Embed description
    print("[GEMINI] Embedding description...")
    embed_result = genai.embed_content(
        model="models/gemini-embedding-001",
        content=description
    )
    embedding = embed_result['embedding']
    print(f"[GEMINI] Embedding dim = {len(embedding)}")
    
    return embedding
