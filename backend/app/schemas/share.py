from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class ShareCreateResponse(BaseModel):
    code: str
    filename: str
    size_bytes: int
    expires_at: datetime
    email_sent: bool


class VerifyCodeRequest(BaseModel):
    code: str = Field(..., min_length=8, max_length=12)


class ShareFileItem(BaseModel):
    id: str
    filename: str
    size_bytes: int
    mime_type: str | None
    can_preview: bool


class VerifyCodeResponse(BaseModel):
    access_token: str
    filename: str
    size_bytes: int
    mime_type: str | None
    expires_at: str
    can_preview: bool
    files: list[ShareFileItem] = []


class HealthResponse(BaseModel):
    status: str
    app_name: str


class ConfigResponse(BaseModel):
    app_name: str
    max_file_size_mb: int
    file_expiration_hours: int
    instagram_url: str
    x_url: str
    linkedin_url: str
    github_url: str
    contact_email: str


class DirectUploadFileMeta(BaseModel):
    filename: str
    size_bytes: int
    mime_type: str | None = None


class PresignedUploadRequest(BaseModel):
    email: EmailStr
    files: list[DirectUploadFileMeta]


class PresignedUploadItem(BaseModel):
    file_id: str
    filename: str
    size_bytes: int
    mime_type: str | None
    storage_key: str
    upload_url: str


class PresignedUploadResponse(BaseModel):
    direct_upload_supported: bool
    share_id: str
    email: str
    upload_urls: list[PresignedUploadItem] = []


class CompleteDirectUploadItem(BaseModel):
    file_id: str
    filename: str
    size_bytes: int
    mime_type: str | None = None
    storage_key: str


class CompleteDirectUploadRequest(BaseModel):
    share_id: str
    email: EmailStr
    files: list[CompleteDirectUploadItem]

