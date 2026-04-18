from __future__ import annotations

import asyncio
from io import BytesIO

import boto3
from botocore.exceptions import ClientError

from core.config import get_settings

settings = get_settings()


class ObjectStorage:
    def __init__(self) -> None:
        endpoint = settings.minio_endpoint
        if not endpoint.startswith("http://") and not endpoint.startswith("https://"):
            endpoint = f"http://{endpoint}"

        self.bucket = settings.minio_bucket
        self._client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=settings.minio_access_key,
            aws_secret_access_key=settings.minio_secret_key,
            region_name="us-east-1",
        )

    async def ensure_bucket(self) -> None:
        def _ensure() -> None:
            try:
                self._client.head_bucket(Bucket=self.bucket)
            except ClientError:
                self._client.create_bucket(Bucket=self.bucket)

        await asyncio.to_thread(_ensure)

    async def upload_bytes(self, key: str, data: bytes, content_type: str) -> str:
        def _upload() -> None:
            self._client.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=BytesIO(data),
                ContentType=content_type,
            )

        await asyncio.to_thread(_upload)
        return key

    async def download_bytes(self, key: str) -> bytes:
        def _download() -> bytes:
            response = self._client.get_object(Bucket=self.bucket, Key=key)
            return response["Body"].read()

        return await asyncio.to_thread(_download)


_storage: ObjectStorage | None = None


def get_storage() -> ObjectStorage:
    global _storage
    if _storage is None:
        _storage = ObjectStorage()
    return _storage
