"""Storage service abstraction."""

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from dataclasses import dataclass


@dataclass
class StorageMetadata:
    key: str
    size: int
    mime_type: str | None


class StorageService(ABC):
    @abstractmethod
    async def upload(self, key: str, stream: AsyncIterator[bytes], size: int, mime_type: str | None) -> str:
        """Upload a file. Returns storage key."""

    @abstractmethod
    async def download(self, key: str) -> AsyncIterator[bytes]:
        """Stream file contents."""

    @abstractmethod
    async def delete(self, key: str) -> bool:
        """Delete a file. Returns True if deleted or already absent."""

    @abstractmethod
    async def exists(self, key: str) -> bool:
        """Check if file exists."""

    @abstractmethod
    async def get_metadata(self, key: str) -> StorageMetadata | None:
        """Get file metadata."""
