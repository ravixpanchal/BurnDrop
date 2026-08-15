"""Add share_files table

Revision ID: 002
Revises: 001
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "share_files",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "share_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("shares.share_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("original_filename", sa.String(512), nullable=False),
        sa.Column("file_size", sa.BigInteger(), nullable=False),
        sa.Column("mime_type", sa.String(255), nullable=True),
        sa.Column("storage_key", sa.String(512), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_share_files_share_id", "share_files", ["share_id"])


def downgrade() -> None:
    op.drop_table("share_files")
