from __future__ import annotations

import base64
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any

from cryptography.fernet import Fernet
from fastapi import HTTPException, status
from jose import JWTError, jwt

from core.config import get_settings

settings = get_settings()


def _resolve_master_key() -> bytes:
    configured = (settings.fernet_key or "").strip()
    if configured:
        try:
            # Validate configured key is usable by Fernet.
            Fernet(configured.encode("utf-8"))
            return configured.encode("utf-8")
        except Exception:
            pass

    # Fallback: derive a stable dev key from JWT secret.
    digest = hashlib.sha256(settings.jwt_secret.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


_MASTER_FERNET = Fernet(_resolve_master_key())


def decode_jwt_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        ) from exc


def encrypt_file(data: bytes) -> tuple[bytes, str]:
    key = Fernet.generate_key()
    encrypted = Fernet(key).encrypt(data)
    return encrypted, key.decode("utf-8")


def decrypt_file(encrypted_data: bytes, key_str: str) -> bytes:
    return Fernet(key_str.encode("utf-8")).decrypt(encrypted_data)


def store_data_key(key_str: str) -> str:
    # Persist the data key by wrapping it with the master key.
    return _MASTER_FERNET.encrypt(key_str.encode("utf-8")).decode("utf-8")


def get_data_key(key_ref: str) -> str:
    try:
        return _MASTER_FERNET.decrypt(key_ref.encode("utf-8")).decode("utf-8")
    except Exception as exc:
        raise HTTPException(status_code=404, detail="Encryption key reference not found") from exc


def make_expiry(minutes: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)
