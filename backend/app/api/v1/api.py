from fastapi import APIRouter
from app.api.v1.endpoints.runs import router as runs_router
from app.api.v1.endpoints.validation import router as validation_router
from app.api.v1.endpoints.diffs import router as diffs_router
from app.api.v1.endpoints.replay import router as replay_router
from app.api.v1.endpoints.determinism import router as determinism_router
from app.api.v1.endpoints.regression import router as regression_router
from app.api.v1.endpoints.bloat import router as bloat_router

api_router = APIRouter()

api_router.include_router(runs_router, prefix="/runs", tags=["runs"])
api_router.include_router(validation_router, prefix="/validate", tags=["validation"])
api_router.include_router(diffs_router, prefix="/runs", tags=["diffs"])
api_router.include_router(replay_router, prefix="/runs", tags=["replay"])
api_router.include_router(determinism_router, prefix="/runs", tags=["determinism"])
api_router.include_router(regression_router, prefix="", tags=["regression"])
api_router.include_router(bloat_router, prefix="/runs", tags=["bloat"])
