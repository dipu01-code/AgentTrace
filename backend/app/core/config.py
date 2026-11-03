from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "AgentTrace"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite:///./agenttrace.db"
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "agenttrace"
    CORS_ORIGINS: list[str] = ["*"]

    class Config:
        env_file = ".env"


settings = Settings()
