from __future__ import annotations

from io import BytesIO
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import or_, select

from core.config import get_settings
from core.security import decrypt_file, encrypt_file, get_data_key, store_data_key
from core.storage import get_storage
from dependencies import DbSession, get_current_user, require_role
from models.record import MedicalRecord, RecordType
from models.user import User, UserRole
from schemas.record import RecordOut, RecordShareResponse
from services.qr_service import generate_qr_code
from services.share_service import create_share_token, validate_share_token

router = APIRouter(prefix="/records", tags=["records"])
settings = get_settings()


async def _can_access_patient_records(db: DbSession, current_user: User, patient_id: UUID) -> bool:
    if current_user.role == UserRole.ADMIN:
        return True

    if current_user.id == patient_id:
        return True

    if current_user.role == UserRole.FACULTY:
        member = (
            await db.execute(select(User.id).where(User.id == patient_id, User.parent_id == current_user.id))
        ).scalar_one_or_none()
        return member is not None

    return False


@router.post("", response_model=RecordOut)
async def upload_record(
    db: DbSession,
    admin_user: User = Depends(require_role([UserRole.ADMIN])),
    patient_id: UUID = Form(...),
    type: RecordType = Form(...),
    title: str = Form(...),
    description: str | None = Form(default=None),
    file: UploadFile = File(...),
) -> MedicalRecord:
    patient = (
        await db.execute(select(User).where(User.id == patient_id, User.is_active.is_(True)))
    ).scalar_one_or_none()
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    if patient.role == UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Cannot upload records for admin users")

    data = await file.read()
    encrypted, key = encrypt_file(data)
    key_ref = store_data_key(key)

    object_key = f"records/{patient_id}/{uuid4()}-{file.filename}"
    storage = get_storage()
    await storage.upload_bytes(
        key=object_key,
        data=encrypted,
        content_type=file.content_type or "application/octet-stream",
    )

    record = MedicalRecord(
        patient_id=patient_id,
        uploaded_by=admin_user.id,
        type=type,
        title=title,
        description=description,
        file_path=object_key,
        encryption_key_ref=key_ref,
        file_size_bytes=len(data),
        mime_type=file.content_type,
    )

    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("", response_model=list[RecordOut])
async def list_records(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[MedicalRecord]:
    stmt = select(MedicalRecord).where(MedicalRecord.is_active.is_(True))
    if current_user.role == UserRole.ADMIN:
        pass
    elif current_user.role == UserRole.FACULTY:
        family_member_ids = select(User.id).where(User.parent_id == current_user.id)
        stmt = stmt.where(
            or_(
                MedicalRecord.patient_id == current_user.id,
                MedicalRecord.patient_id.in_(family_member_ids),
            )
        )
    else:
        stmt = stmt.where(MedicalRecord.patient_id == current_user.id)

    stmt = stmt.order_by(MedicalRecord.created_at.desc())
    return list((await db.execute(stmt)).scalars().all())


@router.get("/{id}/download")
async def download_record(
    id: UUID,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> StreamingResponse:
    record = (await db.execute(select(MedicalRecord).where(MedicalRecord.id == id))).scalar_one_or_none()
    if record is None or not record.is_active:
        raise HTTPException(status_code=404, detail="Record not found")

    if not await _can_access_patient_records(db, current_user, record.patient_id):
        raise HTTPException(status_code=403, detail="Cannot access this record")

    key = get_data_key(record.encryption_key_ref)
    encrypted = await get_storage().download_bytes(record.file_path)
    raw = decrypt_file(encrypted, key)

    return StreamingResponse(
        BytesIO(raw),
        media_type=record.mime_type or "application/octet-stream",
        headers={"Content-Disposition": f"inline; filename={record.title}"},
    )


@router.post("/{id}/share", response_model=RecordShareResponse)
async def share_record(
    id: UUID,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> RecordShareResponse:
    record = (await db.execute(select(MedicalRecord).where(MedicalRecord.id == id))).scalar_one_or_none()
    if record is None:
        raise HTTPException(status_code=404, detail="Record not found")

    if not await _can_access_patient_records(db, current_user, record.patient_id):
        raise HTTPException(status_code=403, detail="Cannot share this record")

    share = await create_share_token(db=db, record_id=record.id, expires_in_minutes=20, max_accesses=1)
    share_url = f"{settings.frontend_url}/share/{share.token}"
    _, qr_key = await generate_qr_code({"type": "record_share", "token": share.token, "url": share_url}, "shares")

    return RecordShareResponse(
        share_token=share.token,
        expires_at=share.expires_at,
        share_url=share_url,
        qr_code_url=qr_key,
    )


@router.get("/shared/{token}")
async def access_shared_record(token: str, db: DbSession) -> StreamingResponse:
    share = await validate_share_token(db, token)

    record = (
        await db.execute(select(MedicalRecord).where(MedicalRecord.id == share.record_id, MedicalRecord.is_active.is_(True)))
    ).scalar_one_or_none()
    if record is None:
        raise HTTPException(status_code=404, detail="Record not found")

    key = get_data_key(record.encryption_key_ref)
    encrypted = await get_storage().download_bytes(record.file_path)
    raw = decrypt_file(encrypted, key)

    share.accessed_count += 1
    await db.commit()

    return StreamingResponse(
        BytesIO(raw),
        media_type=record.mime_type or "application/octet-stream",
        headers={"Content-Disposition": f"inline; filename={record.title}"},
    )


@router.delete("/{id}")
async def delete_record(
    id: UUID,
    db: DbSession,
    _: Annotated[User, Depends(require_role([UserRole.ADMIN]))],
) -> dict[str, str]:
    record = (await db.execute(select(MedicalRecord).where(MedicalRecord.id == id))).scalar_one_or_none()
    if record is None:
        raise HTTPException(status_code=404, detail="Record not found")

    record.is_active = False
    await db.commit()
    return {"detail": "Record deleted"}
