from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import get_settings
from models.opd import BookingStatus, OpdBooking, OpdSlot, SlotStatus
from services.qr_service import generate_qr_code
from services.ticket_service import generate_next_opd_ticket

settings = get_settings()

LOCK_EXPIRY_SECONDS = 300
redis_client = Redis.from_url(settings.redis_url, decode_responses=True)


async def _normalize_lock_state(slot: OpdSlot, db: AsyncSession) -> None:
    now = datetime.now(timezone.utc)
    if slot.status == SlotStatus.LOCKED and slot.locked_until and slot.locked_until < now:
        slot.status = SlotStatus.AVAILABLE
        slot.patient_id = None
        slot.locked_until = None
        await db.commit()
        await db.refresh(slot)


async def lock_slot(slot_id: UUID, user_id: UUID, db: AsyncSession) -> tuple[str, datetime]:
    slot = (await db.execute(select(OpdSlot).where(OpdSlot.id == slot_id))).scalar_one_or_none()
    if slot is None:
        raise HTTPException(status_code=404, detail="Slot not found")

    await _normalize_lock_state(slot, db)

    if slot.status != SlotStatus.AVAILABLE:
        raise HTTPException(status_code=409, detail="Slot is not available")

    lock_key = f"slot_lock:{slot_id}"
    lock_token = secrets.token_urlsafe(16)
    lock_value = f"{user_id}:{lock_token}"
    acquired = await redis_client.set(lock_key, lock_value, nx=True, ex=LOCK_EXPIRY_SECONDS)
    if not acquired:
        raise HTTPException(status_code=409, detail="Slot already locked by another user")

    expires_at = datetime.now(timezone.utc) + timedelta(seconds=LOCK_EXPIRY_SECONDS)
    slot.status = SlotStatus.LOCKED
    slot.patient_id = user_id
    slot.locked_until = expires_at
    await db.commit()

    return lock_token, expires_at


async def book_slot(
    slot_id: UUID,
    user_id: UUID,
    lock_token: str,
    db: AsyncSession,
    symptoms: str | None = None,
    notes: str | None = None,
) -> OpdBooking:
    lock_key = f"slot_lock:{slot_id}"
    expected = f"{user_id}:{lock_token}"
    actual = await redis_client.get(lock_key)

    if actual != expected:
        raise HTTPException(status_code=409, detail="Invalid or expired lock token")

    slot = (await db.execute(select(OpdSlot).where(OpdSlot.id == slot_id))).scalar_one_or_none()
    if slot is None:
        raise HTTPException(status_code=404, detail="Slot not found")

    if slot.status != SlotStatus.LOCKED or slot.patient_id != user_id:
        raise HTTPException(status_code=409, detail="Slot lock no longer valid")

    ticket_number = await generate_next_opd_ticket(db)
    booking_payload = {
        "type": "opd_booking",
        "id": str(slot.id),
        "ticket": ticket_number,
        "patient": str(user_id),
        "doctor": str(slot.doctor_id),
        "time": f"{slot.date.isoformat()}T{slot.start_time.isoformat()}",
    }
    qr_code_data, qr_code_url = await generate_qr_code(booking_payload, folder="opd")

    booking = OpdBooking(
        patient_id=user_id,
        doctor_id=slot.doctor_id,
        booking_date=slot.date,
        booking_time=slot.start_time,
        status=BookingStatus.CONFIRMED,
        symptoms=symptoms,
        notes=notes,
        ticket_number=ticket_number,
        qr_code_data=qr_code_data,
        qr_code_url=qr_code_url,
    )
    db.add(booking)

    slot.status = SlotStatus.BOOKED
    slot.locked_until = None

    await redis_client.delete(lock_key)
    await db.commit()
    await db.refresh(booking)

    return booking
