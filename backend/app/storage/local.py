"""Local filesystem storage for development and testing."""

import os
from collections.abc import AsyncIterator
from pathlib import Path

import aiofiles
import aiofiles.os

from app.storage.base import StorageMetadata, StorageService

STORAGE_ROOT = Path(os.environ.get("LOCAL_STORAGE_PATH", "storage"))


class LocalStorageService(StorageService):
    def __init__(self, root: Path | None = None):
        self.root = root or STORAGE_ROOT
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        safe_key = key.replace("..", "").lstrip("/")
        return self.root / safe_key

    async def upload(self, key: str, stream: AsyncIterator[bytes], size: int, mime_type: str | None) -> str:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(path, "wb") as f:
            async for chunk in stream:
                await f.write(chunk)
        return key

    async def download(self, key: str) -> AsyncIterator[bytes]:
        path = self._path(key)
        if not path.exists():
            raise FileNotFoundError(key)

        async with aiofiles.open(path, "rb") as f:
            while True:
                chunk = await f.read(1024 * 1024)
                if not chunk:
                    break
                yield chunk

    async def delete(self, key: str) -> bool:
        path = self._path(key)
        try:
            await aiofiles.os.remove(path)
            return True
        except FileNotFoundError:
            return True

    async def exists(self, key: str) -> bool:
        return self._path(key).exists()

    async def get_metadata(self, key: str) -> StorageMetadata | None:
        path = self._path(key)
        if not path.exists():
            return None
        stat = path.stat()
        return StorageMetadata(key=key, size=stat.st_size, mime_type=None)
