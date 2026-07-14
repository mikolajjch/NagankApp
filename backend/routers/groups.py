"""
Endpoints for hunting groups.

Secured (require JWT):
  GET    /api/groups                          – list groups (with members + comments)
  POST   /api/groups                          – create a group
  POST   /api/groups/{id}/join                – join a group (self-service)
  DELETE /api/groups/{id}                     – delete a group (owner or admin)
  POST   /api/groups/{id}/comments            – post a comment (members only)
  DELETE /api/groups/{id}/comments/{id}       – delete a comment (owner or admin)
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import ROLES_CLAIM, display_name, get_current_user
from database import get_db
from models import Group, GroupComment, GroupMembership, Reputation

router = APIRouter(prefix="/api/groups", tags=["groups"])


# ── Pydantic schemas ──────────────────────────────────────────────────────

class GroupIn(BaseModel):
    name: str


class CommentIn(BaseModel):
    text: str


class MemberOut(BaseModel):
    sub: str
    display_name: str
    reputation: int


class CommentOut(BaseModel):
    id: str
    owner_sub: str
    owner_name: str
    text: str
    created_at: float


class GroupOut(BaseModel):
    id: str
    name: str
    created_by: str
    members: list[MemberOut]
    comments: list[CommentOut]


# ── Helpers ────────────────────────────────────────────────────────────────

def _to_out(group: Group, db: Session) -> GroupOut:
    subs = [m.user_sub for m in group.memberships]
    reputations = {
        r.sub: r.score
        for r in db.query(Reputation).filter(Reputation.sub.in_(subs)).all()
    }
    members = [
        MemberOut(
            sub=m.user_sub,
            display_name=m.display_name,
            reputation=reputations.get(m.user_sub, 0),
        )
        for m in group.memberships
    ]
    comments = [
        CommentOut(
            id=c.id,
            owner_sub=c.owner_sub,
            owner_name=c.owner_name,
            text=c.text,
            created_at=c.created_at,
        )
        for c in sorted(group.comments, key=lambda c: c.created_at)
    ]
    return GroupOut(
        id=group.id,
        name=group.name,
        created_by=group.created_by,
        members=members,
        comments=comments,
    )


def _get_group_or_404(group_id: str, db: Session) -> Group:
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found.")
    return group


def _is_member(group: Group, sub: str) -> bool:
    return any(m.user_sub == sub for m in group.memberships)


# ── Endpoints ──────────────────────────────────────────────────────────────

@router.get("", response_model=list[GroupOut])
def list_groups(
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),    # 🔒 requires JWT
) -> Any:
    """Fetch all groups."""
    return [_to_out(g, db) for g in db.query(Group).all()]


@router.post("", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
def create_group(
    body: GroupIn,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),     # 🔒 requires JWT
) -> Any:
    """Create a new group. The creator becomes its first member."""
    group = Group(
        id=str(uuid.uuid4()),
        name=body.name,
        created_by=user["sub"],
    )
    db.add(group)
    db.flush()

    db.add(GroupMembership(
        id=str(uuid.uuid4()),
        group_id=group.id,
        user_sub=user["sub"],
        display_name=display_name(user),
    ))

    db.commit()
    db.refresh(group)
    return _to_out(group, db)


@router.post("/{group_id}/join", response_model=GroupOut)
def join_group(
    group_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),     # 🔒 requires JWT
) -> Any:
    """Join a group (idempotent – no-op if already a member)."""
    group = _get_group_or_404(group_id, db)

    if not _is_member(group, user["sub"]):
        db.add(GroupMembership(
            id=str(uuid.uuid4()),
            group_id=group.id,
            user_sub=user["sub"],
            display_name=display_name(user),
        ))
        db.commit()
        db.refresh(group)

    return _to_out(group, db)


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(
    group_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),     # 🔒 requires JWT
) -> None:
    """Delete a group – owner or admin only."""
    group = _get_group_or_404(group_id, db)
    is_admin = "admin" in user.get(ROLES_CLAIM, [])
    if group.created_by != user["sub"] and not is_admin:
        raise HTTPException(status_code=403, detail="Only the group owner or an admin can delete this group.")

    db.delete(group)
    db.commit()


@router.post("/{group_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def add_comment(
    group_id: str,
    body: CommentIn,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),     # 🔒 requires JWT
) -> Any:
    """Post a comment – members only."""
    group = _get_group_or_404(group_id, db)
    if not _is_member(group, user["sub"]):
        raise HTTPException(status_code=403, detail="Only group members can comment.")

    comment = GroupComment(
        id=str(uuid.uuid4()),
        group_id=group_id,
        owner_sub=user["sub"],
        owner_name=display_name(user),
        text=body.text,
    )
    db.add(comment)

    reputation = db.get(Reputation, user["sub"])
    if reputation is None:
        reputation = Reputation(sub=user["sub"], score=0)
        db.add(reputation)
    reputation.score += 1

    db.commit()
    db.refresh(comment)
    return CommentOut(
        id=comment.id,
        owner_sub=comment.owner_sub,
        owner_name=comment.owner_name,
        text=comment.text,
        created_at=comment.created_at,
    )


@router.delete("/{group_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    group_id: str,
    comment_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),     # 🔒 requires JWT
) -> None:
    """Delete a comment – comment owner or admin only."""
    comment = db.get(GroupComment, comment_id)
    if comment is None or comment.group_id != group_id:
        raise HTTPException(status_code=404, detail="Comment not found.")

    is_admin = "admin" in user.get(ROLES_CLAIM, [])
    if comment.owner_sub != user["sub"] and not is_admin:
        raise HTTPException(status_code=403, detail="Only the comment owner or an admin can delete this comment.")

    db.delete(comment)
    db.commit()
