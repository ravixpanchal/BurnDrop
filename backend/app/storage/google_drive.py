"""Google Drive storage implementation using OAuth refresh token."""

import io
from collections.abc import AsyncIterator
from functools import lru_cache

from app.config.settings import get_settings
from app.storage.base import StorageMetadata, StorageService
from app.storage.local import LocalStorageService

CHUNK_SIZE = 1024 * 1024  # 1 MB


class GoogleDriveStorageService(StorageService):
    def __init__(self):
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaIoBaseDownload, MediaIoBaseUpload

        self._MediaIoBaseDownload = MediaIoBaseDownload
        self._MediaIoBaseUpload = MediaIoBaseUpload

        settings = get_settings()
        self.folder_id = settings.google_drive_folder_id
        creds = Credentials(
            token=None,
            refresh_token=settings.google_refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret,
        )
        self.service = build("drive", "v3", credentials=creds, cache_discovery=False)

    async def upload(self, key: str, stream: AsyncIterator[bytes], size: int, mime_type: str | None) -> str:
        buffer = io.BytesIO()
        async for chunk in stream:
            buffer.write(chunk)
        buffer.seek(0)

        file_metadata = {
            "name": key,
            "parents": [self.folder_id],
        }
        media = self._MediaIoBaseUpload(buffer, mimetype=mime_type or "application/octet-stream", resumable=True, chunksize=CHUNK_SIZE * 256)
        file = (
            self.service.files()
            .create(body=file_metadata, media_body=media, fields="id", supportsAllDrives=True)
            .execute()
        )
        return file["id"]

    async def download(self, key: str) -> AsyncIterator[bytes]:
        request = self.service.files().get_media(fileId=key, supportsAllDrives=True)
        buffer = io.BytesIO()
        downloader = self._MediaIoBaseDownload(buffer, request, chunksize=CHUNK_SIZE)
        done = False
        while not done:
            _, done = downloader.next_chunk()
            buffer.seek(0)
            data = buffer.read()
            buffer.seek(0)
            buffer.truncate(0)
            if data:
                yield data

    async def delete(self, key: str) -> bool:
        try:
            self.service.files().delete(fileId=key, supportsAllDrives=True).execute()
            return True
        except Exception:
            return False

    async def exists(self, key: str) -> bool:
        try:
            self.service.files().get(fileId=key, fields="id", supportsAllDrives=True).execute()
            return True
        except Exception:
            return False

    async def get_metadata(self, key: str) -> StorageMetadata | None:
        try:
            meta = (
                self.service.files()
                .get(fileId=key, fields="id,size,mimeType", supportsAllDrives=True)
                .execute()
            )
            return StorageMetadata(
                key=meta["id"],
                size=int(meta.get("size", 0)),
                mime_type=meta.get("mimeType"),
            )
        except Exception:
            return None


@lru_cache
def get_storage_service() -> StorageService:
    settings = get_settings()
    if settings.storage_backend == "google_drive":
        try:
            return GoogleDriveStorageService()
        except Exception as e:
            logger.warning("Google Drive storage service initialization failed: %s; falling back to local storage.", e)
            return LocalStorageService()
    return LocalStorageService()
