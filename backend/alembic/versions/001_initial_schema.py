"""Initial schema

Revision ID: 001
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    share_status = postgresql.ENUM("ACTIVE", "CONSUMED", "EXPIRED", "DELETED", name="share_status", create_type=True)
    share_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "shares",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("share_id", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("code_hash", sa.String(128), nullable=False, unique=True),
        sa.Column("sender_email", sa.String(320), nullable=False),
        sa.Column("original_filename", sa.String(512), nullable=False),
        sa.Column("file_size", sa.BigInteger(), nullable=False),
        sa.Column("mime_type", sa.String(255), nullable=True),
        sa.Column("storage_key", sa.String(512), nullable=False),
        sa.Column("status", share_status, nullable=False, server_default="ACTIVE"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_shares_code_hash", "shares", ["code_hash"])
    op.create_index("ix_shares_status", "shares", ["status"])
    op.create_index("ix_shares_expires_at", "shares", ["expires_at"])


def downgrade() -> None:
    op.drop_table("shares")
    op.execute("DROP TYPE IF EXISTS share_status")
