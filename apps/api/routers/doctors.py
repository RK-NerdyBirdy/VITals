from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, select
from sqlalchemy.orm import selectinload

from dependencies import DbSession, require_role
from models.doctor import Doctor, DoctorType
from models.opd import OpdSlot
from models.user import UserRole
from schemas.doctor import DoctorCreate, DoctorDetailOut, DoctorOut, DoctorUpdate
from schemas.opd import SlotOut

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.get("", response_model=list[DoctorOut])
async def list_doctors(
    db: DbSession,
    doctor_type: DoctorType | None = Query(default=None, alias="type"),
    specialty: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=500),
) -> list[Doctor]:
    stmt = select(Doctor).where(Doctor.is_active.is_(True))
    if doctor_type:
        stmt = stmt.where(Doctor.type == doctor_type)
    if specialty:
        stmt = stmt.where(Doctor.specialty.ilike(f"%{specialty}%"))

    stmt = stmt.order_by(Doctor.name).offset((page - 1) * limit).limit(limit)
    return list((await db.execute(stmt)).scalars().all())


@router.get("/{id}/slots", response_model=list[SlotOut])
async def list_doctor_slots(id: UUID, db: DbSession, date_value: date = Query(alias="date")) -> list[OpdSlot]:
    slots = (
        await db.execute(
            select(OpdSlot)
            .where(and_(OpdSlot.doctor_id == id, OpdSlot.date == date_value))
            .order_by(OpdSlot.start_time)
        )
    ).scalars().all()
    return list(slots)


@router.get("/{id}", response_model=DoctorDetailOut)
async def get_doctor(id: UUID, db: DbSession) -> Doctor:
    doctor = (
        await db.execute(
            select(Doctor)
            .options(selectinload(Doctor.availabilities))
            .where(Doctor.id == id)
        )
    ).scalar_one_or_none()
    if doctor is None or not doctor.is_active:
        raise HTTPException(status_code=404, detail="Doctor not found")

    doctor.availabilities.sort(key=lambda item: (item.day_of_week, item.start_time))
    return doctor


@router.post("", response_model=DoctorOut)
async def create_doctor(
    payload: DoctorCreate,
    db: DbSession,
    _: Annotated[object, Depends(require_role([UserRole.ADMIN]))],
) -> Doctor:
    doctor = Doctor(**payload.model_dump())
    db.add(doctor)
    await db.commit()
    await db.refresh(doctor)
    return doctor


@router.put("/{id}", response_model=DoctorOut)
async def update_doctor(
    id: UUID,
    payload: DoctorUpdate,
    db: DbSession,
    _: Annotated[object, Depends(require_role([UserRole.ADMIN]))],
) -> Doctor:
    doctor = (await db.execute(select(Doctor).where(Doctor.id == id))).scalar_one_or_none()
    if doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(doctor, field, value)

    await db.commit()
    await db.refresh(doctor)
    return doctor


@router.delete("/{id}")
async def soft_delete_doctor(
    id: UUID,
    db: DbSession,
    _: Annotated[object, Depends(require_role([UserRole.ADMIN]))],
) -> dict[str, str]:
    doctor = (await db.execute(select(Doctor).where(Doctor.id == id))).scalar_one_or_none()
    if doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")

    doctor.is_active = False
    await db.commit()
    return {"detail": "Doctor deactivated"}
