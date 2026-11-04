from fastapi import APIRouter
from app.api.v1.endpoints.runs import router as runs_router
from app.api.v1.endpoints.validation import router as validation_router

api_router = APIRouter()

api_router.include_router(runs_router, prefix="/runs", tags=["runs"])
api_router.include_router(validation_router, prefix="/validate", tags=["validation"])
