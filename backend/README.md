from pathlib import Path

# Backend directory
BACKEND_DIR = Path(__file__).resolve().parent

# Python path for uvicorn
APP_MODULE = "app.main:app"
