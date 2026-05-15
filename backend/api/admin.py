import base64
import os
from typing import Annotated

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from core.config import settings

router = APIRouter()

_ADMIN_USER = os.getenv("ADMIN_USER", "admin")
_ADMIN_PASS = os.getenv("ADMIN_PASS", "1324Derparol!")


def _check_auth(authorization: str | None) -> None:
    if not authorization or not authorization.startswith("Basic "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        decoded = base64.b64decode(authorization[6:]).decode()
        user, _, passwd = decoded.partition(":")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user != _ADMIN_USER or passwd != _ADMIN_PASS:
        raise HTTPException(status_code=403, detail="Forbidden")


class AdminSettings(BaseModel):
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    redis_url: str = "redis://localhost:6379/0"
    session_ttl_seconds: int = 86400
    cors_origins: str = "http://localhost:5173"


@router.get("/settings", response_model=AdminSettings)
async def get_settings(
    authorization: Annotated[str | None, Header()] = None,
) -> AdminSettings:
    _check_auth(authorization)
    return AdminSettings(
        openai_api_key="sk-***" if settings.openai_api_key else "",
        openai_model=settings.openai_model,
        redis_url=settings.redis_url,
        session_ttl_seconds=settings.session_ttl_seconds,
        cors_origins=settings.cors_origins,
    )


@router.post("/settings", response_model=dict)
async def update_settings(
    body: AdminSettings,
    authorization: Annotated[str | None, Header()] = None,
) -> dict:
    _check_auth(authorization)

    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    lines: list[str] = []

    if os.path.exists(env_path):
        with open(env_path) as f:
            lines = f.readlines()

    updates = {
        "OPENAI_API_KEY": body.openai_api_key if not body.openai_api_key.startswith("sk-***") else None,
        "OPENAI_MODEL": body.openai_model,
        "REDIS_URL": body.redis_url,
        "SESSION_TTL_SECONDS": str(body.session_ttl_seconds),
        "CORS_ORIGINS": body.cors_origins,
    }

    new_lines: list[str] = []
    updated_keys: set[str] = set()

    for line in lines:
        key = line.split("=", 1)[0].strip()
        if key in updates and updates[key] is not None:
            new_lines.append(f"{key}={updates[key]}\n")
            updated_keys.add(key)
        else:
            new_lines.append(line)

    for key, val in updates.items():
        if key not in updated_keys and val is not None:
            new_lines.append(f"{key}={val}\n")

    with open(env_path, "w") as f:
        f.writelines(new_lines)

    if body.openai_api_key and not body.openai_api_key.startswith("sk-***"):
        settings.openai_api_key = body.openai_api_key
    if body.openai_model:
        settings.openai_model = body.openai_model
    if body.redis_url:
        settings.redis_url = body.redis_url
    settings.session_ttl_seconds = body.session_ttl_seconds
    settings.cors_origins = body.cors_origins

    return {"ok": True}
