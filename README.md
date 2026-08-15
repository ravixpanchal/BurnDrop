# BurnDrop

**Share once. Keep it temporary.**

BurnDrop is an open-source, passwordless, one-time temporary file sharing platform. Upload a file up to 1 GB, receive a secure one-time code, share it anywhere — no account required.

## Features

- No signup, login, or user accounts
- Upload single or multiple files up to 1 GB total (any file type)
- Bundle multi-file uploads into single-click .ZIP archive downloads
- Cryptographically secure one-time codes (e.g. `K7X9-P2LM`)
- Email delivery of sharing codes
- Single-use or multi-file access with race-condition protection
- Automatic expiration after 3 hours
- Automatic file deletion via background cleanup
- Safe inline preview for PDF, images, and plain text
- Streaming upload and download (no full 1 GB RAM load)
- Rate limiting for abuse protection
- Storage abstraction (Google Drive default, extensible)
- Modern, responsive web UI with prominent Download & Receive File CTA buttons
- Docker Compose for local development

## Architecture

```
                         USER
                          │
                          ▼
                 ┌──────────────────┐
                 │    Next.js UI    │
                 │ React + TypeScript│
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │    FastAPI       │
                 │    Backend       │
                 └───────┬──────────┘
                         │
           ┌─────────────┼──────────────┐
           │             │              │
           ▼             ▼              ▼
     PostgreSQL        Redis       Email (SMTP)
           │             │              │
           └─────────────┼──────────────┘
                         │
                         ▼
                 StorageService
                         │
                         ▼
                  Google Drive
```

See [docs/architecture.md](docs/architecture.md) for details.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | Python 3.12+, FastAPI, Pydantic |
| Database | PostgreSQL 16, SQLAlchemy, Alembic |
| Cache | Redis 7 |
| Storage | Google Drive (via abstraction layer) |
| Email | Gmail SMTP (aiosmtplib) |

---

## 🚀 Quick Start: How to Run the Website

You can run the website either using **Docker Compose** (recommended — starts all services with one command) or **Manually** (running backend and frontend separately).

---

### Option 1 — Run with Docker Compose (Recommended)

This is the fastest way to start the website including PostgreSQL, Redis, Backend API, and Frontend UI.

#### 1. Clone & Configure
```bash
cp .env.example .env
```
*(Optionally edit `.env` to configure social media links, email, or Google Drive).*

#### 2. Start Services
```bash
docker-compose up --build
```
*(Or `docker compose up --build` if using Docker Compose v2 plugin)*

To run in the background (detached mode):
```bash
docker-compose up --build -d
```

#### 3. Open the Website
- 🌐 **Website Frontend**: [http://localhost:3000](http://localhost:3000)
- ⚡ **Backend API**: [http://localhost:8000](http://localhost:8000)
- 📄 **Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- 🔑 **Retrieve File Page**: [http://localhost:3000/retrieve](http://localhost:3000/retrieve)

To stop all services:
```bash
docker-compose down
```

---

### Option 2 — Run Manually (Local Development)

#### Step 1 — Start Databases (PostgreSQL + Redis)
```bash
docker-compose up postgres redis -d
```
*(Alternatively, use local PostgreSQL & Redis services if installed).*

#### Step 2 — Start Backend API
Open terminal 1:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend runs at **http://localhost:8000**.

#### Step 3 — Start Frontend Website
Open terminal 2:
```bash
cd frontend
npm install
npm run dev
```
Website runs at **http://localhost:3000**.

---

### Prerequisites

| Requirement | Recommended Version | Notes |
|-------------|---------------------|-------|
| Docker | 20+ | Recommended for full stack setup |
| Docker Compose | v1 or v2 | See Docker notes below |
| Node.js | 20+ | Required for manual frontend setup |
| Python | 3.12+ | Required for manual backend setup |

---

### Step 4 — Test the application

1. Open http://localhost:3000
2. Click **Choose Files** to select one or multiple test files
3. Enter your recipient email address
4. Click **Generate One-Time Code**
5. Copy the one-time code shown on screen (e.g. `K7X9-P2LM`)
6. Click the prominent **Download / Receive File** header button or **Download Files Here →** homepage CTA
7. Enter your code and click **Unlock & Download Files**
8. View or download individual files, or click **Download All Files (.zip)** to save a bundled archive

---

## Docker Notes

| Issue | Solution |
|-------|----------|
| `unknown flag: --build` or `unknown shorthand flag: 'd'` | Use `docker-compose` (with hyphen) instead of `docker compose` |
| `permission denied` on docker.sock | Run `sudo usermod -aG docker $USER` then log out/in |
| Port 5432 already in use | Run `sudo systemctl stop postgresql` before starting Docker |
| Backend can't connect to database | Run `docker-compose down && docker-compose up -d` to recreate the network |
| Backend crashed on first start | Run `docker-compose restart backend` — startup retries are built in |
| Website loads but upload fails | Backend may be down — check `docker-compose logs backend` |

### Services started by Docker Compose

| Container | Port | Purpose |
|-----------|------|---------|
| `postgres` | 5432 | Share metadata database |
| `redis` | 6379 | Rate limiting |
| `backend` | 8000 | FastAPI REST API |
| `frontend` | 3000 | Next.js website |

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `APP_NAME` | Application name (default: BurnDrop) |
| `APP_BASE_URL` | Frontend URL for email links |
| `APP_SECRET` | Secret for code hashing and JWT signing |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `MAX_FILE_SIZE_MB` | Max upload size (default: 1024) |
| `FILE_EXPIRATION_HOURS` | Share lifetime (default: 3) |
| `STORAGE_BACKEND` | `google_drive` or `local` |
| `GOOGLE_DRIVE_FOLDER_ID` | Target Google Drive folder |
| `GOOGLE_CLIENT_ID` | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret |
| `GOOGLE_REFRESH_TOKEN` | OAuth refresh token |
| `EMAIL_FROM` | Sender email address |
| `EMAIL_USERNAME` | SMTP username |
| `EMAIL_PASSWORD` | Gmail App Password (never commit!) |

> When using Docker, `DATABASE_URL` and `REDIS_URL` in `docker-compose.yml` override `.env` automatically — you do not need to change them.

---

## Google Drive Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the **Google Drive API**
3. Create **OAuth 2.0 credentials** (Web application)
4. Add this **Authorized redirect URI**:

   ```
   https://developers.google.com/oauthplayground
   ```

5. Open [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
6. Click the gear icon → enable **Use your own OAuth credentials**
7. Enter your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
8. Select scope: `https://www.googleapis.com/auth/drive.file`
9. Click **Authorize APIs** → **Exchange authorization code for tokens**
10. Copy the **Refresh token** into `.env` as `GOOGLE_REFRESH_TOKEN`
11. Share the target folder (`1Q-g7HQtJRIiyoUAiiRRcZxPLy9ZtijP8`) with your Google account — keep it **private**

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
GOOGLE_DRIVE_FOLDER_ID=1Q-g7HQtJRIiyoUAiiRRcZxPLy9ZtijP8
STORAGE_BACKEND=google_drive
```

> The frontend never exposes Google Drive URLs, file IDs, or credentials.

---

## Email Setup (Gmail)

1. Enable 2-Factor Authentication on your Google account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Configure in `.env`:

```env
EMAIL_FROM=ravi.panchal.kaithi@gmail.com
EMAIL_USERNAME=ravi.panchal.kaithi@gmail.com
EMAIL_PASSWORD=your-app-password
```

> Never commit `.env` or place passwords in source code. Uploads work even if email delivery fails — the code is always shown on screen.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/config` | Public app configuration |
| POST | `/api/shares` | Upload file + create share |
| POST | `/api/shares/verify` | Verify one-time code |
| GET | `/api/shares/access/download` | Download file (consumes code) |
| GET | `/api/shares/access/view` | Preview file (consumes code) |

---

## Security Model

- **One-time codes** are generated with `secrets` module (~40 bits entropy)
- **Codes are hashed** (HMAC-SHA256) before database storage — plaintext never stored
- **Atomic consumption** via PostgreSQL `SELECT ... FOR UPDATE`
- **Rate limiting** via Redis (uploads, verification, invalid attempts)
- **No storage provider leakage** — all file access proxied through backend
- **Security headers** on all responses (CSP, X-Frame-Options, etc.)
- **Untrusted file handling** — no execution, safe preview whitelist only

Access to a shared file requires possession of its valid one-time code. The code is a bearer credential — if you share it with someone else, they may access your file.

---

## Testing

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. pytest -v
```

Tests cover:
- Code generation entropy and format
- Expiration enforcement
- One-time use and race conditions
- File size limits
- Storage upload/download/delete
- Email content (no real SMTP in tests)
- User data isolation

---

## Adding a Storage Provider

Implement the `StorageService` abstract class in `backend/app/storage/`:

```python
class StorageService(ABC):
    async def upload(self, key, stream, size, mime_type) -> str: ...
    async def download(self, key) -> AsyncIterator[bytes]: ...
    async def delete(self, key) -> bool: ...
    async def exists(self, key) -> bool: ...
    async def get_metadata(self, key) -> StorageMetadata | None: ...
```

Register your implementation in `get_storage_service()` and set `STORAGE_BACKEND` in `.env`.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `Connection refused` on backend startup | PostgreSQL/Redis not running | Start with Docker or install locally |
| `pip install` fails on Python 3.14 | Old pinned pydantic has no wheel | Use updated `requirements.txt` (pydantic >= 2.11) |
| Frontend loads, upload fails | Backend container down | `docker-compose restart backend` |
| Email not received | Gmail App Password not set | Set `EMAIL_PASSWORD` in `.env` — code still shown on screen |
| Google Drive upload fails | Invalid refresh token or folder not shared | Re-generate token via OAuth Playground |
| `docker compose` commands fail | Compose plugin not installed | Use `docker-compose` (with hyphen) |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md) for responsible disclosure.

## License

MIT License — see [LICENSE](LICENSE).

## Roadmap

- [ ] AWS S3 / Cloudflare R2 storage backends
- [ ] Password-protected shares
- [ ] Custom expiration times
- [ ] QR code generation
- [ ] Resumable downloads
- [ ] CAPTCHA for upload abuse prevention
- [ ] PWA support

---

Made with ♥ by Ravi Panchal. All rights reserved @2026.
