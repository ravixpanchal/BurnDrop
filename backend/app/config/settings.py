"""Application configuration loaded from environment variables."""

from functools import lru_cache

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

_BASE_DIR = Path(__file__).resolve().parent.parent.parent
_ROOT_DIR = _BASE_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(
            str(_ROOT_DIR / ".env"),
            str(_BASE_DIR / ".env"),
            ".env",
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "BurnDrop"
    app_base_url: str = "http://localhost:3000"
    api_base_url: str = "http://localhost:8000"
    app_secret: str = "change-me-to-a-long-random-secret"

    database_url: str = "postgresql+asyncpg://burndrop:burndrop@localhost:5432/burndrop"
    redis_url: str = "redis://localhost:6379/0"

    max_file_size_mb: int = 1024
    file_expiration_hours: int = 3
    access_token_expire_minutes: int = 15

    google_drive_folder_id: str = "1Q-g7HQtJRIiyoUAiiRRcZxPLy9ZtijP8"
    google_client_id: str = ""
    google_client_secret: str = ""
    google_refresh_token: str = ""
    storage_backend: str = "local"

    email_from: str = "ravi.panchal.kaithi@gmail.com"
    email_username: str = "ravi.panchal.kaithi@gmail.com"
    email_password: str = ""
    email_smtp_host: str = "smtp.gmail.com"
    email_smtp_port: int = 587

    instagram_url: str = ""
    x_url: str = ""
    linkedin_url: str = ""
    github_url: str = ""
    contact_email: str = "ravi.panchal.kaithi@gmail.com"

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
