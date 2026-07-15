"""
Endpoints for action areas (hunting drives).

Secured (require JWT):
  GET    /api/actions                       – list all actions
  POST   /api/actions                       – create an action (any logged-in user)
  PUT    /api/actions/{id}                  – edit your own action (any logged-in user)
  DELETE /api/actions/{id}                  – delete an action (admin only)  ← role-gated endpoint
  GET    /api/actions/{id}/tracks           – list every member's GPS track for this action
  POST   /api/actions/{id}/tracks/points    – append a GPS point to your own track
  DELETE /api/actions/tracks                – clear all tracks (admin only)
  GET    /api/actions/{id}/routes           – list routes for this action
  POST   /api/actions/{id}/routes           – save a new route
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import get_current_user, require_admin
from database import get_db
from models import ActionArea, ActionPoint, GroupMembership, Route, RoutePoint, Track, TrackPoint

router = APIRouter(prefix="/api/actions", tags=["actions"])


# ── Pydantic schemas ──────────────────────────────────────────────────────

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


class TrackPointIn(BaseModel):
    lat: float
    lng: float
    timestamp: float
    accuracy: float | None = None


class TrackPointOut(BaseModel):
    lat: float
    lng: float
    timestamp: float
    accuracy: float | None

    model_config = {"from_attributes": True}


class TrackOut(BaseModel):
    owner_sub: str
    points: list[TrackPointOut]


class RoutePointIn(BaseModel):
    lat: float
    lng: float


class RouteIn(BaseModel):
    points: list[RoutePointIn]


class RouteOut(BaseModel):
    id: str
    owner_sub: str
    points: list[RoutePointIn]


# ── Helpers ────────────────────────────────────────────────────────────────

def _to_out(action: ActionArea) -> ActionOut:
    return ActionOut(
        id=action.id,
        name=action.name,
        description=action.description or "",
        created_by=action.created_by,
        group_id=action.group_id,
        points=[PointOut(lat=p.lat, lng=p.lng) for p in action.points],
    )


def _get_action_or_404(action_id: str, db: Session) -> ActionArea:
    action = db.get(ActionArea, action_id)
    if action is None:
        raise HTTPException(status_code=404, detail="Action not found.")
    return action


# ── Endpoints ──────────────────────────────────────────────────────────────

@router.get("", response_model=list[ActionOut])
def list_actions(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),          # 🔒 requires JWT
) -> Any:
    """Fetch action areas visible to the current user: their own ungrouped
    actions, plus actions belonging to groups they are a member of."""
    my_group_ids = {
        m.group_id
        for m in db.query(GroupMembership)
        .filter(GroupMembership.user_sub == user["sub"])
        .all()
    }
    visible = [
        a
        for a in db.query(ActionArea).all()
        if (a.group_id is None and a.created_by == user["sub"])
        or (a.group_id is not None and a.group_id in my_group_ids)
    ]
    return [_to_out(a) for a in visible]


@router.post("", response_model=ActionOut, status_code=status.HTTP_201_CREATED)
def create_action(
    body: ActionIn,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),         # 🔒 requires JWT
) -> Any:
    """Create a new action area."""
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


# ── Tracks (live GPS position sharing) ──────────────────────────────────────

@router.get("/{action_id}/tracks", response_model=list[TrackOut])
def list_tracks(
    action_id: str,
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),        # 🔒 requires JWT
) -> Any:
    """Fetch every member's GPS track for this action."""
    _get_action_or_404(action_id, db)
    tracks = db.query(Track).filter(Track.action_id == action_id).all()
    return [
        TrackOut(
            owner_sub=t.owner_sub,
            points=[
                TrackPointOut(lat=p.lat, lng=p.lng, timestamp=p.timestamp, accuracy=p.accuracy)
                for p in t.points
            ],
        )
        for t in tracks
    ]


@router.post("/{action_id}/tracks/points", status_code=status.HTTP_201_CREATED)
def add_track_point(
    action_id: str,
    body: TrackPointIn,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),         # 🔒 requires JWT
) -> Any:
    """Append a GPS point to the current user's track for this action."""
    _get_action_or_404(action_id, db)

    track = (
        db.query(Track)
        .filter(Track.action_id == action_id, Track.owner_sub == user["sub"])
        .first()
    )
    if track is None:
        track = Track(id=str(uuid.uuid4()), action_id=action_id, owner_sub=user["sub"])
        db.add(track)
        db.flush()

    db.add(TrackPoint(
        id=str(uuid.uuid4()),
        track_id=track.id,
        lat=body.lat,
        lng=body.lng,
        timestamp=body.timestamp,
        accuracy=body.accuracy,
    ))
    db.commit()
    return {"status": "ok"}


@router.delete("/tracks", status_code=status.HTTP_204_NO_CONTENT)
def clear_all_tracks(
    db: Session = Depends(get_db),
    _admin: dict = Depends(require_admin),           # 🔒 requires ADMIN role
) -> None:
    """Clear every track for every action – admin only."""
    db.query(Track).delete()
    db.commit()


# ── Routes (planned paths) ───────────────────────────────────────────────────

@router.get("/{action_id}/routes", response_model=list[RouteOut])
def list_routes(
    action_id: str,
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),        # 🔒 requires JWT
) -> Any:
    """Fetch all saved routes for this action."""
    _get_action_or_404(action_id, db)
    routes = db.query(Route).filter(Route.action_id == action_id).all()
    return [
        RouteOut(
            id=r.id,
            owner_sub=r.owner_sub,
            points=[RoutePointIn(lat=p.lat, lng=p.lng) for p in r.points],
        )
        for r in routes
    ]


@router.post("/{action_id}/routes", response_model=RouteOut, status_code=status.HTTP_201_CREATED)
def save_route(
    action_id: str,
    body: RouteIn,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),         # 🔒 requires JWT
) -> Any:
    """Save a new route for this action."""
    _get_action_or_404(action_id, db)

    route = Route(id=str(uuid.uuid4()), action_id=action_id, owner_sub=user["sub"])
    db.add(route)
    db.flush()

    for seq, p in enumerate(body.points):
        db.add(RoutePoint(id=str(uuid.uuid4()), route_id=route.id, seq=seq, lat=p.lat, lng=p.lng))

    db.commit()
    db.refresh(route)
    return RouteOut(
        id=route.id,
        owner_sub=route.owner_sub,
        points=[RoutePointIn(lat=p.lat, lng=p.lng) for p in route.points],
    )


@router.put("/{action_id}", response_model=ActionOut)
def update_action(
    action_id: str,
    body: ActionIn,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),         # 🔒 requires JWT
) -> Any:
    """Update an action area (owner only)."""
    action = db.get(ActionArea, action_id)
    if action is None:
        raise HTTPException(status_code=404, detail="Action not found.")
    if action.created_by != user["sub"]:
        raise HTTPException(status_code=403, detail="You can only edit your own actions.")

    action.name = body.name
    action.description = body.description
    action.group_id = body.group_id

    # Replace points
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
    _admin: dict = Depends(require_admin),          # 🔒 requires ADMIN role
) -> None:
    """Delete an action area – admin only."""
    action = db.get(ActionArea, action_id)
    if action is None:
        raise HTTPException(status_code=404, detail="Action not found.")
    db.delete(action)
    db.commit()
