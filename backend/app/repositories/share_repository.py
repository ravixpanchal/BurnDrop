"""Share repository with atomic consumption."""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.share import Share, ShareStatus


class ShareRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, share: Share) -> Share:
        self.session.add(share)
        await self.session.flush()
        return share

    async def get_by_code_hash(self, code_hash: str) -> Share | None:
        result = await self.session.execute(select(Share).where(Share.code_hash == code_hash))
        return result.scalar_one_or_none()

    async def get_by_share_id(self, share_id: UUID) -> Share | None:
        result = await self.session.execute(select(Share).where(Share.share_id == share_id))
        return result.scalar_one_or_none()

    async def get_by_share_id_for_update(self, share_id: UUID) -> Share | None:
        result = await self.session.execute(
            select(Share).where(Share.share_id == share_id).with_for_update()
        )
        return result.scalar_one_or_none()

    async def atomic_consume(self, share_id: UUID) -> Share | None:
        """Get share if active or consumed within expiration period. Returns share if accessible, None if expired or deleted."""
        share = await self.get_by_share_id(share_id)
        if share is None:
            return None

        now = datetime.now(UTC)

        if share.status not in (ShareStatus.ACTIVE, ShareStatus.CONSUMED):
            return None

        expires = share.expires_at.replace(tzinfo=UTC) if share.expires_at.tzinfo is None else share.expires_at
        if expires < now:
            share.status = ShareStatus.EXPIRED
            await self.session.flush()
            return None

        return share

    async def mark_expired_shares(self) -> list[Share]:
        now = datetime.now(UTC)
        result = await self.session.execute(
            select(Share).where(
                Share.status.in_([ShareStatus.ACTIVE, ShareStatus.CONSUMED]),
                Share.expires_at < now,
            )
        )
        shares = list(result.scalars().all())
        for share in shares:
            share.status = ShareStatus.EXPIRED
        await self.session.flush()
        return shares

    async def get_expired_for_cleanup(self) -> list[Share]:
        now = datetime.now(UTC)
        result = await self.session.execute(
            select(Share).where(
                Share.status.in_([ShareStatus.EXPIRED, ShareStatus.CONSUMED, ShareStatus.ACTIVE]),
                Share.expires_at < now,
                Share.deleted_at.is_(None),
            )
        )
        return list(result.scalars().all())

    async def mark_deleted(self, share_id: UUID) -> None:
        await self.session.execute(
            update(Share)
            .where(Share.share_id == share_id)
            .values(status=ShareStatus.DELETED, deleted_at=datetime.now(UTC))
        )
