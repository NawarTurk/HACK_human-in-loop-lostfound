"""
Similarity calculation module for matching lost items with inventory.
Compares text and image embeddings to find potential matches.
"""
import numpy as np

def cosine_similarity(vec1, vec2):
    """
    Calculate cosine similarity between two vectors.
    
    Args:
        vec1: First embedding vector
        vec2: Second embedding vector
    
    Returns:
        float: Similarity score between 0 and 1
    """
    if vec1 is None or vec2 is None:
        print(f"[SIMILARITY] One or both embeddings are None: vec1={vec1 is not None}, vec2={vec2 is not None}")
        return 0.0
    
    if len(vec1) == 0 or len(vec2) == 0:
        print(f"[SIMILARITY] One or both embeddings are empty: vec1_len={len(vec1)}, vec2_len={len(vec2)}")
        return 0.0
    
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)
    
    # Normalize vectors
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    
    if norm1 == 0 or norm2 == 0:
        print(f"[SIMILARITY] One or both vectors have zero norm")
        return 0.0
    
    # Calculate cosine similarity
    similarity = np.dot(vec1, vec2) / (norm1 * norm2)
    
    # Convert to 0-1 range (cosine similarity is -1 to 1)
    similarity = (similarity + 1) / 2
    
    print(f"[SIMILARITY] Calculated similarity: {similarity:.3f}")
    return float(similarity)

def calculate_match_score(inquiry, inventory_item, text_weight=0.4, image_weight=0.6):
    """
    Calculate overall match score between an inquiry and inventory item.
    
    Args:
        inquiry: Inquiry object with text_embedding and image_embedding
        inventory_item: Inventory item with text_embedding and image_embedding
        text_weight: Weight for text similarity (default 0.4)
        image_weight: Weight for image similarity (default 0.6)
    
    Returns:
        dict: {
            "id": inventory_item_id,
            "text_similarity": float,
            "image_similarity": float,
            "final_similarity": float
        }
    """
    # Extract embeddings
    inquiry_text_emb = inquiry.get('text_embedding')
    inquiry_image_emb = inquiry.get('image_embedding')
    
    item_text_emb = inventory_item.get('text_embedding')
    item_image_emb = inventory_item.get('image_embedding')
    
    # Calculate similarities
    text_sim = cosine_similarity(inquiry_text_emb, item_text_emb)
    image_sim = cosine_similarity(inquiry_image_emb, item_image_emb)
    
    # Calculate weighted final score
    final_sim = (text_weight * text_sim) + (image_weight * image_sim)
    
    return {
        "id": inventory_item.get('id'),
        "text_similarity": round(text_sim, 3),
        "image_similarity": round(image_sim, 3),
        "final_similarity": round(final_sim, 3)
    }

def find_best_matches(inquiry, inventory_items, top_k=5, threshold=0.5):
    """
    Find the best matching inventory items for a given inquiry.
    
    Args:
        inquiry: Inquiry object with embeddings
        inventory_items: List of inventory items with embeddings
        top_k: Number of top matches to return (default 5)
        threshold: Minimum similarity threshold (default 0.5)
    
    Returns:
        list: Top K matching items sorted by similarity score
    """
    matches = []
    
    for item in inventory_items:
        # Skip items that are already claimed
        if item.get('status') == 'claimed':
            continue
        
        score = calculate_match_score(inquiry, item)
        
        # Only include matches above threshold
        if score['final_similarity'] >= threshold:
            matches.append({
                **score,
                'item': item
            })
    
    # Sort by final similarity (descending)
    matches.sort(key=lambda x: x['final_similarity'], reverse=True)
    
    # Return top K matches
    return matches[:top_k]
