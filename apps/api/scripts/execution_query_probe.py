import asyncio
import traceback
from datetime import date, timedelta

from sqlalchemy import func, select

from core.config import get_settings
from core.database import SessionLocal
from models.doctor import Doctor, DoctorType
from models.opd import OpdSlot, SlotStatus
from models.user import User, UserRole
from services.slot_service import book_slot, lock_slot


async def main() -> None:
    settings = get_settings()
    print(f"admin_emails={settings.admin_emails}")

    async with SessionLocal() as db:
        target_user = (
            await db.execute(select(User).where(User.email == "robomaneet@gmail.com"))
        ).scalar_one_or_none()
        if target_user:
            print(
                f"user_lookup=email:robomaneet@gmail.com id={target_user.id} role={target_user.role.value} active={target_user.is_active}"
            )
        else:
            print("user_lookup=email:robomaneet@gmail.com not_found")

        student = (
            await db.execute(
                select(User)
                .where(User.role == UserRole.STUDENT, User.is_active.is_(True))
                .order_by(User.created_at)
                .limit(1)
            )
        ).scalar_one_or_none()

        doctor = (
            await db.execute(
                select(Doctor)
                .where(Doctor.type == DoctorType.GENERAL, Doctor.is_active.is_(True))
                .order_by(Doctor.created_at)
                .limit(1)
            )
        ).scalar_one_or_none()

        if student:
            print(f"student=id:{student.id} email={student.email}")
        else:
            print("student=none")

        if doctor:
            print(f"general_doctor=id:{doctor.id} name={doctor.name}")
        else:
            print("general_doctor=none")

        if not student or not doctor:
            print("booking_attempt=skipped reason=missing_student_or_general_doctor")
            return

        start_date = date.today()
        end_date = start_date + timedelta(days=7)

        available_filter = (
            OpdSlot.doctor_id == doctor.id,
            OpdSlot.status == SlotStatus.AVAILABLE,
            OpdSlot.date >= start_date,
            OpdSlot.date <= end_date,
        )

        available_count = (
            await db.execute(select(func.count(OpdSlot.id)).where(*available_filter))
        ).scalar_one()
        print(
            f"available_slots=doctor:{doctor.id} from:{start_date} to:{end_date} count={available_count}"
        )

        slot = (
            await db.execute(
                select(OpdSlot)
                .where(*available_filter)
                .order_by(OpdSlot.date, OpdSlot.start_time)
                .limit(1)
            )
        ).scalar_one_or_none()

        if slot is None:
            print("booking_attempt=skipped reason=no_available_slot")
            return

        print(
            f"slot_candidate=id:{slot.id} date={slot.date} start={slot.start_time} status={slot.status.value}"
        )

        lock_token, expires_at = await lock_slot(slot.id, student.id, db)
        print(f"lock_result=success token_prefix={lock_token[:8]} expires_at={expires_at.isoformat()}")

        booking = await book_slot(
            slot_id=slot.id,
            user_id=student.id,
            lock_token=lock_token,
            db=db,
            symptoms="Execution check",
            notes="Automated execution query",
        )
        print(
            f"book_result=success booking_id={booking.id} ticket={booking.ticket_number} status={booking.status.value}"
        )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:
        print(f"exception_type={type(exc).__name__}")
        traceback.print_exc()
