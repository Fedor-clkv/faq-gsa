import json
from datetime import datetime
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI

from core.config import settings
from core.redis_client import session_get, session_set
from models.session import Session, SessionBrief
from models.wizard import AiHintRequest, AiBriefRequest
from api.wizard import _load_steps

router = APIRouter()

_SYSTEM_BASE = (
    "Ты эксперт по GSA Search Engine Ranker (GSA SER) — профессиональному инструменту "
    "автоматического линкбилдинга. Отвечай на русском языке. "
    "Давай конкретные, практические советы. Избегай воды и повторений. "
    "Используй форматирование Markdown (жирный текст, списки) для читаемости."
)


def _get_client() -> AsyncOpenAI:
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key is not configured. Set OPENAI_API_KEY in .env",
        )
    return AsyncOpenAI(api_key=settings.openai_api_key)


async def _stream_openai(messages: list[dict]) -> AsyncGenerator[str, None]:
    client = _get_client()
    async with client.chat.completions.stream(
        model=settings.openai_model,
        messages=messages,
        temperature=0.7,
    ) as stream:
        async for text in stream.text_stream:
            if text:
                yield f"data: {json.dumps({'delta': text}, ensure_ascii=False)}\n\n"
    yield "data: [DONE]\n\n"


@router.post("/hint")
async def ai_hint(body: AiHintRequest) -> StreamingResponse:
    """Stream an AI hint for a specific wizard step."""
    steps = _load_steps()
    step = next((s for s in steps if s.id == body.step_id), None)
    if step is None:
        raise HTTPException(status_code=404, detail=f"Step {body.step_id} not found")

    session_data = await session_get(body.session_id)
    session_ctx = ""
    if session_data:
        session = Session.model_validate(session_data)
        prev_steps = {}
        for sid, sdata in session.steps.items():
            if int(sid) < body.step_id and sdata.fields:
                prev_steps[sid] = sdata.fields
        if prev_steps:
            session_ctx = (
                "\n\nДанные из предыдущих шагов пользователя:\n"
                + json.dumps(prev_steps, ensure_ascii=False, indent=2)
            )

    current_input = ""
    if body.user_data:
        current_input = (
            "\n\nТекущие введённые данные пользователя на этом шаге:\n"
            + json.dumps(body.user_data, ensure_ascii=False, indent=2)
        )

    messages = [
        {"role": "system", "content": _SYSTEM_BASE + "\n\n" + step.ai_prompt_context},
        {
            "role": "user",
            "content": (
                f"Я настраиваю проект в GSA SER. Шаг {body.step_id}: «{step.title}»."
                f"{session_ctx}{current_input}"
                "\n\nДай подсказку и рекомендации по текущим настройкам. "
                "Если данные уже введены — проанализируй их и предложи улучшения."
            ),
        },
    ]

    return StreamingResponse(
        _stream_openai(messages),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/brief")
async def ai_brief(body: AiBriefRequest) -> StreamingResponse:
    """Stream the final project brief generation."""
    session_data = await session_get(body.session_id)
    if session_data is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    session = Session.model_validate(session_data)

    steps = _load_steps()
    step_titles = {str(s.id): s.title for s in steps}

    steps_summary = {}
    for sid, sdata in session.steps.items():
        title = step_titles.get(sid, f"Шаг {sid}")
        steps_summary[title] = sdata.fields

    brief_step = next((s for s in steps if s.id == 8), None)
    system_prompt = _SYSTEM_BASE
    if brief_step:
        system_prompt += "\n\n" + brief_step.ai_prompt_context

    user_content = (
        "Пользователь завершил настройку проекта GSA SER. "
        "Вот полные данные всех шагов:\n\n"
        + json.dumps(steps_summary, ensure_ascii=False, indent=2)
        + "\n\nСгенерируй подробный структурированный бриф по этому проекту."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]

    async def stream_and_save() -> AsyncGenerator[str, None]:
        full_text = []
        async for chunk in _stream_openai(messages):
            yield chunk
            if chunk.startswith("data: ") and chunk.strip() != "data: [DONE]":
                try:
                    payload = json.loads(chunk[6:])
                    full_text.append(payload.get("delta", ""))
                except Exception:
                    pass

        brief_content = "".join(full_text)
        if brief_content:
            session.brief = SessionBrief(
                content=brief_content,
                generated_at=datetime.utcnow(),
            )
            session.updated_at = datetime.utcnow()
            await session_set(body.session_id, session.model_dump(mode="json"))

    return StreamingResponse(
        stream_and_save(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
