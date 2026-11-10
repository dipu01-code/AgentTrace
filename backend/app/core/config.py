from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_JWT_SECRET = "agenttrace-dev-secret-change-me"


class Settings(BaseSettings):
    # Read backend/.env no matter which directory uvicorn is started from
    model_config = SettingsConfigDict(env_file=Path(__file__).resolve().parents[2] / ".env", extra="ignore"
    )

    APP_NAME: str = "AgentTrace"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "agenttrace"
    CORS_ORIGINS: list[str] = ["*"]

    JWT_SECRET: str = DEV_JWT_SECRET
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # Phase 20: a "running" run with no new events for this long counts as stuck
    STUCK_AFTER_MINUTES: int = 10
    STUCK_CHECK_INTERVAL_SECONDS: int = 60
    EXPO_PUSH_URL: str = "https://exp.host/--/api/v2/push/send"


settings = Settings()
