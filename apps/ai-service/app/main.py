# ============================================================
# TROSV AI service - FastAPI application package entrypoint.
# Docs/contracts: docs/contracts/AI_CONTRACT.md.
# ============================================================

import os

from fastapi import FastAPI

from app.features.areas.router import router as areas_router
from app.features.chat.router import router as chat_router
from app.features.description.router import router as description_router
from app.features.health.router import router as health_router
from app.features.price_advice.router import router as price_advice_router
from app.features.roommates.router import router as roommates_router

FAKE_MODE = os.getenv("FAKE_MODE", "true").lower() != "false"

app = FastAPI(title="TROSV AI service", version="0.1.0")

app.include_router(health_router)
app.include_router(roommates_router)
app.include_router(price_advice_router)
app.include_router(areas_router)
app.include_router(chat_router)
app.include_router(description_router)
