from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.v1.endpoints.auth import require_auth
from app.api.v1.endpoints.determinism import compare_event_sequences, load_events_or_404
from app.db.database import get_database, to_object_id

router = APIRouter(dependencies=[Depends(require_auth)])


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
    description: Optional[str] = None
    passed: bool
    baseline_hash: str
    comparison_hash: str
    difference_count: int
    first_divergence_index: Optional[int] = None
    created_at: str


def _out(doc) -> RegressionTestResult:
    return RegressionTestResult(id=str(doc["_id"]), **{**doc, "created_at": doc["created_at"].isoformat()})


@router.post("/regression/test", response_model=RegressionTestResult, status_code=status.HTTP_201_CREATED,
             summary="Run a regression test between two runs")
async def run_regression_test(test_in: RegressionTestCreate):
    """Passes when both runs produce the same agent/type/payload sequence."""
    result = compare_event_sequences(
        await load_events_or_404(test_in.baseline_run_id),
        await load_events_or_404(test_in.comparison_run_id),
    )
    doc = {
        **test_in.model_dump(),
        "passed": result["deterministic"],
        "baseline_hash": result["hash_a"],
        "comparison_hash": result["hash_b"],
        "difference_count": result["difference_count"],
        "first_divergence_index": result["first_divergence_index"],
        "created_at": datetime.now(timezone.utc),
    }
    doc["_id"] = (await get_database().regression_tests.insert_one(doc)).inserted_id
    return _out(doc)


@router.get("/regression/tests", response_model=List[RegressionTestResult], summary="List regression test results")
async def list_regression_tests():
    cursor = get_database().regression_tests.find().sort("created_at", -1).limit(200)
    return [_out(doc) async for doc in cursor]


@router.get("/regression/tests/{test_id}", response_model=RegressionTestResult, summary="Get a regression test result")
async def get_regression_test(test_id: str):
    oid = to_object_id(test_id)
    doc = await get_database().regression_tests.find_one({"_id": oid}) if oid else None
    if not doc:
        raise HTTPException(status_code=404, detail="Regression test not found")
    return _out(doc)
