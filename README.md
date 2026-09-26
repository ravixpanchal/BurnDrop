# BurnDrop

**Share once. Keep it temporary.**

BurnDrop is an open-source, passwordless, one-time temporary file sharing platform. Upload single or multiple files up to 1 GB total, receive a secure one-time PIN code, share it anywhere — no account required.

🌐 **Live Website**: [https://www.burn-drop.tech](https://www.burn-drop.tech)

---

## ✨ Features

- **No Signup or User Accounts**: Start uploading immediately without logging in.
- **Single & Multi-File Support**: Upload multiple files up to 1 GB total in a single batch.
- **AWS S3 Cloud Storage Integration**: Enterprise-grade cloud storage backend using Python `boto3` with streaming chunked uploads.
- **Automatic ZIP Bundling**: Multi-file shares are automatically bundled into single-click `.ZIP` archive downloads.
- **100% Responsive Design**: Optimized for mobile phones (320px+), tablets, laptops, and 4K displays with touch-friendly controls.
- **Cryptographically Secure PIN Codes**: High-entropy 8-character one-time codes (e.g. `K7X9-P2LM`).
- **Instant Email Delivery**: Sends PIN codes directly to recipients with Gmail, SMTP, Resend, SendGrid, or Brevo API drivers.
- **Spam Alert Notices**: Built-in visual reminders for users to check spam/junk folders.
- **Single-Use Access & Expiration**: Codes expire automatically after 3 hours and feature atomic race-condition protection.
- **Automatic File Deletion**: Background worker automatically purges expired files permanently from AWS S3 or storage.
- **Safe Inline Preview**: View PDFs, images, and plain text securely in the browser without downloading.
- **Streaming Uploads & Downloads**: Efficient chunked streaming ensures low RAM footprint even for 1 GB files.
- **Rate Limiting**: Built-in Redis protection against abuse and brute-force attempts.
- **Modular Storage Abstraction**: Extensible storage driver layer (AWS S3, Google Drive, Local Storage).
- **Docker Compose Setup**: Quick one-command setup for development and production.

---

## 🏗️ Architecture

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
     PostgreSQL        Redis       Email (SMTP/API)
           │             │              │
           └─────────────┼──────────────┘
                         │
                         ▼
                 StorageService (Strategy Pattern)
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
         AWS S3     Google Drive    Local
```

For detailed architectural diagrams and data flows, see [docs/architecture.md](docs/architecture.md).

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
|-------|------------|-------------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS | Responsive UI & client-side stream handling |
| **Backend** | Python 3.12+, FastAPI, Pydantic v2 | High-performance async REST API |
| **Database** | PostgreSQL 16, SQLAlchemy 2.0, Alembic | Metadata storage & transaction locks |
| **Cache & Rate Limiting** | Redis 7 | Distributed rate limiting & session state |
| **Storage Engine** | **AWS S3** / Google Drive API / Local | Swappable cloud object storage drivers (`boto3`) |
| **Email Delivery** | Gmail API, SMTP, Resend, SendGrid, Brevo | Multi-driver email notification system |

---

## 🚀 Quick Start: How to Run the Website

You can start BurnDrop using either **Docker Compose** (recommended for full stack setup) or **Manually** (for local frontend/backend development).

---

### Option 1 — Run with Docker Compose (Recommended)

Starts PostgreSQL, Redis, Backend FastAPI service, and Frontend Next.js app in unified containers.

#### 1. Clone & Configure Environment
```bash
cp .env.example .env
```
*(Edit `.env` to configure your AWS S3 bucket credentials or preferred storage backend).*

#### 2. Build & Launch Containers
```bash
docker-compose up --build
```
*(Or `docker compose up --build` for Docker Compose v2)*

To run in detached (background) mode:
```bash
docker-compose up --build -d
```

#### 3. Access the Application
- 🌐 **Website Frontend**: [http://localhost:3000](http://localhost:3000)
- 🔑 **Receive File Page**: [http://localhost:3000/retrieve](http://localhost:3000/retrieve)
- ⚡ **Backend API**: [http://localhost:8000](http://localhost:8000)
- 📄 **Interactive Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

To stop all services cleanly:
```bash
docker-compose down
```

---

### Option 2 — Run Manually (Local Development)

#### Step 1 — Start Databases (PostgreSQL + Redis)
```bash
docker-compose up postgres redis -d
```

#### Step 2 — Start Backend API
Open **Terminal 1**:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend runs at **http://localhost:8000**.

#### Step 3 — Start Frontend Website
Open **Terminal 2**:
```bash
cd frontend
npm install
npm run dev
```
Website runs at **http://localhost:3000**.

---

## ☁️ Cloud Storage Driver Configuration

BurnDrop supports three storage backends configured via `STORAGE_BACKEND` in `.env`:

### 1. AWS S3 Storage (`STORAGE_BACKEND=s3`) — Recommended
```env
STORAGE_BACKEND=s3
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=eu-north-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name
```

### 2. Local Filesystem (`STORAGE_BACKEND=local`)
```env
STORAGE_BACKEND=local
LOCAL_STORAGE_PATH=storage
```

### 3. Google Drive (`STORAGE_BACKEND=google_drive`)
```env
STORAGE_BACKEND=google_drive
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
```

---

## ✉️ Email Driver Configuration

Configure `EMAIL_SERVICE` in your `.env` file depending on your preferred email provider:

### 1. Gmail API (`EMAIL_SERVICE=gmail`)
Recommended for deployments on cloud providers (such as Render) that block outbound SMTP ports 587/465.
```env
EMAIL_SERVICE=gmail
EMAIL_FROM=your-gmail-address@gmail.com
```

### 2. Resend (`EMAIL_SERVICE=resend`)
HTTP API delivery for custom domain names.
```env
EMAIL_SERVICE=resend
EMAIL_FROM=noreply@yourdomain.com
RESEND_API_KEY=re_your_api_key
```

### 3. SendGrid (`EMAIL_SERVICE=sendgrid`)
```env
EMAIL_SERVICE=sendgrid
EMAIL_FROM=noreply@yourdomain.com
SENDGRID_API_KEY=your_sendgrid_api_key
```

### 4. Brevo (`EMAIL_SERVICE=brevo`)
```env
EMAIL_SERVICE=brevo
EMAIL_FROM=noreply@yourdomain.com
BREVO_API_KEY=your_brevo_api_key
```

### 5. Standard SMTP (`EMAIL_SERVICE=smtp`)
```env
EMAIL_SERVICE=smtp
EMAIL_FROM=your-email@gmail.com
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
```

---

## 🔑 Security Model

- **HMAC-SHA256 Code Hashing**: Plaintext PIN codes are never stored in the database.
- **Atomic Single-Use Locking**: Prevents concurrent race conditions via PostgreSQL `SELECT ... FOR UPDATE`.
- **Redis Rate Limiting**: Enforces request caps on upload, PIN verification, and invalid code attempts.
- **Safe Previews Only**: Strictly restricts inline viewing to safe MIME types (images, PDF, plain text).
- **Automated S3 Purging**: Background cleanup loop automatically deletes expired payloads from AWS S3.

---

## 🧪 Running Tests

Run backend unit and storage tests:
```bash
cd backend
source venv/bin/activate
PYTHONPATH=. pytest -v
```

---

## 👨‍💻 Connect with the Author

Created with ❤️ by **Ravi Panchal**

- 🌐 **Live Website**: [https://www.burn-drop.tech](https://www.burn-drop.tech)
- 🐙 **GitHub**: [@ravixpanchal](https://github.com/ravixpanchal)
- 💼 **LinkedIn**: [Ravi Panchal](https://linkedin.com/in/ravixpanchal)
- 📸 **Instagram**: [@ravixpanchal](https://instagram.com/ravixpanchal)
- 🐦 **X (Twitter)**: [@ravixpanchal](https://x.com/ravixpanchal)

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
