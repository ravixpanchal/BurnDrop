# BurnDrop Architecture

## Overview

BurnDrop follows a classic three-tier architecture: React frontend, FastAPI backend, and PostgreSQL + Redis for persistence and caching. File storage is abstracted behind a `StorageService` interface with Google Drive as the default implementation.

## Request Flows

### Upload Flow

```
Browser → POST /api/shares (multipart: file + email)
  → Rate limit check (Redis)
  → Validate email, file size
  → Stream file → StorageService.upload() → Google Drive
  → Generate secure code (secrets module)
  → Hash code (HMAC-SHA256 + APP_SECRET)
  → Save metadata to PostgreSQL (status: ACTIVE)
  → Send email via SMTP
  → Return code to frontend
```

### Retrieval Flow

```
Browser → POST /api/shares/verify { code }
  → Rate limit check
  → Hash input code → lookup in PostgreSQL
  → Check status (ACTIVE), expiration
  → Return JWT access token (15 min) + file metadata

Browser → GET /api/shares/access/download (Bearer JWT)
  → Decode JWT → share_id
  → BEGIN TRANSACTION
  → SELECT ... FOR UPDATE WHERE share_id AND status=ACTIVE
  → UPDATE status=CONSUMED
  → COMMIT
  → Stream file from StorageService → Browser
```

### Cleanup Flow

```
Cleanup Worker (every 5 min)
  → Find shares WHERE expires_at < NOW()
  → Mark EXPIRED
  → StorageService.delete() for each
  → Mark DELETED in PostgreSQL
```

## Database Schema

```sql
shares (
  id              UUID PRIMARY KEY
  share_id        UUID UNIQUE
  code_hash       VARCHAR(128) UNIQUE
  sender_email    VARCHAR(320)
  original_filename VARCHAR(512)
  file_size       BIGINT
  mime_type       VARCHAR(255)
  storage_key     VARCHAR(512)    -- internal only
  status          ENUM(ACTIVE, CONSUMED, EXPIRED, DELETED)
  created_at      TIMESTAMPTZ
  expires_at      TIMESTAMPTZ
  consumed_at     TIMESTAMPTZ
  deleted_at      TIMESTAMPTZ
)
```

## Storage Abstraction

```
StorageService (ABC)
├── LocalStorageService     ← dev/test
├── GoogleDriveStorageService ← production default
└── (future: S3, R2, Azure Blob, MinIO)
```

All business logic depends on `StorageService`, never on Google Drive directly.

## Security Layers

1. **Code hashing** — plaintext codes never stored
2. **JWT access tokens** — short-lived, post-verification
3. **Atomic consumption** — PostgreSQL row locking
4. **Rate limiting** — Redis sliding window
5. **Security headers** — CSP, X-Frame-Options, etc.
6. **Input validation** — email, filename, code format, file size
7. **Safe preview** — whitelist MIME types only

## Concurrency Model

One-time redemption uses pessimistic locking:

```python
async with session.begin():
    share = await session.execute(
        select(Share).where(...).with_for_update()
    )
    if share.status != ACTIVE or expired:
        return None
    share.status = CONSUMED
```

Two simultaneous download requests: exactly one succeeds.

## Configuration

All secrets and service endpoints are loaded from environment variables via Pydantic Settings. The application name, social links, and file limits are all configurable without code changes.
