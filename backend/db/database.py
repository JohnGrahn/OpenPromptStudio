from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from config import (
    DATABASE_URL,
    DB_POOL_SIZE,
    DB_MAX_OVERFLOW,
    DB_POOL_RECYCLE,
    RUN_STACK_SYNC_ON_START,
)

engine = create_engine(
    DATABASE_URL,
    pool_size=DB_POOL_SIZE,  # Configurable pool size
    max_overflow=DB_MAX_OVERFLOW,  # Configurable overflow
    pool_recycle=DB_POOL_RECYCLE,  # Configurable connection recycling
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def _try_init_stacks():
    # Initialize database session
    db = SessionLocal()
    try:
        from sandbox.default_packs import PACKS
        from db.models import Stack

        for pack in PACKS:
            stack = db.query(Stack).filter(Stack.title == pack.title).first()
            if stack:
                # Update existing stack
                stack.description = pack.description
                stack.from_registry = pack.from_registry
                stack.sandbox_init_cmd = pack.sandbox_init_cmd
                stack.sandbox_start_cmd = pack.sandbox_start_cmd
                stack.prompt = pack.prompt
                stack.pack_hash = pack.pack_hash
                stack.setup_time_seconds = pack.setup_time_seconds
            else:
                # Insert new stack
                stack = Stack(
                    title=pack.title,
                    description=pack.description,
                    from_registry=pack.from_registry,
                    sandbox_init_cmd=pack.sandbox_init_cmd,
                    sandbox_start_cmd=pack.sandbox_start_cmd,
                    prompt=pack.prompt,
                    pack_hash=pack.pack_hash,
                    setup_time_seconds=pack.setup_time_seconds,
                )
                db.add(stack)
        db.commit()
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    if RUN_STACK_SYNC_ON_START:
        _try_init_stacks()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()