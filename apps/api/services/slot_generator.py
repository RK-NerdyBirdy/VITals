from __future__ import annotations

from datetime import date, datetime, time, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.opd import OpdSlot, SlotStatus


async def generate_gp_slots(
    db: AsyncSession,
    doctor_id: UUID,
    start_date: date,
    end_date: date,
    start_time: time,
    end_time: time,
    slot_minutes: int = 15,
) -> int:
    if end_date < start_date:
        raise ValueError("end_date must be on or after start_date")

    existing = await db.execute(
        select(OpdSlot.date, OpdSlot.start_time).where(
            OpdSlot.doctor_id == doctor_id,
            OpdSlot.date >= start_date,
            OpdSlot.date <= end_date,
        )
    )
    existing_map = {(row[0], row[1]) for row in existing.all()}

    current = start_date
    created = 0
    while current <= end_date:
        cursor = datetime.combine(current, start_time)
        end_cursor = datetime.combine(current, end_time)

        while cursor + timedelta(minutes=slot_minutes) <= end_cursor:
            slot_start = cursor.time()
            slot_end = (cursor + timedelta(minutes=slot_minutes)).time()

            if (current, slot_start) not in existing_map:
                db.add(
                    OpdSlot(
                        doctor_id=doctor_id,
                        date=current,
                        start_time=slot_start,
                        end_time=slot_end,
                        status=SlotStatus.AVAILABLE,
                    )
                )
                created += 1

            cursor += timedelta(minutes=slot_minutes)

        current += timedelta(days=1)

    await db.commit()
    return created
