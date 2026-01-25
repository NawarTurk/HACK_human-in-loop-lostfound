from sentence_transformers import SentenceTransformer
from PIL import Image
import io

# Load lightweight local CLIP model once at import time
print("[LOCAL] Loading local CLIP model...")
model = SentenceTransformer("clip-ViT-B-32")
print("[LOCAL] Model loaded")

def embed_locally(image_bytes):
    """
    Use local CLIP model to embed image directly.
    
    Returns: embedding as Python list
    """
    print("[LOCAL] Processing image locally with CLIP...")
    
    # Convert bytes to PIL Image
    img = Image.open(io.BytesIO(image_bytes))
    
    # Encode image to embedding vector
    embedding = model.encode(img).tolist()
    print(f"[LOCAL] Embedding dim = {len(embedding)}")
    
    return embedding
