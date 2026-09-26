"""AWS S3 storage driver implementation."""

import asyncio
import io
import logging
from collections.abc import AsyncIterator

from app.config.settings import get_settings
from app.storage.base import StorageMetadata, StorageService

logger = logging.getLogger(__name__)
CHUNK_SIZE = 1024 * 1024  # 1 MB


class S3StorageService(StorageService):
    def __init__(
        self,
        bucket_name: str | None = None,
        region: str | None = None,
        aws_access_key_id: str | None = None,
        aws_secret_access_key: str | None = None,
        s3_client=None,
    ):
        settings = get_settings()
        self.bucket_name = bucket_name or settings.aws_s3_bucket_name
        self.region = region or settings.aws_region

        if s3_client is not None:
            self.s3_client = s3_client
        else:
            import boto3

            client_kwargs = {"region_name": self.region}
            key_id = aws_access_key_id or settings.aws_access_key_id
            secret_key = aws_secret_access_key or settings.aws_secret_access_key

            if key_id and secret_key:
                client_kwargs["aws_access_key_id"] = key_id
                client_kwargs["aws_secret_access_key"] = secret_key

            self.s3_client = boto3.client("s3", **client_kwargs)

        if not self.bucket_name:
            logger.warning("S3StorageService initialized without a bucket name!")

    async def upload(self, key: str, stream: AsyncIterator[bytes], size: int, mime_type: str | None) -> str:
        buffer = io.BytesIO()
        async for chunk in stream:
            buffer.write(chunk)
        buffer.seek(0)

        extra_args = {}
        if mime_type:
            extra_args["ContentType"] = mime_type

        def _do_upload():
            self.s3_client.upload_fileobj(
                Fileobj=buffer,
                Bucket=self.bucket_name,
                Key=key,
                ExtraArgs=extra_args if extra_args else None,
            )

        await asyncio.to_thread(_do_upload)
        return key

    async def download(self, key: str) -> AsyncIterator[bytes]:
        def _get_object():
            return self.s3_client.get_object(Bucket=self.bucket_name, Key=key)

        try:
            res = await asyncio.to_thread(_get_object)
            body = res["Body"]
        except Exception as e:
            logger.error("Failed to download file '%s' from S3: %s", key, e)
            raise FileNotFoundError(f"File key '{key}' not found in S3 bucket.") from e

        while True:
            chunk = await asyncio.to_thread(body.read, CHUNK_SIZE)
            if not chunk:
                break
            yield chunk

    async def delete(self, key: str) -> bool:
        def _do_delete():
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)

        try:
            await asyncio.to_thread(_do_delete)
            return True
        except Exception as e:
            logger.warning("Error deleting key '%s' from S3: %s", key, e)
            return True

    async def exists(self, key: str) -> bool:
        def _head_object():
            self.s3_client.head_object(Bucket=self.bucket_name, Key=key)

        try:
            await asyncio.to_thread(_head_object)
            return True
        except Exception:
            return False

    async def get_metadata(self, key: str) -> StorageMetadata | None:
        def _head_object():
            return self.s3_client.head_object(Bucket=self.bucket_name, Key=key)

        try:
            res = await asyncio.to_thread(_head_object)
            return StorageMetadata(
                key=key,
                size=res.get("ContentLength", 0),
                mime_type=res.get("ContentType"),
            )
        except Exception:
            return None

    async def generate_presigned_upload_url(
        self, key: str, mime_type: str | None, expires_in: int = 3600
    ) -> str | None:
        if not self.bucket_name:
            return None

        extra_params = {"Bucket": self.bucket_name, "Key": key}
        if mime_type:
            extra_params["ContentType"] = mime_type

        def _gen():
            return self.s3_client.generate_presigned_url(
                ClientMethod="put_object",
                Params=extra_params,
                ExpiresIn=expires_in,
            )

        try:
            return await asyncio.to_thread(_gen)
        except Exception as e:
            logger.warning("Failed to generate presigned upload URL for key '%s': %s", key, e)
            return None

