from typing import Any, Dict, List, Optional, ClassVar
from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import datetime


class ValidatedAgentEvent(BaseModel):
    """Strict schema for an agent event with validation rules."""

    run_id: str = Field(..., min_length=1, description="ID of the parent workflow run")
    agent_id: str = Field(..., min_length=1, description="Unique agent identifier")
    agent_name: str = Field(..., min_length=1, description="Human-readable agent name")
    type: str = Field(
        ...,
        description="Event type: agent_start | agent_end | tool_call | tool_result | llm_call | llm_result | state_change | loop_detected | error",
    )
    timestamp: float = Field(..., description="Unix epoch seconds")
    latency_ms: Optional[float] = Field(
        None, ge=0, description="Operation latency in milliseconds"
    )
    payload: Dict[str, Any] = Field(
        default_factory=dict, description="Arbitrary event payload"
    )
    parent_id: Optional[str] = Field(
        None, description="ID of the parent event this event replies to"
    )

    VALID_TYPES: ClassVar[set[str]] = {
        "agent_start",
        "agent_end",
        "tool_call",
        "tool_result",
        "llm_call",
        "llm_result",
        "state_change",
        "loop_detected",
        "error",
    }

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in cls.VALID_TYPES:
            raise ValueError(
                f"Invalid event type '{v}'. Must be one of: {sorted(cls.VALID_TYPES)}"
            )
        return v

    @field_validator("timestamp")
    @classmethod
    def validate_timestamp(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("timestamp must be a positive Unix epoch value")
        now = datetime.now().timestamp()
        if v > now + 60:
            raise ValueError("timestamp cannot be more than 60 seconds in the future")
        return v

    @field_validator("payload")
    @classmethod
    def validate_payload(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        if v is None:
            return {}
        return v

    @model_validator(mode="after")
    def validate_parent_consistency(self) -> "ValidatedAgentEvent":
        if self.parent_id and self.parent_id == "":
            raise ValueError("parent_id cannot be an empty string")
        return self


class ValidationResult(BaseModel):
    valid: bool
    errors: List[str] = Field(default_factory=list)
    event: Optional[ValidatedAgentEvent] = None


def validate_agent_event(raw: Dict[str, Any]) -> ValidationResult:
    """Validate a raw event dict against the agent event schema.

    Returns a ValidationResult with the parsed event if valid,
    or a list of error messages if invalid.
    """
    try:
        event = ValidatedAgentEvent(**raw)
        return ValidationResult(valid=True, event=event)
    except Exception as exc:  # pydantic.ValidationError or ValueError
        errors: List[str] = []
        if hasattr(exc, "errors"):
            for err in exc.errors():
                loc = " -> ".join(str(x) for x in err.get("loc", []))
                msg = err.get("msg", "unknown error")
                errors.append(f"{loc}: {msg}")
        else:
            errors.append(str(exc))
        return ValidationResult(valid=False, errors=errors)


def validate_event_batch(raw_events: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Validate a list of raw events. Returns summary with valid/invalid counts."""
    valid_events: List[ValidatedAgentEvent] = []
    invalid: List[Dict[str, Any]] = []

    for idx, raw in enumerate(raw_events):
        result = validate_agent_event(raw)
        if result.valid and result.event:
            valid_events.append(result.event)
        else:
            invalid.append({"index": idx, "errors": result.errors})

    return {
        "total": len(raw_events),
        "valid": len(valid_events),
        "invalid": len(invalid),
        "events": valid_events,
        "invalid_events": invalid,
    }
