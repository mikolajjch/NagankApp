"""
NagankApp – FastAPI backend secured with OAuth 2.0 (Auth0).

Endpoints:
  GET  /health               – UNSECURED
  GET  /api/actions          – secured (JWT)
  POST /api/actions          – secured (JWT)
  PUT  /api/actions/{id}     – secured (JWT, owner only)
  DELETE /api/actions/{id}   – secured (JWT + admin role)
  GET  /api/groups           – secured (JWT)
  POST /api/groups           – secured (JWT)
"""

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import actions, groups, health

load_dotenv()

# Create tables on startup (dev mode; use Alembic in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NagankApp API",
    description="Backend secured with OAuth 2.0 via Auth0 and PKCE",
    version="1.0.0",
)

# CORS – allow the frontend (Vite dev server) to connect
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
