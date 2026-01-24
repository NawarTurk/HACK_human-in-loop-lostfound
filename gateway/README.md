# Gateway

Flask API gateway for the Lost & Found application.

## Setup & Run

```bash
cd gateway
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Configuration is loaded from `../.env` (repo root).

## Endpoints

- `GET /health` - Health check
- `GET /config` - Show current configuration
