"""Tests for expiration logic."""

from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.share import Share, ShareStatus
from app.repositories.share_repository import ShareRepository
from app.config.settings import get_settings
from app.security.codes import hash_code, normalize_code
import uuid


@pytest.mark.asyncio
async def test_expired_share_rejected(db_session: AsyncSession):
    settings = get_settings()
    share_id = uuid.uuid4()
    code = "ABCD-EFGH"
    code_h = hash_code(normalize_code(code), settings.app_secret)

    share = Share(
        share_id=share_id,
        code_hash=code_h,
        sender_email="test@example.com",
        original_filename="expired.txt",
        file_size=10,
        mime_type="text/plain",
        storage_key="shares/test/expired.txt",
        status=ShareStatus.ACTIVE,
        expires_at=datetime.now(UTC) - timedelta(hours=1),
    )
    repo = ShareRepository(db_session)
    await repo.create(share)

    consumed = await repo.atomic_consume(share_id)
    assert consumed is None
    assert share.status == ShareStatus.EXPIRED


@pytest.mark.asyncio
async def test_active_share_within_expiration(db_session: AsyncSession):
    settings = get_settings()
    share_id = uuid.uuid4()
    code_h = hash_code(normalize_code("WXYZ-1234"), settings.app_secret)

    share = Share(
        share_id=share_id,
        code_hash=code_h,
        sender_email="test@example.com",
        original_filename="valid.txt",
        file_size=10,
        mime_type="text/plain",
        storage_key="shares/test/valid.txt",
        status=ShareStatus.ACTIVE,
        expires_at=datetime.now(UTC) + timedelta(hours=2),
    )
    repo = ShareRepository(db_session)
    await repo.create(share)

    consumed = await repo.atomic_consume(share_id)
    assert consumed is not None
    assert consumed.status == ShareStatus.ACTIVE
