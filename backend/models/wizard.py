from typing import Any, Literal

from pydantic import BaseModel


FieldType = Literal[
    "text", "url", "textarea", "select", "multiselect",
    "number", "toggle", "tags", "range",
]


class FieldOption(BaseModel):
    value: str
    label: str


class WizardField(BaseModel):
    id: str
    label: str
    type: FieldType
    placeholder: str = ""
    hint: str = ""
    required: bool = False
    default: Any = None
    options: list[FieldOption] = []
    min: float | None = None
    max: float | None = None
    step: float | None = None


class WizardStep(BaseModel):
    id: int
    slug: str
    title: str
    description: str
    icon: str
    fields: list[WizardField]
    ai_prompt_context: str


class AiHintRequest(BaseModel):
    session_id: str
    step_id: int
    user_data: dict[str, Any] = {}


class AiBriefRequest(BaseModel):
    session_id: str
