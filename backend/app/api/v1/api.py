from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, bloat, determinism, diffs, export, loops, notifications, regression, replay, runs, sync, validation,
)

api_router = APIRouter()

# runs and validation use relative paths; every other router spells out its full path.
api_router.include_router(runs.router, prefix="/runs", tags=["runs"])
api_router.include_router(validation.router, prefix="/validate", tags=["validation"])
for module, tag in [
    (diffs, "diffs"), (replay, "replay"), (determinism, "determinism"), (loops, "loops"),
    (regression, "regression"), (bloat, "bloat"), (export, "export"), (auth, "auth"),
    (sync, "sync"), (notifications, "notifications"),
]:
    api_router.include_router(module.router, tags=[tag])
