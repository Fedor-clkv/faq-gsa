import json
from typing import Any

import redis.asyncio as aioredis

from core.config import settings

_redis: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None


async def session_get(session_id: str) -> dict[str, Any] | None:
    r = get_redis()
    raw = await r.get(f"session:{session_id}")
    if raw is None:
        return None
    return json.loads(raw)


async def session_set(session_id: str, data: dict[str, Any]) -> None:
    r = get_redis()
    await r.set(
        f"session:{session_id}",
        json.dumps(data, ensure_ascii=False),
        ex=settings.session_ttl_seconds,
    )


async def session_delete(session_id: str) -> None:
    r = get_redis()
    await r.delete(f"session:{session_id}")
