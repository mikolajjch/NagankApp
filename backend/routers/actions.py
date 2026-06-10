"""
Endpointy dla obszarów akcji (naganki).

Zabezpieczone (wymagają JWT):
  GET    /api/actions          – lista wszystkich akcji
  POST   /api/actions          – nowa akcja (zalogowany user)
  PUT    /api/actions/{id}     – edycja własnej akcji (zalogowany user)
  DELETE /api/actions/{id}     – usunięcie akcji (tylko admin)  ← endpoint z rolą
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import get_current_user, require_admin
from database import get_db
from models import ActionArea, ActionPoint

router = APIRouter(prefix="/api/actions", tags=["actions"])


# ── Schematy Pydantic ──────────────────────────────────────────────────────

class PointIn(BaseModel):
    lat: float
    lng: float


class ActionIn(BaseModel):
    name: str
    description: str = ""
    group_id: str | None = None
    points: list[PointIn] = []


class PointOut(BaseModel):
    lat: float
    lng: float

    model_config = {"from_attributes": True}


class ActionOut(BaseModel):
    id: str
    name: str
    description: str
    created_by: str
    group_id: str | None
    points: list[PointOut]

    model_config = {"from_attributes": True}


# ── Helpery ────────────────────────────────────────────────────────────────

def _to_out(action: ActionArea) -> ActionOut:
    return ActionOut(
        id=action.id,
        name=action.name,
        description=action.description or "",
        created_by=action.created_by,
        group_id=action.group_id,
        points=[PointOut(lat=p.lat, lng=p.lng) for p in action.points],
    )


# ── Endpointy ──────────────────────────────────────────────────────────────

@router.get("", response_model=list[ActionOut])
def list_actions(
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),        # 🔒 wymaga JWT
) -> Any:
    """Pobierz wszystkie obszary akcji."""
    return [_to_out(a) for a in db.query(ActionArea).all()]


@router.post("", response_model=ActionOut, status_code=status.HTTP_201_CREATED)
def create_action(
    body: ActionIn,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),         # 🔒 wymaga JWT
) -> Any:
    """Utwórz nowy obszar akcji."""
    action = ActionArea(
        id=str(uuid.uuid4()),
        name=body.name,
        description=body.description,
        created_by=user["sub"],
        group_id=body.group_id,
    )
    db.add(action)
    db.flush()

    for p in body.points:
        db.add(ActionPoint(
            id=str(uuid.uuid4()),
            action_id=action.id,
            lat=p.lat,
            lng=p.lng,
        ))

    db.commit()
    db.refresh(action)
    return _to_out(action)


@router.put("/{action_id}", response_model=ActionOut)
def update_action(
    action_id: str,
    body: ActionIn,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),         # 🔒 wymaga JWT
) -> Any:
    """Zaktualizuj obszar akcji (tylko własne)."""
    action = db.get(ActionArea, action_id)
    if action is None:
        raise HTTPException(status_code=404, detail="Akcja nie znaleziona.")
    if action.created_by != user["sub"]:
        raise HTTPException(status_code=403, detail="Mozesz edytowac tylko swoje akcje.")

    action.name = body.name
    action.description = body.description
    action.group_id = body.group_id

    # Zastap punkty
    for old in action.points:
        db.delete(old)
    db.flush()
    for p in body.points:
        db.add(ActionPoint(
            id=str(uuid.uuid4()),
            action_id=action.id,
            lat=p.lat,
            lng=p.lng,
        ))

    db.commit()
    db.refresh(action)
    return _to_out(action)


@router.delete("/{action_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_action(
    action_id: str,
    db: Session = Depends(get_db),
    _admin: dict = Depends(require_admin),          # 🔒 wymaga roli ADMIN
) -> None:
    """Usuń obszar akcji – tylko dla administratora."""
    action = db.get(ActionArea, action_id)
    if action is None:
        raise HTTPException(status_code=404, detail="Akcja nie znaleziona.")
    db.delete(action)
    db.commit()
