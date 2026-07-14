import uuid
import time

from sqlalchemy import Column, String, Float, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


def new_uuid() -> str:
    return str(uuid.uuid4())


def now_ms() -> float:
    return time.time() * 1000


class ActionArea(Base):
    __tablename__ = "action_areas"

    id = Column(String, primary_key=True, default=new_uuid)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(String, nullable=False)   # Auth0 user sub
    group_id = Column(String, nullable=True)

    points = relationship(
        "ActionPoint", back_populates="action", cascade="all, delete-orphan"
    )
    tracks = relationship(
        "Track", back_populates="action", cascade="all, delete-orphan"
    )
    routes = relationship(
        "Route", back_populates="action", cascade="all, delete-orphan"
    )


class ActionPoint(Base):
    __tablename__ = "action_points"

    id = Column(String, primary_key=True, default=new_uuid)
    action_id = Column(String, ForeignKey("action_areas.id"), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    action = relationship("ActionArea", back_populates="points")


class Group(Base):
    __tablename__ = "groups"

    id = Column(String, primary_key=True, default=new_uuid)
    name = Column(String, nullable=False)
    created_by = Column(String, nullable=False)   # Auth0 user sub

    memberships = relationship(
        "GroupMembership", back_populates="group", cascade="all, delete-orphan"
    )
    comments = relationship(
        "GroupComment", back_populates="group", cascade="all, delete-orphan"
    )


class GroupMembership(Base):
    __tablename__ = "group_memberships"

    id = Column(String, primary_key=True, default=new_uuid)
    group_id = Column(String, ForeignKey("groups.id"), nullable=False)
    user_sub = Column(String, nullable=False)
    display_name = Column(String, nullable=False)
    joined_at = Column(Float, default=now_ms, nullable=False)

    group = relationship("Group", back_populates="memberships")


class GroupComment(Base):
    __tablename__ = "group_comments"

    id = Column(String, primary_key=True, default=new_uuid)
    group_id = Column(String, ForeignKey("groups.id"), nullable=False)
    owner_sub = Column(String, nullable=False)
    owner_name = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(Float, default=now_ms, nullable=False)

    group = relationship("Group", back_populates="comments")


class Reputation(Base):
    __tablename__ = "reputations"

    sub = Column(String, primary_key=True)
    score = Column(Integer, default=0, nullable=False)


class Track(Base):
    __tablename__ = "tracks"

    id = Column(String, primary_key=True, default=new_uuid)
    action_id = Column(String, ForeignKey("action_areas.id"), nullable=False)
    owner_sub = Column(String, nullable=False)

    action = relationship("ActionArea", back_populates="tracks")
    points = relationship(
        "TrackPoint",
        back_populates="track",
        cascade="all, delete-orphan",
        order_by="TrackPoint.timestamp",
    )


class TrackPoint(Base):
    __tablename__ = "track_points"

    id = Column(String, primary_key=True, default=new_uuid)
    track_id = Column(String, ForeignKey("tracks.id"), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    timestamp = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=True)

    track = relationship("Track", back_populates="points")


class Route(Base):
    __tablename__ = "routes"

    id = Column(String, primary_key=True, default=new_uuid)
    action_id = Column(String, ForeignKey("action_areas.id"), nullable=False)
    owner_sub = Column(String, nullable=False)

    action = relationship("ActionArea", back_populates="routes")
    points = relationship(
        "RoutePoint",
        back_populates="route",
        cascade="all, delete-orphan",
        order_by="RoutePoint.seq",
    )


class RoutePoint(Base):
    __tablename__ = "route_points"

    id = Column(String, primary_key=True, default=new_uuid)
    route_id = Column(String, ForeignKey("routes.id"), nullable=False)
    seq = Column(Integer, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    route = relationship("Route", back_populates="points")
