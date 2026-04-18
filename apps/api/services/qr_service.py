from __future__ import annotations

import json
from io import BytesIO
from uuid import uuid4

import qrcode

from core.storage import get_storage


async def generate_qr_code(payload: dict[str, str], folder: str) -> tuple[str, str]:
    payload_json = json.dumps(payload, separators=(",", ":"))
    image = qrcode.make(payload_json)

    buffer = BytesIO()
    image.save(buffer, format="PNG")

    object_key = f"{folder}/{uuid4()}.png"
    storage = get_storage()
    await storage.upload_bytes(object_key, buffer.getvalue(), content_type="image/png")

    return payload_json, object_key
