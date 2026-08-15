"""Tests for storage service."""

import pytest

from app.storage.local import LocalStorageService


@pytest.mark.asyncio
async def test_upload_download_delete(temp_storage: LocalStorageService):
    key = "test/file.txt"
    data = b"Hello, BurnDrop!"

    async def stream():
        yield data

    stored = await temp_storage.upload(key, stream(), len(data), "text/plain")
    assert stored == key
    assert await temp_storage.exists(key)

    chunks = []
    async for chunk in temp_storage.download(key):
        chunks.append(chunk)
    assert b"".join(chunks) == data

    meta = await temp_storage.get_metadata(key)
    assert meta is not None
    assert meta.size == len(data)

    assert await temp_storage.delete(key) is True
    assert not await temp_storage.exists(key)
