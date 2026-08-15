# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in BurnDrop, please report it responsibly.

**Do not** open a public GitHub issue for security vulnerabilities.

Instead, email **ravi.panchal.kaithi@gmail.com** with:

- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fix (optional)

You will receive a response within 72 hours. We will work with you to understand and address the issue before any public disclosure.

## Security Assumptions

BurnDrop is designed with the following security model:

### Bearer Credential Model

The one-time sharing code is a **bearer credential**. Anyone who possesses a valid, unexpired, unconsumed code can access the corresponding file. Users are responsible for sharing codes only with intended recipients.

### What We Protect Against

- Unauthorized file access without a valid code
- Code brute-force (rate limiting + high entropy codes)
- Double redemption via race conditions (atomic DB transactions)
- Storage provider exposure to clients
- Path traversal, XSS, and injection attacks
- Oversized uploads (server-side enforcement)

### What We Do Not Claim

- We do **not** claim that "nobody can ever access your data"
- If a user shares their code publicly, others may access the file
- Email delivery is not encrypted end-to-end by this application
- Google Drive/Gmail are trusted third-party services configured by the deployer

### Data Retention

- Uploaded files and metadata are automatically deleted after the configured expiration (default: 3 hours)
- Sender email addresses are stored temporarily for operational purposes
- Raw sharing codes are never stored — only cryptographic hashes

### Deployment Recommendations

- Use HTTPS in production (set `APP_BASE_URL` to `https://...`)
- Generate a strong random `APP_SECRET` (32+ bytes)
- Keep Google OAuth credentials and email passwords in environment variables only
- Make the Google Drive storage folder private (shared only with the backend identity)
- Consider transactional email (SendGrid, SES) for production instead of personal Gmail
- Run PostgreSQL and Redis with authentication in production

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |
