import logging
from collections.abc import AsyncIterator
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Request, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import get_settings
from app.database import get_db
from app.schemas.share import (
    ConfigResponse,
    HealthResponse,
    ShareCreateResponse,
    VerifyCodeRequest,
    VerifyCodeResponse,
)
from app.security.rate_limit import (
    get_client_ip,
    get_redis,
    upload_limiter,
    verify_limiter,
    check_invalid_code_attempt,
)
from app.security.tokens import decode_access_token
from app.security.validation import can_preview
from app.services.share_service import ShareService
from app.storage import get_storage_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health():
    settings = get_settings()
    return HealthResponse(status="ok", app_name=settings.app_name)


@router.get("/config", response_model=ConfigResponse)
async def config():
    settings = get_settings()
    return ConfigResponse(
        app_name=settings.app_name,
        max_file_size_mb=settings.max_file_size_mb,
        file_expiration_hours=settings.file_expiration_hours,
        instagram_url=settings.instagram_url,
        x_url=settings.x_url,
        linkedin_url=settings.linkedin_url,
        github_url=settings.github_url,
        contact_email=settings.contact_email,
    )


@router.post("/shares", response_model=ShareCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_share(
    request: Request,
    files: list[UploadFile] = File(default=[]),
    file: UploadFile | None = File(default=None),
    email: str = Form(...),
    db: AsyncSession = Depends(get_db),
    redis_client=Depends(get_redis),
):
    ip = get_client_ip(request)
    await upload_limiter.check(redis_client, ip)

    upload_items: list[UploadFile] = []
    if files:
        upload_items.extend(files)
    elif file and file.filename:
        upload_items.append(file)

    if not upload_items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided.")

    storage = get_storage_service()
    service = ShareService(db, storage)
    share, code, email_sent = await service.create_share(
        upload_items if len(upload_items) > 1 else upload_items[0],
        email,
    )

    return ShareCreateResponse(
        code=code,
        filename=share.original_filename,
        size_bytes=share.file_size,
        expires_at=share.expires_at,
        email_sent=email_sent,
    )


@router.post("/shares/verify", response_model=VerifyCodeResponse)
async def verify_code(
    request: Request,
    body: VerifyCodeRequest,
    db: AsyncSession = Depends(get_db),
    redis_client=Depends(get_redis),
):
    ip = get_client_ip(request)
    await verify_limiter.check(redis_client, ip)

    storage = get_storage_service()
    service = ShareService(db, storage)

    try:
        result = await service.verify_code(body.code)
        return VerifyCodeResponse(**result)
    except HTTPException as e:
        if e.status_code in (404, 400):
            await check_invalid_code_attempt(redis_client, ip)
        raise


async def _stream_share(
    authorization: str | None,
    db: AsyncSession,
    inline: bool,
    file_id: str | None = None,
    download_all: bool = False,
) -> StreamingResponse:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")

    token = authorization[7:]
    share_id = decode_access_token(token)
    if share_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")

    storage = get_storage_service()
    service = ShareService(db, storage)
    share = await service.consume_and_get_share(share_id)

    if file_id:
        streamer, filename, mime_type, file_size = await service.stream_single_file(share, file_id)
    elif download_all or (share.files and len(share.files) > 1):
        streamer, filename, mime_type, file_size = await service.stream_all_as_zip(share)
    else:
        if share.files:
            streamer, filename, mime_type, file_size = await service.stream_single_file(share, str(share.files[0].id))
        else:
            streamer, filename, mime_type, file_size = service.stream_file(share), share.original_filename, share.mime_type, share.file_size

    if inline and not can_preview(mime_type, file_size, filename):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Preview not available for this file type.")

    safe_filename = quote(filename)
    disposition = "inline" if inline else "attachment"

    headers = {
        "Content-Disposition": f'{disposition}; filename="{safe_filename}"; filename*=UTF-8\'\'{safe_filename}',
    }
    if file_size:
        headers["Content-Length"] = str(file_size)

    return StreamingResponse(
        streamer,
        media_type=mime_type or "application/octet-stream",
        headers=headers,
    )


@router.get("/shares/access/download")
async def download_share(
    file_id: str | None = None,
    download_all: bool = False,
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
):
    return await _stream_share(authorization, db, inline=False, file_id=file_id, download_all=download_all)


@router.get("/shares/access/view")
async def view_share(
    file_id: str | None = None,
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
):
    return await _stream_share(authorization, db, inline=True, file_id=file_id)

