"""Integration tests for share API."""

import pytest
from httpx import AsyncClient


async def upload_file(client: AsyncClient, filename: str, content: bytes, email: str = "test@example.com"):
    return await client.post(
        "/api/shares",
        files={"file": (filename, content, "application/octet-stream")},
        data={"email": email},
    )


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_upload_and_verify(client: AsyncClient):
    content = b"test file content for sharing"
    resp = await upload_file(client, "test.txt", content)
    assert resp.status_code == 201
    data = resp.json()
    assert "code" in data
    assert data["filename"] == "test.txt"
    assert data["size_bytes"] == len(content)

    verify = await client.post("/api/shares/verify", json={"code": data["code"]})
    assert verify.status_code == 200
    token = verify.json()["access_token"]
    assert token

    download = await client.get(
        "/api/shares/access/download",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert download.status_code == 200
    assert download.content == content


@pytest.mark.asyncio
async def test_multiple_use_within_expiration(client: AsyncClient):
    content = b"multiple use content"
    resp = await upload_file(client, "multi.txt", content)
    code = resp.json()["code"]

    verify = await client.post("/api/shares/verify", json={"code": code})
    token = verify.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    dl1 = await client.get("/api/shares/access/download", headers=headers)
    assert dl1.status_code == 200
    assert dl1.content == content

    verify2 = await client.post("/api/shares/verify", json={"code": code})
    assert verify2.status_code == 200
    token2 = verify2.json()["access_token"]

    dl2 = await client.get("/api/shares/access/download", headers={"Authorization": f"Bearer {token2}"})
    assert dl2.status_code == 200
    assert dl2.content == content


@pytest.mark.asyncio
async def test_invalid_code(client: AsyncClient):
    resp = await client.post("/api/shares/verify", json={"code": "ZZZZ-ZZZZ"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_file_too_large(client: AsyncClient):
    from app.config.settings import get_settings

    settings = get_settings()
    oversized = b"x" * (settings.max_file_size_bytes + 1)
    resp = await upload_file(client, "big.bin", oversized)
    assert resp.status_code == 413


@pytest.mark.asyncio
async def test_invalid_email(client: AsyncClient):
    resp = await upload_file(client, "test.txt", b"data", email="not-an-email")
    assert resp.status_code == 400



@pytest.mark.asyncio
async def test_user_isolation(client: AsyncClient):
    resp_a = await upload_file(client, "secret_a.txt", b"user a secret")
    code_a = resp_a.json()["code"]

    resp_b = await upload_file(client, "secret_b.txt", b"user b secret")

    wrong = await client.post("/api/shares/verify", json={"code": "WRNG-CODE"})
    assert wrong.status_code in (400, 404)

    verify_a = await client.post("/api/shares/verify", json={"code": code_a})
    assert verify_a.status_code == 200

    token_a = verify_a.json()["access_token"]
    dl = await client.get("/api/shares/access/download", headers={"Authorization": f"Bearer {token_a}"})
    assert dl.content == b"user a secret"
    assert dl.content != b"user b secret"


@pytest.mark.asyncio
async def test_upload_multiple_files_and_verify(client: AsyncClient):
    files = [
        ("files", ("img1.png", b"fake image 1", "image/png")),
        ("files", ("docs/doc.pdf", b"fake pdf content", "application/pdf")),
        ("files", ("data.json", b'{"key": "value"}', "application/json")),
    ]
    resp = await client.post("/api/shares", files=files, data={"email": "multi@example.com"})
    assert resp.status_code == 201
    data = resp.json()
    assert "code" in data
    assert "img1_and_2_more.zip" in data["filename"]

    verify = await client.post("/api/shares/verify", json={"code": data["code"]})
    assert verify.status_code == 200
    verify_data = verify.json()
    token = verify_data["access_token"]
    assert token

    file_items = verify_data["files"]
    assert len(file_items) == 3
    filenames = [f["filename"] for f in file_items]
    assert "img1.png" in filenames
    assert "docs/doc.pdf" in filenames
    assert "data.json" in filenames

    # Test downloading individual file by file_id
    doc_file = next(f for f in file_items if f["filename"] == "docs/doc.pdf")
    single_dl = await client.get(
        f"/api/shares/access/download?file_id={doc_file['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert single_dl.status_code == 200
    assert single_dl.content == b"fake pdf content"
    assert "doc.pdf" in single_dl.headers["content-disposition"]

    # Test Download All (ZIP packaging preserving folder structure)
    download_all = await client.get(
        "/api/shares/access/download?download_all=true",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert download_all.status_code == 200
    assert download_all.headers["content-type"] == "application/zip"

    import io
    import zipfile
    z = zipfile.ZipFile(io.BytesIO(download_all.content))
    namelist = z.namelist()
    assert "img1.png" in namelist
    assert "docs/doc.pdf" in namelist
    assert "data.json" in namelist
    assert z.read("img1.png") == b"fake image 1"
    assert z.read("docs/doc.pdf") == b"fake pdf content"
    assert z.read("data.json") == b'{"key": "value"}'


