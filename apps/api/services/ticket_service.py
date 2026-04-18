from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.lab import LabOrder
from models.opd import OpdBooking


async def generate_next_opd_ticket(db: AsyncSession) -> str:
    count = (await db.execute(select(func.count(OpdBooking.id)))).scalar_one() or 0
    return f"VIT-OPD-{count + 1:05d}"


async def generate_next_lab_ticket(db: AsyncSession) -> str:
    count = (await db.execute(select(func.count(LabOrder.id)))).scalar_one() or 0
    return f"VIT-LAB-{count + 1:05d}"
