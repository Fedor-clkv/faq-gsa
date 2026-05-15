from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from core.config import settings
from core.redis_client import close_redis
from api import sessions, wizard, ai, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_redis()


app = FastAPI(
    title="GSA SER Interactive Manual",
    description="Step-by-step interactive manual for GSA Search Engine Ranker with AI assistance",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router, prefix="/api/sessions", tags=["sessions"])
app.include_router(wizard.router, prefix="/api/wizard", tags=["wizard"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")


@app.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok"}
