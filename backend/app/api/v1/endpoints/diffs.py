from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from app.crud.workflow import save_state_diff, get_state_diffs_for_run
from app.models.schemas import StateDiff

router = APIRouter()


@router.post(
    "/runs/{run_id}/diffs",
    status_code=status.HTTP_201_CREATED,
    summary="Save state diffs for a run",
)
async def save_run_state_diffs(run_id: str, diffs: List[StateDiff]):
    """Persist state changes (before/after values) for a workflow run."""
    await save_state_diff(run_id, diffs)
    return {"saved": len(diffs), "run_id": run_id}


@router.get(
    "/runs/{run_id}/diffs",
    response_model=List[Dict[str, Any]],
    summary="List state diffs for a run",
)
async def list_run_state_diffs(run_id: str):
    """Retrieve all state diffs recorded for a workflow run."""
    return await get_state_diffs_for_run(run_id)
