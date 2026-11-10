import os
import sys
from pathlib import Path

import pytest

# Use a throwaway database; must be set before the app reads settings.
os.environ["MONGODB_DB_NAME"] = "agenttrace_test"
os.environ["STUCK_CHECK_INTERVAL_SECONDS"] = "3600"
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402
from pymongo import MongoClient  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    MongoClient(settings.MONGODB_URL).drop_database("agenttrace_test")
    with TestClient(app) as c:
        token = c.post("/api/v1/auth/register", json={"email": "t@example.com", "password": "secret1"}).json()["access_token"]
        c.headers["Authorization"] = f"Bearer {token}"
        yield c
    MongoClient(settings.MONGODB_URL).drop_database("agenttrace_test")
