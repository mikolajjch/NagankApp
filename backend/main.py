"""
NagankApp – backend FastAPI zabezpieczony OAuth 2.0 (Auth0).

Endpointy:
  GET  /health               – NIEZABEZPIECZONY
  GET  /api/actions          – zabezpieczony (JWT)
  POST /api/actions          – zabezpieczony (JWT)
  PUT  /api/actions/{id}     – zabezpieczony (JWT, tylko właściciel)
  DELETE /api/actions/{id}   – zabezpieczony (JWT + rola admin)
  GET  /api/groups           – zabezpieczony (JWT)
  POST /api/groups           – zabezpieczony (JWT)
"""

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import actions, groups, health

load_dotenv()

# Utwórz tabele przy starcie (dev-mode; w produkcji użyj Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NagankApp API",
    description="Backend zabezpieczony OAuth 2.0 z Auth0 i PKCE",
    version="1.0.0",
)

# CORS – pozwól frontendowi (Vite dev server) na połączenie
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(actions.router)
app.include_router(groups.router)
