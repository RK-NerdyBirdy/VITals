from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "VITals API"
    environment: str = "development"
    debug: bool = False
    api_prefix: str = "/api"

    database_url: str = Field(
        default="postgresql+asyncpg://vitals:password@localhost:5432/vitals",
        alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379", alias="REDIS_URL")

    minio_endpoint: str = Field(default="localhost:9000", alias="MINIO_ENDPOINT")
    minio_access_key: str = Field(default="minioadmin", alias="MINIO_ACCESS_KEY")
    minio_secret_key: str = Field(default="minioadmin", alias="MINIO_SECRET_KEY")
    minio_bucket: str = Field(default="vitals-records", alias="MINIO_BUCKET")

    jwt_secret: str = Field(default="change-me", alias="JWT_SECRET")
    fernet_key: str | None = Field(default=None, alias="FERNET_KEY")
    frontend_url: str = Field(default="http://localhost:3000", alias="FRONTEND_URL")
    admin_emails: str = Field(default="robomaneet@gmail.com", alias="ADMIN_EMAILS")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
