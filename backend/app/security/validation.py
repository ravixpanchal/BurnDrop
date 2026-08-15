"""Input validation and sanitization utilities."""

import re
from pathlib import PurePath

EMAIL_PATTERN = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")


def validate_email(email: str) -> bool:
    if not email or len(email) > 320:
        return False
    return EMAIL_PATTERN.match(email.strip()) is not None


def sanitize_filename(filename: str) -> str:
    """Remove path components and dangerous characters from filename."""
    name = PurePath(filename).name
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", name)
    name = name.strip(". ")
    if not name or name in (".", ".."):
        return "file"
    return name[:512]


PREVIEWABLE_EXTENSIONS = frozenset(
    {
        "jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico",
        "pdf", "txt", "json", "csv", "md", "py", "js", "ts", "jsx", "tsx",
        "html", "css", "xml", "log", "yaml", "yml", "sh", "c", "cpp", "h",
        "java", "rs", "go", "sql",
    }
)

MAX_PREVIEW_SIZE = 50 * 1024 * 1024  # 50 MB for preview


def can_preview(mime_type: str | None, file_size: int, filename: str | None = None) -> bool:
    if file_size > MAX_PREVIEW_SIZE:
        return False
    if mime_type:
        mime = mime_type.lower()
        if (
            mime.startswith("image/")
            or mime.startswith("text/")
            or mime in ("application/pdf", "application/json", "application/xml", "application/javascript")
        ):
            return True
    if filename:
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext in PREVIEWABLE_EXTENSIONS:
            return True
    return False

