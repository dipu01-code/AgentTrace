from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class AgentEventBase(BaseModel):
    run_id: str
    agent_id: str
    agent_name: str
    type: str
    timestamp: float
    latency_ms: Optional[float] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    parent_id: Optional[str] = None


class AgentEventCreate(AgentEventBase):
    pass


class AgentEventInDB(AgentEventBase):
    id: Optional[str] = Field(default=None, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
    }


class AgentEventOut(AgentEventBase):
    id: str
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }


class WorkflowRunBase(BaseModel):
    name: str
    status: str = "running"
    total_events: int = 0
    loop_count: int = 0
    deterministic: bool = True


class WorkflowRunCreate(WorkflowRunBase):
    pass


class WorkflowRunInDB(WorkflowRunBase):
    id: Optional[str] = Field(default=None, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
    }


class WorkflowRunOut(WorkflowRunBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }


class StateDiff(BaseModel):
    path: str
    before: Any
    after: Any
