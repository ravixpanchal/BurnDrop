import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_presigned_upload_fallback_for_local_storage(client: AsyncClient):
    payload = {
        "email": "user@example.com",
        "files": [
            {"filename": "document.pdf", "size_bytes": 5000, "mime_type": "application/pdf"}
        ],
    }
    resp = await client.post("/api/shares/presigned", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "direct_upload_supported" in data
    # Under local storage, direct_upload_supported is False
    assert data["direct_upload_supported"] is False


@pytest.mark.asyncio
async def test_presigned_upload_invalid_email(client: AsyncClient):
    payload = {
        "email": "invalid-email",
        "files": [
            {"filename": "document.pdf", "size_bytes": 5000, "mime_type": "application/pdf"}
        ],
    }
    resp = await client.post("/api/shares/presigned", json=payload)
    assert resp.status_code == 422
