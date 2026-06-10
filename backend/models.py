import uuid
from sqlalchemy import Column, String, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


def new_uuid() -> str:
    return str(uuid.uuid4())


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
    members = Column(Text, default="")            # JSON lista userów
