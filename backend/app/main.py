import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.api import api_router
from app.api.v1.endpoints.notifications import stuck_run_watcher
from app.core.config import DEV_JWT_SECRET, settings
from app.db.database import DatabaseUnavailable, close_mongo_connection, connect_to_mongo


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.APP_ENV == "production" and settings.JWT_SECRET == DEV_JWT_SECRET:
        raise RuntimeError("Set JWT_SECRET before running with APP_ENV=production")
    await connect_to_mongo()
    watcher = asyncio.create_task(stuck_run_watcher())
    yield
    watcher.cancel()
    await close_mongo_connection()


app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Auth uses bearer tokens, not cookies, so credentials are not needed for CORS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(DatabaseUnavailable)
async def database_unavailable(_: Request, exc: DatabaseUnavailable):
    return JSONResponse(status_code=503, content={"detail": str(exc)})


app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
def health():
    return {"status": "ok", "service": settings.APP_NAME}
