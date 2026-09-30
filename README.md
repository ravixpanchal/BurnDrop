# BurnDrop

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.12%2B-blue?logo=python)
![Next.js](https://img.shields.io/badge/next.js-14.0-black?logo=nextdotjs)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?logo=fastapi)
![Docker](https://img.shields.io/badge/docker-compose-2496ED?logo=docker)
![PostgreSQL](https://img.shields.io/badge/postgresql-16-4169E1?logo=postgresql)
![Redis](https://img.shields.io/badge/redis-7.0-DC382D?logo=redis)

**Share once. Keep it temporary.**

*BurnDrop is an open-source, passwordless, multi-file temporary sharing platform with self-destructing PIN access, chunked streaming, and multi-driver cloud storage.*

[Features](#-features) • [Directory Structure](#-directory-structure) • [Architecture](#%EF%B8%8F-architecture) • [Tech Stack](#%EF%B8%8F-tech-stack) • [Quick Start](#-quick-start-how-to-run) • [API Reference](#-api-reference) • [Environment Variables](#%EF%B8%8F-environment-variables) • [Security](#-security-model)

</div>

---

## ✨ Features

- **🔒 Zero-Signup Temporary Sharing**: Start uploading instantly without user accounts or password registration.
- **📁 Multi-File Upload & ZIP Bundling**: Upload single files or batches up to 1 GB total. Multi-file shares are automatically streamed as single-click `.ZIP` archives.
- **⚡ High-Speed Direct-to-Cloud S3 Uploads**: Support for AWS S3 Presigned URLs allows browser clients to upload files directly to cloud storage, boosting transfer speeds up to 5x while eliminating server RAM bottlenecks.
- **🔑 Cryptographically Secure One-Time PINs**: High-entropy 8-character codes (e.g. `K7X9-P2LM`) hashed via HMAC-SHA256.
- **📩 Multi-Driver Email Dispatch**: Deliver access codes instantly using **Gmail API**, **SMTP**, **Resend**, **SendGrid**, or **Brevo**.
- **🔍 Safe Inline Browser Previews**: Securely inspect PDFs, images, and plain text without executing scripts or downloading files.
- **⚡ Low-Memory Chunked Streaming & Non-Blocking Drivers**: Memory-efficient streaming pipelines and threaded storage workers handle multi-gigabyte transfers with zero event-loop stalls.
- **⏱️ Automatic Expiration & Destruction**: Shares auto-expire after 3 hours (configurable). A background worker thread purges files from storage automatically.
- **🛡️ Brute-Force & Abuse Protection**: Redis-backed sliding window rate limiters protect upload routes, verification attempts, and IP failure thresholds.
- **☁️ Multi-Provider Storage Drivers**: Seamless abstraction supporting **Local Filesystem**, **AWS S3 (Direct & Proxied)**, and **Google Drive API**.
- **📱 Fluid Responsive UI**: Fully responsive UI tailored for mobile screens (320px+), tablets, laptops, and 4K displays.

---

## 📁 Directory Structure

```gfm
BurnDrop/
├── backend/                  # FastAPI Application
│   ├── alembic/              # Database schema migrations
│   ├── app/
│   │   ├── api/              # API routers and endpoints
│   │   ├── config/           # Pydantic environment configurations
│   │   ├── models/           # SQLAlchemy ORM database models
│   │   ├── repositories/     # Database CRUD access layer
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── security/         # HMAC hashing, rate limiters, JWT tokens
│   │   ├── services/         # Business logic & ZIP stream builders
│   │   ├── storage/          # Storage abstraction drivers (Local, AWS S3, Google Drive)
│   │   └── workers/          # Background file cleanup worker thread
│   ├── tests/                # Pytest unit & integration test suite
│   ├── Dockerfile            # Container build specification for backend
│   └── requirements.txt      # Python dependencies
├── frontend/                 # Next.js 14 App Router UI
│   ├── public/               # Static assets & icons
│   ├── src/
│   │   ├── app/              # Next.js pages & layout routes
│   │   ├── components/       # Reusable React components & previewers
│   │   └── lib/              # API clients & utility functions
│   └── Dockerfile            # Container build specification for frontend
├── docs/                     # Architectural specs & technical documentation
├── storage/                  # Local storage mount directory (development)
├── docker-compose.yml        # Docker orchestration (Postgres, Redis, Backend, Frontend)
└── README.md                 # Project documentation
```

---

## 🏗️ Architecture

```
                               USER / BROWSER
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
                 ▼ (Direct Presigned S3 Upload)          ▼
        ┌──────────────────┐                   ┌──────────────────┐
        │   AWS S3 Bucket  │                   │    Next.js 14    │
        │ (Direct Storage) │                   │ React + TypeScript│
        └────────┬─────────┘                   └─────────┬────────┘
                 ▲                                       │
                 │ (Get Signed URL / Complete)           ▼
                 │                             ┌──────────────────┐
                 └─────────────────────────────┤     FastAPI      │
                                               │  Async Python API│
                                               └─────────┬────────┘
                                                         │
                      ┌──────────────────────────────────┼──────────────────────────────────┐
                      │                                  │                                  │
                      ▼                                  ▼                                  ▼
                PostgreSQL 16                         Redis 7                         Email Drivers
            (Metadata & Row Locks)                 (Rate Limits)                  (Gmail / SMTP / Resend)
                      │                                  │                                  │
                      └──────────────────────────────────┼──────────────────────────────────┘
                                                         │
                                                         ▼
                                              StorageService Engine
                                                         │
                      ┌──────────────────────────────────┴──────────────────────────────────┐
                      ▼                                                                     ▼
               AWS S3 Storage                                                      Local Disk / Drive
```

For detailed data flow diagrams and sequence charts, see [docs/architecture.md](docs/architecture.md).

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
|-------|------------|-------------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS | Responsive UI, client streaming, and glassmorphism styling |
| **Backend** | Python 3.12+, FastAPI, Pydantic v2 | Asynchronous REST API framework |
| **Database** | PostgreSQL 16, SQLAlchemy 2.0 (Async), Alembic | Relational database with atomic `SELECT ... FOR UPDATE` locks |
| **Cache & Rate Limit** | Redis 7 | Distributed sliding-window rate limiters & session guards |
| **Storage Engines** | AWS S3, Google Drive API, Local Storage | Extensible plug-and-play storage provider architecture |
| **Email Drivers** | Gmail API, SMTP, Resend, SendGrid, Brevo | Multi-provider email notification engine |
| **DevOps** | Docker, Docker Compose | Unified multi-container orchestration |

---

## 🚀 How do we run this project

You can run BurnDrop either with **Docker Compose** (recommended) or **Manually** for local development.

> **⚠️ IMPORTANT:** The project is split into `frontend` and `backend` directories. When running manually, ensure you change into the correct directory first (`cd backend` or `cd frontend`) before running the respective commands!

---

### Option 1 — Run with Docker Compose (Recommended)

Starts PostgreSQL, Redis, FastAPI Backend, and Next.js Frontend in isolated containers with a single command.

#### 1. Clone & Configure Environment
```bash
git clone https://github.com/ravixpanchal/BurnDrop.git
cd BurnDrop
cp .env.example .env
```

#### 2. Launch Services
```bash
docker-compose up --build -d
```
*(Or `docker compose up --build -d` for Docker Compose v2)*

#### 3. Access App URLs
- 🌐 **Web Frontend**: [http://localhost:3000](http://localhost:3000)
- 🔑 **Receive / Retrieve File**: [http://localhost:3000/retrieve](http://localhost:3000/retrieve)
- ⚡ **Backend API**: [http://localhost:8000](http://localhost:8000)
- 📄 **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

To view logs or stop containers:
```bash
# View live logs
docker-compose logs -f

# Stop containers
docker-compose down
```

---

### Option 2 — Run Manually (Local Development)

#### Step 1: Start PostgreSQL & Redis
```bash
docker-compose up postgres redis -d
```

#### Step 2: Start FastAPI Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend runs at **http://localhost:8000**.

#### Step 3: Start Next.js Frontend
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at **http://localhost:3000**.

---

## 🔌 API Reference

### Core REST Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | None | Returns application health status |
| `GET` | `/api/config` | None | Returns public limits (max file size, expiration hours, social links) |
| `POST` | `/api/shares/presigned` | Rate-Limited | Generates S3 presigned URLs for direct client uploads |
| `POST` | `/api/shares/complete` | Rate-Limited | Finalizes direct S3 upload and returns 8-character PIN code |
| `POST` | `/api/shares` | Rate-Limited | Fallback endpoint for standard multipart form uploads |
| `POST` | `/api/shares/verify` | Rate-Limited | Validates PIN code. Returns single-use JWT access token and file metadata |
| `GET` | `/api/shares/access/download` | Bearer Token | Streams file download or multi-file `.ZIP` archive |
| `GET` | `/api/shares/access/view` | Bearer Token | Streams inline preview for safe MIME types (images, PDF, plain text) |

#### Example: Verify Code & Obtain Access Token
```bash
curl -X POST "http://localhost:8000/api/shares/verify" \
  -H "Content-Type: application/json" \
  -d '{"code": "K7X9-P2LM"}'
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and set your environment configurations:

### Application & Database Settings
| Variable | Default Value | Description |
|----------|---------------|-------------|
| `APP_NAME` | `BurnDrop` | Main application title |
| `APP_BASE_URL` | `http://localhost:3000` | Frontend web URL |
| `API_BASE_URL` | `http://localhost:8000` | Backend API URL |
| `APP_SECRET` | *(Random String)* | Secret key for signing access tokens and PIN hashes |
| `DATABASE_URL` | `postgresql+asyncpg://...` | Async PostgreSQL connection string |
| `REDIS_URL` | `redis://redis:6379/0` | Redis connection URL |

### Storage & Limits Configuration
| Variable | Default Value | Description |
|----------|---------------|-------------|
| `MAX_FILE_SIZE_MB` | `1024` | Maximum total file size limit per upload batch (in MB) |
| `FILE_EXPIRATION_HOURS` | `3` | Hours before files automatically expire and burn |
| `STORAGE_BACKEND` | `s3` | Storage engine choice (`local`, `s3`, or `google_drive`) |
| `AWS_S3_BUCKET_NAME` | `your_s3_bucket` | Bucket name when `STORAGE_BACKEND=s3` |
| `GOOGLE_DRIVE_FOLDER_ID`| `folder_id` | Folder ID when `STORAGE_BACKEND=google_drive` |

### Email Driver Configurations
Set `EMAIL_SERVICE` depending on your provider choice (`gmail`, `resend`, `sendgrid`, `brevo`, `smtp`):

```env
# Gmail API Driver
EMAIL_SERVICE=gmail
EMAIL_FROM=your-email@gmail.com

# Resend Driver
EMAIL_SERVICE=resend
EMAIL_FROM=noreply@yourdomain.com
RESEND_API_KEY=re_your_api_key

# Standard SMTP Driver
EMAIL_SERVICE=smtp
EMAIL_FROM=your-email@gmail.com
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
```

---

## ☁️ Deployment & Maintenance

### Deploying the Frontend (Vercel)
The Next.js frontend is configured to seamlessly support serverless deployments like Vercel. 
- It automatically proxies API requests (`/api/*`) to your backend domain if `NEXT_PUBLIC_API_URL` is omitted.
- In production, it defaults to the deployed backend link or respects the custom `NEXT_PUBLIC_API_URL` environment variable you provide.

### Deploying the Backend (Render/Heroku)
When hosting the FastAPI backend on ephemeral hosting services (like Render's free tier), the server may spin down during inactivity. This can pause the background cleanup worker that deletes expired files.

### 🧹 Automatic AWS S3 Cleanup (Lifecycle Rules)
If you are using `STORAGE_BACKEND=s3`, it is highly recommended to configure **AWS S3 Lifecycle Rules** rather than relying on the backend cleanup worker. Lifecycle rules guarantee that Amazon S3 will automatically and permanently delete files after 1 day, even if your backend server is offline.

To instantly apply this rule to your bucket, ensure your `.env` is populated with your AWS credentials (`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`) and run the included utility script:
```bash
python setup_s3_lifecycle.py
```
This script configures your S3 bucket to automatically expire all files after 1 day, and abort incomplete multipart uploads after 1 day.

---

## 🔑 Security Model

- **HMAC-SHA256 Hashing**: One-time PIN codes are never stored as plaintext in the database.
- **Atomic Single-Use Locking**: Database operations enforce strict single-use semantics using PostgreSQL row locks (`SELECT ... FOR UPDATE`), preventing race conditions.
- **Short-Lived Access Tokens**: Verification yields single-use JWT bearer tokens valid for 15 minutes.
- **Sliding-Window Rate Limiting**: Redis enforces tiered IP rate limits across upload creation, PIN verification, and invalid PIN attempts.
- **Controlled Previews**: Inline content rendering is strictly whitelisted to non-executable media types (PDF, JPEG, PNG, GIF, WEBP, Plain Text).

---

## 🧪 Running Tests

Execute backend tests with Pytest:
```bash
cd backend
source venv/bin/activate
PYTHONPATH=. pytest -v
```

---

## 👨‍💻 Connect with the Author

Created with ❤️ by **Ravi Panchal**

- **GitHub**: [@ravixpanchal](https://github.com/ravixpanchal)
- **LinkedIn**: [Ravi Panchal](https://linkedin.com/in/ravixpanchal)
- **Instagram**: [@ravixpanchal](https://instagram.com/ravixpanchal)
- **X (Twitter)**: [@ravixpanchal](https://x.com/ravixpanchal)

---

## 📜 License

This project is open-source software licensed under the [MIT License](LICENSE).

