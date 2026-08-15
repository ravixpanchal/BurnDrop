"""Test configuration."""

import asyncio
import os
import tempfile
from collections.abc import AsyncGenerator
from pathlib import Path

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

os.environ["APP_SECRET"] = "test-secret-key-for-hmac-hashing-minimum-length"
os.environ["STORAGE_BACKEND"] = "local"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["REDIS_URL"] = "redis://localhost:6379/15"
os.environ["EMAIL_PASSWORD"] = ""
os.environ["MAX_FILE_SIZE_MB"] = "1024"
os.environ["FILE_EXPIRATION_HOURS"] = "3"

from app.config.settings import get_settings
from app.database import get_db
from app.main import create_app
from app.models import Base
from app.storage.local import LocalStorageService

get_settings.cache_clear()


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def temp_storage(tmp_path: Path) -> LocalStorageService:
    return LocalStorageService(root=tmp_path)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest_asyncio.fixture
async def client(temp_storage: LocalStorageService) -> AsyncGenerator[AsyncClient, None]:
    from app.storage import google_drive

    google_drive.get_storage_service.cache_clear()

    original_get = google_drive.get_storage_service

    def mock_get():
        return temp_storage

    google_drive.get_storage_service = mock_get

    app = create_app()

    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db

    # Mock redis for tests
    class FakeRedis:
        def __init__(self):
            self.data: dict = {}

        def pipeline(self):
            return FakePipeline(self)

        async def aclose(self):
            pass

    class FakePipeline:
        def __init__(self, redis: FakeRedis):
            self.redis = redis
            self.ops = []

        def zremrangebyscore(self, key, min_score, max_score):
            self.ops.append(("zremrangebyscore", key, min_score, max_score))
            return self

        def zadd(self, key, mapping):
            self.ops.append(("zadd", key, mapping))
            return self

        def zcard(self, key):
            self.ops.append(("zcard", key))
            return self

        def expire(self, key, seconds):
            self.ops.append(("expire", key, seconds))
            return self

        async def execute(self):
            return [0, None, 1, True]

    from app.security import rate_limit

    fake_redis = FakeRedis()

    async def fake_get_redis():
        return fake_redis

    app.dependency_overrides[rate_limit.get_redis] = fake_get_redis

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
    google_drive.get_storage_service = original_get
