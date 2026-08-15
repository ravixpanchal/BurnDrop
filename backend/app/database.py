import asyncio
import logging
import socket
from collections.abc import AsyncGenerator
from urllib.parse import urlparse

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _is_db_reachable(url: str) -> bool:
    if "sqlite" in url:
        return True

    async def _test_conn() -> bool:
        try:
            test_engine = create_async_engine(url, connect_args={"timeout": 1.5})
            async with test_engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            await test_engine.dispose()
            return True
        except Exception as exc:
            logger.warning("Database at %s is unavailable (%s)", url, exc)
            return False

    try:
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                return executor.submit(lambda: asyncio.run(_test_conn())).result()
        else:
            return asyncio.run(_test_conn())
    except Exception as exc:
        logger.warning("Database check failed for %s (%s)", url, exc)
        return False


db_url = settings.database_url
if not _is_db_reachable(db_url):
    logger.info("Falling back to local SQLite database (burndrop_dev.db) for local development.")
    db_url = "sqlite+aiosqlite:///burndrop_dev.db"

engine = create_async_engine(db_url, echo=False, pool_pre_ping=True)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

