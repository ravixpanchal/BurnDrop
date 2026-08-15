import io
import logging
import mimetypes
import os
import uuid
import zipfile
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import Settings, get_settings
from app.models.share import Share, ShareFile, ShareStatus
from app.repositories.share_repository import ShareRepository
from app.security.codes import generate_share_code, hash_code, normalize_code, validate_code_format
from app.security.tokens import create_access_token
from app.security.validation import can_preview, sanitize_filename, validate_email
from app.services.email_service import send_share_code_email
from app.storage.base import StorageService

logger = logging.getLogger(__name__)


def sanitize_relative_path(path: str) -> str:
    path = path.replace("\\", "/")
    parts = [p for p in path.split("/") if p and p not in (".", "..")]
    if not parts:
        return "file"
    sanitized_parts = [sanitize_filename(p) for p in parts]
    return "/".join(sanitized_parts)


class ShareService:
    def __init__(self, session: AsyncSession, storage: StorageService, settings: Settings | None = None):
        self.session = session
        self.storage = storage
        self.settings = settings or get_settings()
        self.repo = ShareRepository(session)

    async def create_share(self, files: list[UploadFile] | UploadFile, sender_email: str) -> tuple[Share, str, bool]:
        if not validate_email(sender_email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email address.")

        if isinstance(files, list):
            if len(files) == 0:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files provided.")
            file_list = files
        else:
            file_list = [files]

        share_id = uuid.uuid4()
        share_files: list[ShareFile] = []
        total_size = 0

        for f in file_list:
            orig_path = sanitize_relative_path(f.filename or "file")
            file_id = uuid.uuid4()
            mime_type = f.content_type
            basename = os.path.basename(orig_path)
            storage_key = f"shares/{share_id}/{file_id}/{basename}"

            file_size = 0

            async def stream_with_limit() -> AsyncIterator[bytes]:
                nonlocal file_size, total_size
                while True:
                    chunk = await f.read(1024 * 1024)
                    if not chunk:
                        break
                    chunk_len = len(chunk)
                    file_size += chunk_len
                    total_size += chunk_len
                    if total_size > self.settings.max_file_size_bytes:
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail="Combined file size too large. The maximum supported total size is 1 GB.",
                        )
                    yield chunk

            try:
                stored_key = await self.storage.upload(storage_key, stream_with_limit(), f.size or 0, mime_type)
            except HTTPException:
                raise
            except Exception:
                logger.exception("Storage upload failed")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Upload failed. Please try again later.",
                )

            sf = ShareFile(
                id=file_id,
                share_id=share_id,
                original_filename=orig_path,
                file_size=file_size,
                mime_type=mime_type,
                storage_key=stored_key,
            )
            share_files.append(sf)

        if len(file_list) == 1:
            main_filename = share_files[0].original_filename
            main_mime = share_files[0].mime_type
        else:
            first_name = os.path.basename(share_files[0].original_filename)
            base_first, _ = os.path.splitext(first_name)
            main_filename = f"{base_first}_and_{len(file_list) - 1}_more.zip"
            main_mime = "application/zip"

        code = generate_share_code()
        code_h = hash_code(code, self.settings.app_secret)
        now = datetime.now(UTC)
        expires_at = now + timedelta(hours=self.settings.file_expiration_hours)

        share = Share(
            share_id=share_id,
            code_hash=code_h,
            sender_email=sender_email.strip().lower(),
            original_filename=main_filename,
            file_size=total_size,
            mime_type=main_mime,
            storage_key=share_files[0].storage_key,
            status=ShareStatus.ACTIVE,
            expires_at=expires_at,
            files=share_files,
        )
        await self.repo.create(share)

        email_sent = await send_share_code_email(sender_email, code)

        return share, code, email_sent  # type: ignore[return-value]

    async def verify_code(self, code: str) -> dict:
        if not validate_code_format(code):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid code format.")

        code_h = hash_code(normalize_code(code), self.settings.app_secret)
        share = await self.repo.get_by_code_hash(code_h)

        if share is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid code")

        now = datetime.now(UTC)
        expires = share.expires_at if share.expires_at.tzinfo else share.expires_at.replace(tzinfo=UTC)

        if share.status == ShareStatus.EXPIRED or expires < now:
            share.status = ShareStatus.EXPIRED
            await self.session.flush()
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="This share has expired. The file is no longer available.",
            )

        if share.status not in (ShareStatus.ACTIVE, ShareStatus.CONSUMED):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid code")

        access_token = create_access_token(share.share_id)

        if share.files:
            file_items = [
                {
                    "id": str(sf.id),
                    "filename": sf.original_filename,
                    "size_bytes": sf.file_size,
                    "mime_type": sf.mime_type,
                    "can_preview": can_preview(sf.mime_type, sf.file_size, sf.original_filename),
                }
                for sf in share.files
            ]
        elif share.original_filename.endswith(".zip") or (share.mime_type and "zip" in share.mime_type):
            try:
                chunks = []
                async for chunk in self.storage.download(share.storage_key):
                    chunks.append(chunk)
                zip_bytes = b"".join(chunks)
                file_items = []
                with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as z:
                    for info in z.infolist():
                        if info.is_dir():
                            continue
                        fname = info.filename
                        guessed_mime, _ = mimetypes.guess_type(fname)
                        file_items.append({
                            "id": fname,
                            "filename": fname,
                            "size_bytes": info.file_size,
                            "mime_type": guessed_mime,
                            "can_preview": can_preview(guessed_mime, info.file_size, fname),
                        })
                if not file_items:
                    file_items = [
                        {
                            "id": str(share.share_id),
                            "filename": share.original_filename,
                            "size_bytes": share.file_size,
                            "mime_type": share.mime_type,
                            "can_preview": can_preview(share.mime_type, share.file_size, share.original_filename),
                        }
                    ]
            except Exception:
                logger.exception("Failed to inspect zip file for share %s", share.share_id)
                file_items = [
                    {
                        "id": str(share.share_id),
                        "filename": share.original_filename,
                        "size_bytes": share.file_size,
                        "mime_type": share.mime_type,
                        "can_preview": can_preview(share.mime_type, share.file_size, share.original_filename),
                    }
                ]
        else:
            file_items = [
                {
                    "id": str(share.share_id),
                    "filename": share.original_filename,
                    "size_bytes": share.file_size,
                    "mime_type": share.mime_type,
                    "can_preview": can_preview(share.mime_type, share.file_size, share.original_filename),
                }
            ]

        return {
            "access_token": access_token,
            "filename": share.original_filename,
            "size_bytes": share.file_size,
            "mime_type": share.mime_type,
            "expires_at": share.expires_at.isoformat(),
            "can_preview": any(f["can_preview"] for f in file_items),
            "files": file_items,
        }

    async def consume_and_get_share(self, share_id: uuid.UUID) -> Share:
        share = await self.repo.atomic_consume(share_id)

        if share is None:
            existing = await self.repo.get_by_share_id(share_id)
            now = datetime.now(UTC)
            if existing:
                expires = existing.expires_at.replace(tzinfo=UTC) if existing.expires_at.tzinfo is None else existing.expires_at
                if existing.status == ShareStatus.EXPIRED or expires < now:
                    raise HTTPException(
                        status_code=status.HTTP_410_GONE,
                        detail="This share has expired. The file is no longer available.",
                    )
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid code")

        return share

    async def stream_single_file(self, share: Share, file_id: str) -> tuple[AsyncIterator[bytes], str, str | None, int]:
        target_file: ShareFile | None = None
        for sf in share.files:
            if str(sf.id) == file_id:
                target_file = sf
                break

        if target_file is None:
            if not share.files and (share.original_filename.endswith(".zip") or (share.mime_type and "zip" in share.mime_type)):
                try:
                    chunks = []
                    async for chunk in self.storage.download(share.storage_key):
                        chunks.append(chunk)
                    zip_bytes = b"".join(chunks)
                    with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as z:
                        if file_id in z.namelist():
                            file_content = z.read(file_id)
                            guessed_mime, _ = mimetypes.guess_type(file_id)
                            basename = os.path.basename(file_id)
                            content_len = len(file_content)

                            async def zip_item_streamer() -> AsyncIterator[bytes]:
                                chunk_size = 1024 * 1024
                                for i in range(0, content_len, chunk_size):
                                    yield file_content[i : i + chunk_size]

                            return zip_item_streamer(), basename, guessed_mime, content_len
                except Exception:
                    logger.exception("Failed to extract item %s from zip for share %s", file_id, share.share_id)

            if str(share.share_id) == file_id or not share.files:
                return self.stream_file(share), os.path.basename(share.original_filename), share.mime_type, share.file_size
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found in this share.")

        filename = os.path.basename(target_file.original_filename)
        mime_type = target_file.mime_type
        size = target_file.file_size

        async def streamer() -> AsyncIterator[bytes]:
            try:
                async for chunk in self.storage.download(target_file.storage_key):
                    yield chunk
            except Exception:
                logger.exception("Storage download failed for share file %s", target_file.id)
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="We couldn't access this file right now. Please try again later.",
                )

        return streamer(), filename, mime_type, size

    async def stream_all_as_zip(self, share: Share) -> tuple[AsyncIterator[bytes], str, int]:
        zip_buffer = io.BytesIO()
        seen_filenames: dict[str, int] = {}

        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            files_to_zip = share.files if share.files else []
            if not files_to_zip:
                # Fallback for legacy single file share
                chunks = []
                async for chunk in self.storage.download(share.storage_key):
                    chunks.append(chunk)
                file_bytes = b"".join(chunks)
                zip_file.writestr(share.original_filename, file_bytes)
            else:
                for sf in files_to_zip:
                    chunks = []
                    async for chunk in self.storage.download(sf.storage_key):
                        chunks.append(chunk)
                    file_bytes = b"".join(chunks)
                    rel_name = sf.original_filename
                    if rel_name in seen_filenames:
                        seen_filenames[rel_name] += 1
                        base, ext = os.path.splitext(rel_name)
                        rel_name = f"{base}_{seen_filenames[rel_name]}{ext}"
                    else:
                        seen_filenames[rel_name] = 1
                    zip_file.writestr(rel_name, file_bytes)

        zip_bytes = zip_buffer.getvalue()
        zip_size = len(zip_bytes)

        if share.files and len(share.files) > 1:
            first_name = os.path.basename(share.files[0].original_filename)
            base_first, _ = os.path.splitext(first_name)
            zip_filename = f"{base_first}_and_{len(share.files) - 1}_more.zip"
        elif share.files and len(share.files) == 1:
            base, _ = os.path.splitext(os.path.basename(share.files[0].original_filename))
            zip_filename = f"{base}.zip"
        else:
            base, _ = os.path.splitext(os.path.basename(share.original_filename))
            zip_filename = f"{base}.zip"

        async def streamer() -> AsyncIterator[bytes]:
            chunk_size = 1024 * 1024
            for i in range(0, len(zip_bytes), chunk_size):
                yield zip_bytes[i : i + chunk_size]

        return streamer(), zip_filename, "application/zip", zip_size

    async def stream_file(self, share: Share) -> AsyncIterator[bytes]:
        try:
            async for chunk in self.storage.download(share.storage_key):
                yield chunk
        except Exception:
            logger.exception("Storage download failed for share %s", share.share_id)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="We couldn't access this file right now. Please try again later.",
            )

