import json
import os
from functools import lru_cache

from fastapi import APIRouter, HTTPException

from models.wizard import WizardStep

router = APIRouter()

STEPS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "steps.json")


@lru_cache(maxsize=1)
def _load_steps() -> list[WizardStep]:
    with open(STEPS_FILE, encoding="utf-8") as f:
        raw = json.load(f)
    return [WizardStep.model_validate(s) for s in raw]


@router.get("/steps", response_model=list[WizardStep])
async def get_steps() -> list[WizardStep]:
    """Return all wizard step definitions."""
    return _load_steps()


@router.get("/steps/{step_id}", response_model=WizardStep)
async def get_step(step_id: int) -> WizardStep:
    """Return a single wizard step by ID."""
    steps = _load_steps()
    for step in steps:
        if step.id == step_id:
            return step
    raise HTTPException(status_code=404, detail=f"Step {step_id} not found")
