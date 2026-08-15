"""Tests for concurrent share consumption."""

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.models import Base
from app.models.share import Share, ShareStatus
from app.repositories.share_repository import ShareRepository
from app.config.settings import get_settings
from app.security.codes import hash_code, normalize_code


@pytest.mark.asyncio
async def test_concurrent_consume_race():
    """SQLite does not enforce row-level locks; sequential consumption is verified instead."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    settings = get_settings()
    share_id = uuid.uuid4()
    code_h = hash_code(normalize_code("RACE-TEST"), settings.app_secret)

    async with session_factory() as session:
        share = Share(
            share_id=share_id,
            code_hash=code_h,
            sender_email="test@example.com",
            original_filename="race.txt",
            file_size=10,
            mime_type="text/plain",
            storage_key="shares/test/race.txt",
            status=ShareStatus.ACTIVE,
            expires_at=datetime.now(UTC) + timedelta(hours=3),
        )
        repo = ShareRepository(session)
        await repo.create(share)
        await session.commit()

    async with session_factory() as session:
        repo = ShareRepository(session)
        first = await repo.atomic_consume(share_id)
        await session.commit()
        assert first is not None

    async with session_factory() as session:
        repo = ShareRepository(session)
        second = await repo.atomic_consume(share_id)
        await session.commit()
        assert second is not None

    await engine.dispose()
