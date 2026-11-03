from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_to_mongo():
    """Establish MongoDB connection (non-fatal if MongoDB is unavailable)."""
    global _client, _db
    try:
        _client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
        _db = _client[settings.MONGODB_DB_NAME]
        # Trigger a connection to validate early
        await _db.command("ping")
    except Exception:
        _client = None
        _db = None


async def close_mongo_connection():
    global _client
    if _client:
        _client.close()
        _client = None


def get_database() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError(
            "Database not available. Ensure MongoDB is running at "
            f"{settings.MONGODB_URL} or call connect_to_mongo() first."
        )
    return _db
