"""Tests for AWS S3 storage service."""

from unittest.mock import MagicMock

import pytest

from app.storage.s3 import S3StorageService


class FakeStreamingBody:
    def __init__(self, content: bytes):
        self.content = content
        self.offset = 0

    def read(self, chunk_size: int = 1024 * 1024):
        if self.offset >= len(self.content):
            return b""
        chunk = self.content[self.offset : self.offset + chunk_size]
        self.offset += len(chunk)
        return chunk


@pytest.mark.asyncio
async def test_s3_upload_download_delete_metadata():
    mock_s3 = MagicMock()
    stored_data = {}

    def mock_upload(Fileobj, Bucket, Key, ExtraArgs=None):
        stored_data[Key] = Fileobj.read()

    def mock_get_object(Bucket, Key):
        if Key not in stored_data:
            raise Exception("NoSuchKey")
        return {"Body": FakeStreamingBody(stored_data[Key])}

    def mock_delete_object(Bucket, Key):
        stored_data.pop(Key, None)

    def mock_head_object(Bucket, Key):
        if Key not in stored_data:
            raise Exception("NotFound")
        return {
            "ContentLength": len(stored_data[Key]),
            "ContentType": "text/plain",
        }

    mock_s3.upload_fileobj.side_effect = mock_upload
    mock_s3.get_object.side_effect = mock_get_object
    mock_s3.delete_object.side_effect = mock_delete_object
    mock_s3.head_object.side_effect = mock_head_object

    s3_service = S3StorageService(
        bucket_name="test-bucket",
        region="us-east-1",
        s3_client=mock_s3,
    )

    key = "test/file.txt"
    data = b"Hello AWS S3 BurnDrop!"

    async def stream():
        yield data

    # Test Upload
    stored_key = await s3_service.upload(key, stream(), len(data), "text/plain")
    assert stored_key == key

    # Test Exists
    assert await s3_service.exists(key) is True

    # Test Download
    chunks = []
    async for chunk in s3_service.download(key):
        chunks.append(chunk)
    assert b"".join(chunks) == data

    # Test Metadata
    meta = await s3_service.get_metadata(key)
    assert meta is not None
    assert meta.key == key
    assert meta.size == len(data)
    assert meta.mime_type == "text/plain"

    # Test Delete
    assert await s3_service.delete(key) is True
    assert await s3_service.exists(key) is False
