from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select

from dependencies import DbSession, get_current_user
from models.doctor import Doctor, DoctorType
from models.opd import BookingStatus, OpdBooking
from models.user import User, UserRole
from schemas.opd import BookingOut, SlotBookRequest, SlotLockResponse, SpecialistAppointmentCreate
from services.qr_service import generate_qr_code
from services.slot_service import book_slot, lock_slot
from services.ticket_service import generate_next_opd_ticket

router = APIRouter(prefix="/opd", tags=["opd"])


@router.post("/slots/{slot_id}/lock", response_model=SlotLockResponse)
async def lock_opd_slot(
    slot_id: UUID,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> SlotLockResponse:
    lock_token, expires_at = await lock_slot(slot_id=slot_id, user_id=current_user.id, db=db)
    return SlotLockResponse(lock_token=lock_token, expires_at=expires_at)


@router.post("/slots/{slot_id}/book", response_model=BookingOut)
async def confirm_opd_slot(
    slot_id: UUID,
    payload: SlotBookRequest,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> OpdBooking:
    booking = await book_slot(
        slot_id=slot_id,
        user_id=current_user.id,
        lock_token=payload.lock_token,
        symptoms=payload.symptoms,
        notes=payload.notes,
        db=db,
    )
    return booking


@router.post("/appointments", response_model=BookingOut)
async def book_specialist_appointment(
    payload: SpecialistAppointmentCreate,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> OpdBooking:
    doctor = (await db.execute(select(Doctor).where(Doctor.id == payload.doctor_id))).scalar_one_or_none()
    if doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")
    if doctor.type != DoctorType.SPECIALIST:
        raise HTTPException(status_code=400, detail="Use slot booking for general physicians")

    ticket_number = await generate_next_opd_ticket(db)
    qr_payload = {
        "type": "opd_booking",
        "id": str(payload.doctor_id),
        "ticket": ticket_number,
        "patient": current_user.name,
        "doctor": doctor.name,
        "time": f"{payload.booking_date.isoformat()}T{payload.booking_time.isoformat()}",
    }
    qr_code_data, qr_code_url = await generate_qr_code(qr_payload, folder="opd")

    booking = OpdBooking(
        patient_id=current_user.id,
        doctor_id=payload.doctor_id,
        booking_date=payload.booking_date,
        booking_time=payload.booking_time,
        status=BookingStatus.CONFIRMED,
        symptoms=payload.symptoms,
        notes=payload.notes,
        ticket_number=ticket_number,
        qr_code_data=qr_code_data,
        qr_code_url=qr_code_url,
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    return booking


@router.get("/bookings", response_model=list[BookingOut])
async def my_bookings(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=500),
) -> list[OpdBooking]:
    stmt = (
        select(OpdBooking)
        .where(OpdBooking.patient_id == current_user.id)
        .order_by(OpdBooking.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    return list((await db.execute(stmt)).scalars().all())


@router.get("/bookings/{id}", response_model=BookingOut)
async def booking_detail(
    id: UUID,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> OpdBooking:
    booking = (await db.execute(select(OpdBooking).where(OpdBooking.id == id))).scalar_one_or_none()
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.patient_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Cannot access this booking")

    return booking


@router.delete("/bookings/{id}")
async def cancel_booking(
    id: UUID,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict[str, str]:
    booking = (await db.execute(select(OpdBooking).where(OpdBooking.id == id))).scalar_one_or_none()
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.patient_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Cannot cancel this booking")

    if booking.status in (BookingStatus.CANCELLED, BookingStatus.COMPLETED):
        raise HTTPException(status_code=409, detail="Booking cannot be cancelled")

    booking.status = BookingStatus.CANCELLED
    await db.commit()
    return {"detail": "Booking cancelled"}
