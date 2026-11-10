from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


class DatabaseUnavailable(RuntimeError):
    """Raised when MongoDB is not reachable; main.py turns it into a 503."""


async def connect_to_mongo():
    """Connect to MongoDB. Non-fatal so /health still answers when Mongo is down."""
    global _client, _db
    try:
        _client = AsyncIOMotorClient(
            settings.MONGODB_URL, serverSelectionTimeoutMS=2000, tz_aware=True
        )
        _db = _client[settings.MONGODB_DB_NAME]
        await _db.command("ping")
        await _ensure_indexes(_db)
    except Exception as exc:
        print(f"[agenttrace] MongoDB unavailable at {settings.MONGODB_URL}: {exc}")
        _client = None
        _db = None


async def _ensure_indexes(db: AsyncIOMotorDatabase):
    await db.agent_events.create_index([("run_id", 1), ("timestamp", 1)])
    await db.agent_events.create_index([("run_id", 1), ("client_id", 1)], sparse=True)
    await db.workflow_runs.create_index([("created_at", -1)])
    await db.workflow_runs.create_index([("status", 1), ("updated_at", 1)])
    await db.state_diffs.create_index([("run_id", 1)])
    await db.users.create_index("email", unique=True)
    await db.export_sessions.create_index("share_token", unique=True)
    await db.push_tokens.create_index("token", unique=True)


async def close_mongo_connection():
    global _client, _db
    if _client:
        _client.close()
    _client = None
    _db = None


def get_database() -> AsyncIOMotorDatabase:
    if _db is None:
        raise DatabaseUnavailable(f"Database not available. Ensure MongoDB is running at {settings.MONGODB_URL}.")
    return _db


def to_object_id(value: str) -> ObjectId | None:
    """Parse a run id; None for malformed ids so callers can 404 instead of 500."""
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return None
