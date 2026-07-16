import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

load_dotenv()

# Hosting providers (Railway, Render, Heroku) inject DATABASE_URL for their
# managed Postgres instance. Falls back to a local SQLite file for dev.
# Some providers still hand out the legacy "postgres://" scheme, which
# SQLAlchemy 2.x no longer accepts — normalize it to "postgresql://".
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./nagank.db")
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
        "postgres://", "postgresql://", 1
    )

connect_args = (
    {"check_same_thread": False}
    if SQLALCHEMY_DATABASE_URL.startswith("sqlite")
    else {}
)

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
