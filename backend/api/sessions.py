import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, Header
from typing import Annotated

from core.redis_client import session_get, session_set, session_delete
from models.session import (
    Session,
    SessionCreateResponse,
    SessionUpdateStepRequest,
    StepData,
    SessionBrief,
)

router = APIRouter()


def _require_session(session_id: str) -> None:
    """Validate session_id format (UUID4)."""
    try:
        uuid.UUID(session_id, version=4)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session_id format")


async def _load_or_404(session_id: str) -> Session:
    _require_session(session_id)
    data = await session_get(session_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    return Session.model_validate(data)


@router.post("", response_model=SessionCreateResponse, status_code=201)
async def create_session() -> SessionCreateResponse:
    """Create a new anonymous session."""
    session_id = str(uuid.uuid4())
    now = datetime.utcnow()
    session = Session(session_id=session_id, created_at=now, updated_at=now)
    await session_set(session_id, session.model_dump(mode="json"))
    return SessionCreateResponse(session_id=session_id, created_at=now)


@router.get("/{session_id}", response_model=Session)
async def get_session(session_id: str) -> Session:
    """Return full session data."""
    return await _load_or_404(session_id)


@router.put("/{session_id}/step/{step_id}", response_model=dict)
async def update_step(
    session_id: str,
    step_id: int,
    body: SessionUpdateStepRequest,
    x_session_id: Annotated[str | None, Header()] = None,
) -> dict:
    """Save user data for a specific wizard step."""
    session = await _load_or_404(session_id)

    session.steps[str(step_id)] = StepData(
        step_id=step_id,
        fields=body.fields,
        completed=body.completed,
    )
    session.current_step = max(session.current_step, step_id)
    session.updated_at = datetime.utcnow()

    await session_set(session_id, session.model_dump(mode="json"))
    return {"ok": True, "current_step": session.current_step}


@router.get("/{session_id}/brief", response_model=SessionBrief)
async def get_brief(session_id: str) -> SessionBrief:
    """Return the previously generated brief for a session."""
    session = await _load_or_404(session_id)
    if session.brief is None:
        raise HTTPException(status_code=404, detail="Brief not yet generated")
    return session.brief


@router.delete("/{session_id}", status_code=204)
async def delete_session(session_id: str) -> None:
    """Delete a session from Redis."""
    _require_session(session_id)
    await session_delete(session_id)
