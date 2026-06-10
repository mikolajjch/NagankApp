"""
Endpointy dla grup myśliwskich.

Zabezpieczone (wymagają JWT):
  GET  /api/groups       – lista grup
  POST /api/groups       – nowa grupa
"""

import json
import uuid
from typing import Any

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Group

router = APIRouter(prefix="/api/groups", tags=["groups"])


# ── Schematy Pydantic ──────────────────────────────────────────────────────

class GroupIn(BaseModel):
    name: str


class GroupOut(BaseModel):
    id: str
    name: str
    created_by: str
    members: list[str]

    model_config = {"from_attributes": True}


# ── Helpery ────────────────────────────────────────────────────────────────

def _to_out(group: Group) -> GroupOut:
    members = json.loads(group.members) if group.members else []
    return GroupOut(
        id=group.id,
        name=group.name,
        created_by=group.created_by,
        members=members,
    )


# ── Endpointy ──────────────────────────────────────────────────────────────

@router.get("", response_model=list[GroupOut])
def list_groups(
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),    # 🔒 wymaga JWT
) -> Any:
    """Pobierz wszystkie grupy."""
    return [_to_out(g) for g in db.query(Group).all()]


@router.post("", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
def create_group(
    body: GroupIn,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),     # 🔒 wymaga JWT
) -> Any:
    """Utwórz nową grupę."""
    group = Group(
        id=str(uuid.uuid4()),
        name=body.name,
        created_by=user["sub"],
        members=json.dumps([user["sub"]]),
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return _to_out(group)
