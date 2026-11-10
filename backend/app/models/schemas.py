from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal
from datetime import datetime

from app.schemas.event_validation import ValidatedAgentEvent

RunStatus = Literal["running", "completed", "failed", "looping"]


class AgentEventBase(BaseModel):
    run_id: str
    agent_id: str
    agent_name: str
    type: str
    timestamp: float
    latency_ms: Optional[float] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    parent_id: Optional[str] = None


class AgentEventCreate(ValidatedAgentEvent):
    """Ingest body: same rules as /validate, but run_id comes from the URL."""
    run_id: str = ""


class AgentEventOut(AgentEventBase):
    id: str
    created_at: datetime


class WorkflowRunBase(BaseModel):
    name: str = Field(..., min_length=1)
    status: RunStatus = "running"
    total_events: int = 0
    loop_count: int = 0
    deterministic: bool = True


class WorkflowRunCreate(WorkflowRunBase):
    pass


class WorkflowRunUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    status: Optional[RunStatus] = None
    deterministic: Optional[bool] = None


class WorkflowRunOut(WorkflowRunBase):
    id: str
    created_at: datetime
    updated_at: datetime


class StateDiff(BaseModel):
    path: str
    before: Any
    after: Any
