"""Background cleanup worker for expired shares."""

import asyncio
import logging

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.repositories.share_repository import ShareRepository
from app.storage.base import StorageService

logger = logging.getLogger(__name__)


async def run_cleanup(session_factory: async_sessionmaker[AsyncSession], storage: StorageService) -> int:
    deleted_count = 0
    async with session_factory() as session:
        repo = ShareRepository(session)
        await repo.mark_expired_shares()
        shares = await repo.get_expired_for_cleanup()

        for share in shares:
            try:
                if share.files:
                    for sf in share.files:
                        await storage.delete(sf.storage_key)
                await storage.delete(share.storage_key)
                await repo.mark_deleted(share.share_id)
                deleted_count += 1
            except Exception:
                logger.exception("Failed to delete share %s", share.share_id)

        await session.commit()

    return deleted_count


async def cleanup_loop(
    session_factory: async_sessionmaker[AsyncSession],
    storage: StorageService,
    interval_seconds: int = 300,
) -> None:
    while True:
        try:
            count = await run_cleanup(session_factory, storage)
            if count:
                logger.info("Cleanup deleted %d expired shares", count)
        except Exception:
            logger.exception("Cleanup worker error")
        await asyncio.sleep(interval_seconds)
