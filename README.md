# Lost & Found - AI-Powered Matching System

A smart lost and found system that uses AI embeddings to match lost items with found inventory. Students submit inquiries, admins manage inventory, and our ML models find the best matches automatically.

## Quick Start (4 Terminals Required)

You need 4 terminals because we run 4 independent microservices:
- **Frontend** (React) - User interface
- **Gateway** (Flask) - Main API & business logic
- **Image Embedding** (Python) - Converts images to vectors for similarity matching
- **Text Embedding** (Python) - Converts descriptions to vectors for semantic search

### Terminal 1: Frontend
```bash
cd frontend
npm install
npm run dev
```
Access at http://localhost:5173

### Terminal 2: Gateway (Main Backend)
```bash
cd gateway
python3 app.py
```
Runs on port 8029

### Terminal 3: Image Embedding Service
```bash
cd services/image_embedding
pip install -r requirements.txt
python3 app.py
```
Runs on port 8014

### Terminal 4: Text Embedding Service
```bash
cd services/text_embedding
pip install -r requirements.txt
python3 app.py
```
Runs on port 8020

## How It Works

1. **Student submits inquiry**: Photo + description of lost item
2. **Admin adds found items**: Photo + description to inventory
3. **Process Matches**: Admin clicks "Process" - embeddings are compared using cosine similarity
4. **Top 5 matches shown**: Ranked by combined text + image similarity
5. **Mark & Notify**: Admin selects best match, student gets email notification
6. **Resolve**: Student claims item, both records marked resolved

## Key Features

- **AI Matching**: Gemini embeddings + cosine similarity for intelligent matching
- **Clarification System**: Admins can ask follow-up questions before matching
- **Rate Limiting**: 20-second cooldown between submissions (configurable in .env)
- **Email Notifications**: Auto-send when inquiry status changes to "matched"
- **Linked Resolution**: Marking inquiry resolved also resolves the matched inventory item

## Credentials

- Admin: `admin/admin123`
- Users: `nawar/user123`, `nawar2/user123`

## Configuration

All settings in root `.env` file:
- `TEXT_SIMILARITY_WEIGHT` / `IMAGE_SIMILARITY_WEIGHT` - Adjust matching weights
- `INQUIRY_RATE_LIMIT_SECONDS` - Submission cooldown
- `GEMINI_API_KEY` - For AI embeddings
