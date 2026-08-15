import enum
import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class ShareStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    CONSUMED = "CONSUMED"
    EXPIRED = "EXPIRED"
    DELETED = "DELETED"


class Share(Base):
    __tablename__ = "shares"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    share_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    code_hash: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    sender_email: Mapped[str] = mapped_column(String(320), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False)
    status: Mapped[ShareStatus] = mapped_column(
        Enum(ShareStatus, name="share_status", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ShareStatus.ACTIVE,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    files: Mapped[list["ShareFile"]] = relationship(
        "ShareFile", back_populates="share", cascade="all, delete-orphan", lazy="selectin"
    )


class ShareFile(Base):
    __tablename__ = "share_files"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    share_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("shares.share_id", ondelete="CASCADE"), nullable=False, index=True
    )
    original_filename: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    share: Mapped[Share] = relationship("Share", back_populates="files")

