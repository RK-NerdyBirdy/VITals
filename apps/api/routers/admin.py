from datetime import date, time
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload

from dependencies import DbSession, require_role
from models.doctor import Doctor
from models.lab import LabOrder, LabOrderItem, LabTest, LabTestProfileItem
from models.opd import OpdBooking
from models.user import User, UserRole
from schemas.doctor import DoctorOut
from schemas.lab import (
    AdminLabTestCreate,
    AdminLabTestUpdate,
    LabOrderOut,
    LabOrderStatusUpdate,
    LabTestOut,
)
from schemas.opd import BookingOut, BookingStatusUpdate
from schemas.user import UserOut
from services.slot_generator import generate_gp_slots

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_role([UserRole.ADMIN]))],
)


class SlotGenerationRequest(BaseModel):
    doctor_id: UUID
    start_date: date
    end_date: date
    start_time: time
    end_time: time
    slot_minutes: int = 15


async def _validate_profile_item_ids(db: DbSession, profile_item_ids: list[UUID]) -> list[LabTest]:
    if not profile_item_ids:
        return []

    selected = list(
        (
            await db.execute(
                select(LabTest).where(LabTest.id.in_(profile_item_ids), LabTest.is_active.is_(True))
            )
        ).scalars().all()
    )

    if len(selected) != len(set(profile_item_ids)):
        raise HTTPException(status_code=400, detail="One or more profile item test IDs are invalid")

    if any(test.is_profile for test in selected):
        raise HTTPException(status_code=400, detail="Profile items must reference individual tests")

    return selected


@router.get("/users", response_model=list[UserOut])
async def list_users(
    db: DbSession,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=500),
) -> list[User]:
    stmt = select(User).order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit)
    return list((await db.execute(stmt)).scalars().all())


@router.get("/doctors", response_model=list[DoctorOut])
async def list_doctors(
    db: DbSession,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=500),
) -> list[Doctor]:
    stmt = select(Doctor).order_by(Doctor.created_at.desc()).offset((page - 1) * limit).limit(limit)
    return list((await db.execute(stmt)).scalars().all())


@router.get("/tests", response_model=list[LabTestOut])
async def list_tests(
    db: DbSession,
    include_inactive: bool = Query(default=True),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=500),
) -> list[LabTest]:
    stmt = select(LabTest)
    if not include_inactive:
        stmt = stmt.where(LabTest.is_active.is_(True))

    stmt = stmt.order_by(LabTest.created_at.desc()).offset((page - 1) * limit).limit(limit)
    return list((await db.execute(stmt)).scalars().all())


@router.post("/tests", response_model=LabTestOut)
async def create_test(payload: AdminLabTestCreate, db: DbSession) -> LabTest:
    profile_items = await _validate_profile_item_ids(db, payload.profile_item_ids)
    if profile_items and not payload.is_profile:
        raise HTTPException(status_code=400, detail="Only profile tests can include profile items")

    test = LabTest(**payload.model_dump(exclude={"profile_item_ids"}))
    db.add(test)
    await db.flush()

    if payload.profile_item_ids:
        db.add_all(
            [
                LabTestProfileItem(profile_id=test.id, test_id=item_id)
                for item_id in payload.profile_item_ids
            ]
        )

    await db.commit()
    await db.refresh(test)
    return test


@router.put("/tests/{id}", response_model=LabTestOut)
async def update_test(id: UUID, payload: AdminLabTestUpdate, db: DbSession) -> LabTest:
    test = (await db.execute(select(LabTest).where(LabTest.id == id))).scalar_one_or_none()
    if test is None:
        raise HTTPException(status_code=404, detail="Test not found")

    update_data = payload.model_dump(exclude_none=True, exclude={"profile_item_ids"})
    for field, value in update_data.items():
        setattr(test, field, value)

    if payload.profile_item_ids is not None:
        is_profile = update_data.get("is_profile", test.is_profile)
        if payload.profile_item_ids and not is_profile:
            raise HTTPException(status_code=400, detail="Only profile tests can include profile items")

        if id in payload.profile_item_ids:
            raise HTTPException(status_code=400, detail="A profile cannot include itself")

        await _validate_profile_item_ids(db, payload.profile_item_ids)
        await db.execute(delete(LabTestProfileItem).where(LabTestProfileItem.profile_id == id))
        if payload.profile_item_ids:
            db.add_all(
                [
                    LabTestProfileItem(profile_id=id, test_id=item_id)
                    for item_id in payload.profile_item_ids
                ]
            )

    await db.commit()
    await db.refresh(test)
    return test


@router.delete("/tests/{id}")
async def deactivate_test(id: UUID, db: DbSession) -> dict[str, str]:
    test = (await db.execute(select(LabTest).where(LabTest.id == id))).scalar_one_or_none()
    if test is None:
        raise HTTPException(status_code=404, detail="Test not found")

    test.is_active = False
    await db.commit()
    return {"detail": "Test deactivated"}


@router.post("/slots/generate")
async def generate_slots(payload: SlotGenerationRequest, db: DbSession) -> dict[str, int]:
    created = await generate_gp_slots(
        db=db,
        doctor_id=payload.doctor_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        slot_minutes=payload.slot_minutes,
    )
    return {"created": created}


@router.get("/orders", response_model=list[LabOrderOut])
async def list_orders(
    db: DbSession,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=500),
) -> list[LabOrder]:
    stmt = (
        select(LabOrder)
        .options(selectinload(LabOrder.items).selectinload(LabOrderItem.test))
        .order_by(LabOrder.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    return list((await db.execute(stmt)).scalars().all())


@router.put("/orders/{id}/status", response_model=LabOrderOut)
async def admin_update_order_status(id: UUID, payload: LabOrderStatusUpdate, db: DbSession) -> LabOrder:
    order = (await db.execute(select(LabOrder).where(LabOrder.id == id))).scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = payload.status
    await db.commit()
    refreshed = (
        await db.execute(
            select(LabOrder)
            .options(selectinload(LabOrder.items).selectinload(LabOrderItem.test))
            .where(LabOrder.id == id)
        )
    ).scalar_one()
    return refreshed


@router.get("/bookings", response_model=list[BookingOut])
async def list_bookings(
    db: DbSession,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=500),
) -> list[OpdBooking]:
    stmt = (
        select(OpdBooking)
        .order_by(OpdBooking.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    return list((await db.execute(stmt)).scalars().all())


@router.put("/bookings/{id}/status", response_model=BookingOut)
async def admin_update_booking_status(id: UUID, payload: BookingStatusUpdate, db: DbSession) -> OpdBooking:
    booking = (await db.execute(select(OpdBooking).where(OpdBooking.id == id))).scalar_one_or_none()
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.status = payload.status
    await db.commit()
    await db.refresh(booking)
    return booking
