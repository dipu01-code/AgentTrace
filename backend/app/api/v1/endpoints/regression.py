from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.crud.workflow import get_agent_events_for_run, get_workflow_run
from app.api.v1.endpoints.determinism import _hash_event_sequence

router = APIRouter()


class RegressionTestCreate(BaseModel):
    name: str = Field(..., min_length=1)
    baseline_run_id: str
    comparison_run_id: str
    description: Optional[str] = None


class RegressionTestResult(BaseModel):
    id: str
    name: str
    baseline_run_id: str
    comparison_run_id: str
    passed: bool
    baseline_hash: str
    comparison_hash: str
    difference_count: int
    created_at: str


# In-memory test registry (Phase 15 — replaced by DB in Phase 19 cloud sync)
_regression_tests: Dict[str, Dict[str, Any]] = {}


@router.post(
    "/regression/test",
    response_model=RegressionTestResult,
    status_code=status.HTTP_201_CREATED,
    summary="Run a regression test between two runs",
)
async def run_regression_test(test_in: RegressionTestCreate):
    """Compare a baseline run against a comparison run.
    Passes if both runs have identical event sequences (deterministic).
    """
    events_a = await get_agent_events_for_run(test_in.baseline_run_id)
    events_b = await get_agent_events_for_run(test_in.comparison_run_id)

    if not events_a:
        raise HTTPException(status_code=404, detail=f"Baseline run {test_in.baseline_run_id} not found or has no events")
    if not events_b:
        raise HTTPException(status_code=404, detail=f"Comparison run {test_in.comparison_run_id} not found or has no events")

    events_a_sorted = sorted(events_a, key=lambda e: e.timestamp)
    events_b_sorted = sorted(events_b, key=lambda e: e.timestamp)

    hash_a = _hash_event_sequence([e.model_dump() for e in events_a_sorted])
    hash_b = _hash_event_sequence([e.model_dump() for e in events_b_sorted])

    passed = hash_a == hash_b

    import uuid
    import datetime
    test_id = str(uuid.uuid4())
    now = datetime.datetime.utcnow().isoformat()

    result = {
        "id": test_id,
        "name": test_in.name,
        "baseline_run_id": test_in.baseline_run_id,
        "comparison_run_id": test_in.comparison_run_id,
        "description": test_in.description,
        "passed": passed,
        "baseline_hash": hash_a,
        "comparison_hash": hash_b,
        "difference_count": 0 if passed else 1,
        "created_at": now,
    }
    _regression_tests[test_id] = result
    return result


@router.get(
    "/regression/tests",
    response_model=List[RegressionTestResult],
    summary="List all regression test results",
)
async def list_regression_tests():
    """Return all previously run regression tests, newest first."""
    tests = sorted(
        _regression_tests.values(),
        key=lambda t: t["created_at"],
        reverse=True,
    )
    return tests


@router.get(
    "/regression/tests/{test_id}",
    response_model=RegressionTestResult,
    summary="Get a specific regression test result",
)
async def get_regression_test(test_id: str):
    if test_id not in _regression_tests:
        raise HTTPException(status_code=404, detail="Regression test not found")
    return _regression_tests[test_id]
