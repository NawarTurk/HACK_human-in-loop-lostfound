# Using Gemini text embeddings for consistency

import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def embed_text_gemini(text):
    """
    Embed text using Gemini text-embedding-004 model.

    Returns: embedding as a Python list
    """
    text = (text or "").strip()
    if not text:
        print("[GEMINI-TEXT] No text provided, returning empty embedding")
        return []

    print("[GEMINI-TEXT] Embedding text...")

    result = genai.embed_content(
        model="models/gemini-embedding-001",
        content=text
    )

    embedding = result["embedding"]
    print(f"[GEMINI-TEXT] Embedding dim = {len(embedding)}")

    return embedding
