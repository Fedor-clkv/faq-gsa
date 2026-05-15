from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class StepData(BaseModel):
    """Data submitted by the user for a single wizard step."""

    step_id: int
    fields: dict[str, Any] = Field(default_factory=dict)
    completed: bool = False


class SessionBrief(BaseModel):
    """Generated configuration brief."""

    content: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class Session(BaseModel):
    """Anonymous user session stored in Redis."""

    session_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    current_step: int = 1
    steps: dict[str, StepData] = Field(default_factory=dict)
    brief: SessionBrief | None = None


class SessionCreateResponse(BaseModel):
    session_id: str
    created_at: datetime


class SessionUpdateStepRequest(BaseModel):
    fields: dict[str, Any] = Field(default_factory=dict)
    completed: bool = False
