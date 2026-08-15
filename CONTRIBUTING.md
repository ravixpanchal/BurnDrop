# Contributing to BurnDrop

Thank you for your interest in contributing! This document explains how to get started.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/burndrop.git
cd burndrop
```

3. **Create a branch** for your changes:

```bash
git checkout -b feature/my-feature
```

## Development Setup

See [README.md](README.md) for full setup instructions. The quickest path:

```bash
cp .env.example .env
# Set STORAGE_BACKEND=local for development without Google Drive
docker compose up --build
```

For backend-only development:

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
STORAGE_BACKEND=local DATABASE_URL=sqlite+aiosqlite:///:memory: pytest -v
```

## Running Tests

```bash
cd backend
pytest -v --cov=app
```

All tests must pass before submitting a pull request.

## Coding Standards

- **Python**: Follow PEP 8. Use type hints. Keep functions focused and modular.
- **TypeScript**: Use strict mode. Prefer functional React components with hooks.
- **Commits**: Write clear, descriptive commit messages in the imperative mood (e.g. "Add S3 storage backend").
- **No secrets**: Never commit credentials, `.env` files, or API keys.

## Pull Request Process

1. Ensure tests pass locally
2. Update documentation if your change affects setup, API, or architecture
3. Push your branch and open a PR against `main`
4. Describe what your PR does and why
5. Link any related issues

## Adding Features

Check the [Roadmap](README.md#roadmap) in the README. For larger features, open an issue first to discuss the approach.

### Adding a Storage Backend

1. Create `backend/app/storage/your_provider.py` implementing `StorageService`
2. Register it in `get_storage_service()` in `google_drive.py`
3. Add configuration to `.env.example`
4. Write tests in `backend/tests/test_storage.py`
5. Document setup in README

## Code of Conduct

Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Questions?

Open a GitHub issue or contact [ravi.panchal.kaithi@gmail.com](mailto:ravi.panchal.kaithi@gmail.com).
