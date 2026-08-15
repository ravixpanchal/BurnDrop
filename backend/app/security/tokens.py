"""JWT access tokens for post-verification file access."""

from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt

from app.config.settings import get_settings


def create_access_token(share_id: UUID) -> str:
    settings = get_settings()
    payload = {
        "sub": str(share_id),
        "type": "share_access",
        "exp": datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes),
        "iat": datetime.now(UTC),
    }
    return jwt.encode(payload, settings.app_secret, algorithm="HS256")


def decode_access_token(token: str) -> UUID | None:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.app_secret, algorithms=["HS256"])
        if payload.get("type") != "share_access":
            return None
        return UUID(payload["sub"])
    except (jwt.PyJWTError, ValueError, KeyError):
        return None
