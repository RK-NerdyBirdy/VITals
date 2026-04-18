from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from models.record import RecordType


class RecordCreateMeta(BaseModel):
    patient_id: UUID
    type: RecordType
    title: str
    description: str | None = None


class RecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    uploaded_by: UUID
    type: RecordType
    title: str
    description: str | None
    file_path: str
    encryption_key_ref: str
    file_size_bytes: int | None
    mime_type: str | None
    is_active: bool
    created_at: datetime


class RecordShareResponse(BaseModel):
    share_token: str
    expires_at: datetime
    share_url: str
    qr_code_url: str | None
