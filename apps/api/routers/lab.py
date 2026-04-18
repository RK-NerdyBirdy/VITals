from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from dependencies import DbSession, get_current_user
from models.lab import LabOrder, LabOrderItem, LabTest, LabTestProfileItem, OrderStatus
from models.user import User
from schemas.lab import (
    LabOrderCreate,
    LabOrderOut,
    LabOrderStatusUpdate,
    LabTestDetailOut,
    LabTestMiniOut,
    LabTestOut,
)
from services.qr_service import generate_qr_code
from services.ticket_service import generate_next_lab_ticket

router = APIRouter(prefix="/lab", tags=["lab"])


async def _fetch_order_with_items(db: DbSession, order_id: UUID) -> LabOrder:
    stmt = (
        select(LabOrder)
        .options(selectinload(LabOrder.items).selectinload(LabOrderItem.test))
        .where(LabOrder.id == order_id)
    )
    order = (await db.execute(stmt)).scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/tests", response_model=list[LabTestOut])
async def list_tests(
    db: DbSession,
    is_profile: bool | None = Query(default=None),
    category: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=500),
) -> list[LabTest]:
    stmt = select(LabTest).where(LabTest.is_active.is_(True))
    if is_profile is not None:
        stmt = stmt.where(LabTest.is_profile == is_profile)
    if category:
        stmt = stmt.where(LabTest.category.ilike(f"%{category}%"))

    stmt = stmt.order_by(LabTest.name).offset((page - 1) * limit).limit(limit)
    return list((await db.execute(stmt)).scalars().all())


@router.get("/tests/{id}", response_model=LabTestDetailOut)
async def test_detail(id: UUID, db: DbSession) -> LabTestDetailOut:
    test = (await db.execute(select(LabTest).where(LabTest.id == id))).scalar_one_or_none()
    if test is None or not test.is_active:
        raise HTTPException(status_code=404, detail="Test not found")

    profile_item_ids = (
        await db.execute(
            select(LabTestProfileItem.test_id).where(LabTestProfileItem.profile_id == id)
        )
    ).scalars().all()

    profile_items: list[LabTest] = []
    if profile_item_ids:
        profile_items = list(
            (
                await db.execute(
                    select(LabTest)
                    .where(LabTest.id.in_(profile_item_ids), LabTest.is_active.is_(True))
                    .order_by(LabTest.name)
                )
            ).scalars().all()
        )

    data = LabTestDetailOut.model_validate(test)
    data.profile_item_ids = list(profile_item_ids)
    data.profile_items = [LabTestMiniOut.model_validate(item) for item in profile_items]
    return data


@router.post("/orders", response_model=LabOrderOut)
async def place_order(
    payload: LabOrderCreate,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> LabOrder:
    requested_test_ids = set(payload.test_ids)
    tests = (
        await db.execute(select(LabTest).where(LabTest.id.in_(payload.test_ids), LabTest.is_active.is_(True)))
    ).scalars().all()

    resolved_test_ids = {test.id for test in tests}
    if requested_test_ids != resolved_test_ids:
        raise HTTPException(
            status_code=400,
            detail="Some selected tests are unavailable. Please refresh your cart and retry.",
        )

    total = sum(float(test.price) for test in tests)
    ticket_number = await generate_next_lab_ticket(db)

    qr_payload = {
        "type": "lab_order",
        "ticket": ticket_number,
        "patient": current_user.name,
        "id": str(current_user.id),
    }
    qr_code_data, qr_code_url = await generate_qr_code(qr_payload, folder="lab")

    order = LabOrder(
        patient_id=current_user.id,
        status=OrderStatus.PENDING,
        total_amount=total,
        appointment_date=payload.appointment_date,
        appointment_time=payload.appointment_time,
        ticket_number=ticket_number,
        notes=payload.notes,
        qr_code_data=qr_code_data,
        qr_code_url=qr_code_url,
    )
    db.add(order)
    await db.flush()

    for test in tests:
        db.add(
            LabOrderItem(
                order_id=order.id,
                test_id=test.id,
                price_at_order=float(test.price),
            )
        )

    await db.commit()
    return await _fetch_order_with_items(db, order.id)


@router.get("/orders", response_model=list[LabOrderOut])
async def my_orders(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=500),
) -> list[LabOrder]:
    stmt = (
        select(LabOrder)
        .options(selectinload(LabOrder.items).selectinload(LabOrderItem.test))
        .where(LabOrder.patient_id == current_user.id)
        .order_by(LabOrder.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    return list((await db.execute(stmt)).scalars().all())


@router.get("/orders/{id}", response_model=LabOrderOut)
async def order_detail(
    id: UUID,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> LabOrder:
    order = await _fetch_order_with_items(db, id)
    if order.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot access this order")
    return order


@router.delete("/orders/{id}")
async def cancel_order(
    id: UUID,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict[str, str]:
    order = (await db.execute(select(LabOrder).where(LabOrder.id == id))).scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot cancel this order")
    if order.status != OrderStatus.PENDING:
        raise HTTPException(status_code=409, detail="Only pending orders can be cancelled")

    order.status = OrderStatus.CANCELLED
    await db.commit()
    return {"detail": "Order cancelled"}


@router.put("/orders/{id}/status", response_model=LabOrderOut)
async def update_order_status(
    id: UUID,
    payload: LabOrderStatusUpdate,
    db: DbSession,
) -> LabOrder:
    order = (await db.execute(select(LabOrder).where(LabOrder.id == id))).scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = payload.status
    await db.commit()
    return await _fetch_order_with_items(db, id)
