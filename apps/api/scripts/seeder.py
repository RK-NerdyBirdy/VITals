from __future__ import annotations

import argparse
import asyncio
import random
import secrets
import sys
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from core.config import get_settings
from core.database import SessionLocal
from core.security import encrypt_file, store_data_key
from models.doctor import Doctor, DoctorAvailability, DoctorType
from models.lab import LabOrder, LabOrderItem, LabTest, LabTestProfileItem, OrderStatus
from models.opd import BookingStatus, OpdBooking, OpdSlot, SlotStatus
from models.record import MedicalRecord, RecordShareToken, RecordType
from models.user import User, UserRole

FIRST_NAMES = [
    "Aarav",
    "Nisha",
    "Rahul",
    "Priya",
    "Arjun",
    "Diya",
    "Varun",
    "Meera",
    "Kavin",
    "Ishita",
    "Vignesh",
    "Ananya",
    "Riya",
    "Aditya",
    "Sanjana",
]

LAST_NAMES = [
    "Kumar",
    "Rajan",
    "Menon",
    "Sharma",
    "Iyer",
    "Balaji",
    "Krishnan",
    "Natarajan",
    "Mohan",
    "Reddy",
    "Bose",
]

DOCTOR_SPECIALTIES = [
    "General Medicine",
    "Dermatology",
    "Orthopedics",
    "Cardiology",
    "ENT",
    "Psychiatry",
    "Pediatrics",
    "Gynecology",
]

LAB_TEST_TEMPLATES = [
    ("Complete Blood Count", "Haematology", 320, "Hydrate well before sample collection."),
    ("Liver Function Test", "Biochemistry", 560, "Avoid alcohol for 24 hours before the test."),
    ("Kidney Function Test", "Biochemistry", 620, "Drink water unless instructed otherwise."),
    ("Lipid Profile", "Cardiac", 640, "Fast for 10-12 hours."),
    ("HbA1c", "Diabetes", 430, "No fasting required."),
    ("Thyroid Panel", "Hormonal", 690, "Morning sample preferred."),
    ("Vitamin D", "Nutritional", 890, "No preparation needed."),
    ("Vitamin B12", "Nutritional", 750, "No preparation needed."),
    ("CRP", "Inflammation", 460, "No preparation needed."),
    ("Urine Routine", "Pathology", 210, "Collect first morning sample if possible."),
]

PROFILE_TEMPLATES = [
    ("Diabetes Profile", "Diabetes"),
    ("Heart Risk Profile", "Cardiac"),
    ("Annual Wellness Profile", "General"),
]


@dataclass
class SeedSummary:
    users: int = 0
    doctors: int = 0
    slots: int = 0
    bookings: int = 0
    tests: int = 0
    orders: int = 0
    records: int = 0
    share_tokens: int = 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed VITals development database with coherent dummy data.")
    parser.add_argument("--reset", action="store_true", help="Delete existing rows before inserting seed data.")
    parser.add_argument("--db-url", type=str, help="Optional override for DATABASE_URL.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for deterministic output.")
    parser.add_argument("--students", type=int, default=12, help="Number of student users.")
    parser.add_argument("--faculty", type=int, default=4, help="Number of faculty users.")
    parser.add_argument("--doctors", type=int, default=8, help="Number of doctors.")
    parser.add_argument(
        "--days",
        type=int,
        default=7,
        help="Number of upcoming days considered when generating baseline OPD slots.",
    )
    parser.add_argument("--records-per-student", type=int, default=1, help="Maximum records generated per student.")
    parser.add_argument("--skip-records", action="store_true", help="Skip medical record and share token generation.")
    return parser.parse_args()


def _random_name() -> str:
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def _iter_time_slots(start_at: time, end_at: time, minutes: int) -> list[tuple[time, time]]:
    slots: list[tuple[time, time]] = []
    cursor = datetime.combine(date.today(), start_at)
    end_dt = datetime.combine(date.today(), end_at)

    while cursor + timedelta(minutes=minutes) <= end_dt:
        next_cursor = cursor + timedelta(minutes=minutes)
        slots.append((cursor.time(), next_cursor.time()))
        cursor = next_cursor

    return slots


def _build_session_factory(db_url: str | None) -> tuple[async_sessionmaker[AsyncSession], AsyncEngine | None]:
    if not db_url:
        return SessionLocal, None

    engine = create_async_engine(db_url, pool_pre_ping=True, future=True)
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False), engine


async def reset_database(db: AsyncSession) -> None:
    # Reverse dependency order prevents FK violations.
    for model in [
        RecordShareToken,
        MedicalRecord,
        LabOrderItem,
        LabOrder,
        LabTestProfileItem,
        LabTest,
        OpdBooking,
        OpdSlot,
        DoctorAvailability,
        Doctor,
        User,
    ]:
        await db.execute(delete(model))

    await db.commit()


async def create_users(db: AsyncSession, faculty_count: int, student_count: int) -> tuple[User, list[User], list[User]]:
    settings = get_settings()
    admin_email = settings.admin_emails.split(",")[0].strip().lower() or "admin@vit.ac.in"

    admin = User(
        email=admin_email,
        name="VIT Admin",
        role=UserRole.ADMIN,
        department="Health Operations",
        phone="+91-44-4000-1000",
        is_active=True,
    )
    db.add(admin)

    faculty_users: list[User] = []
    for idx in range(1, max(0, faculty_count) + 1):
        faculty = User(
            email=f"faculty{idx:03d}@vit.ac.in",
            name=_random_name(),
            role=UserRole.FACULTY,
            department=random.choice(["CSE", "ECE", "Mechanical", "Civil", "Biotech"]),
            phone=f"+91-88000{idx:05d}",
            is_active=True,
        )
        db.add(faculty)
        faculty_users.append(faculty)

    await db.flush()

    student_users: list[User] = []
    for idx in range(1, max(0, student_count) + 1):
        parent = random.choice(faculty_users) if faculty_users and random.random() < 0.3 else None
        student = User(
            email=f"student{idx:04d}@vitstudent.ac.in",
            name=_random_name(),
            role=UserRole.STUDENT,
            reg_number=f"22BCE{idx:04d}",
            department=random.choice(["CSE", "ECE", "EEE", "IT", "Civil"]),
            parent_id=parent.id if parent else None,
            phone=f"+91-99000{idx:05d}",
            is_active=True,
        )
        db.add(student)
        student_users.append(student)

    await db.flush()
    return admin, faculty_users, student_users


async def create_doctors(db: AsyncSession, doctor_count: int) -> list[Doctor]:
    doctors: list[Doctor] = []

    for idx in range(1, max(0, doctor_count) + 1):
        doctor_type = DoctorType.SPECIALIST if idx % 3 == 0 else DoctorType.GENERAL
        specialty = random.choice(DOCTOR_SPECIALTIES)

        doctor = Doctor(
            name=f"Dr. {_random_name()}",
            specialty=specialty,
            type=doctor_type,
            qualification=random.choice(["MBBS", "MD", "MS", "DNB"]),
            affiliation="VIT Health Centre",
            email=f"doctor{idx:03d}@vit.ac.in",
            phone=f"+91-87000{idx:05d}",
            fees=round(random.uniform(120, 220), 2) if doctor_type == DoctorType.GENERAL else round(random.uniform(350, 850), 2),
            bio=f"{specialty} consultant available for campus OPD.",
            is_active=True,
        )
        db.add(doctor)
        doctors.append(doctor)

    await db.flush()

    for doctor in doctors:
        windows = [
            (time(hour=9, minute=0), time(hour=13, minute=0)),
            (time(hour=14, minute=0), time(hour=16, minute=0)),
        ]
        if doctor.type == DoctorType.SPECIALIST:
            windows = [(time(hour=10, minute=0), time(hour=13, minute=0))]

        for day in range(0, 5):
            for start_at, end_at in windows:
                db.add(
                    DoctorAvailability(
                        doctor_id=doctor.id,
                        day_of_week=day,
                        start_time=start_at,
                        end_time=end_at,
                        max_patients=20,
                    )
                )

    await db.flush()
    return doctors


async def create_gp_slots(db: AsyncSession, doctors: list[Doctor], days: int) -> list[OpdSlot]:
    created: list[OpdSlot] = []
    active_doctors = [doctor for doctor in doctors if doctor.is_active]
    baseline_slots = [
        (time(hour=9, minute=0), time(hour=9, minute=15)),
        (time(hour=9, minute=15), time(hour=9, minute=30)),
        (time(hour=9, minute=30), time(hour=9, minute=45)),
        (time(hour=9, minute=45), time(hour=10, minute=0)),
        (time(hour=10, minute=0), time(hour=10, minute=15)),
    ]

    for doctor in active_doctors:
        created_for_doctor = 0
        day_offset = 0
        max_scan_days = max(1, days) * 3

        while created_for_doctor < 5 and day_offset < max_scan_days:
            target_date = date.today() + timedelta(days=day_offset)
            day_offset += 1
            if target_date.weekday() == 6:
                continue

            for start_time, end_time in baseline_slots:
                if created_for_doctor >= 5:
                    break

                slot = OpdSlot(
                    doctor_id=doctor.id,
                    date=target_date,
                    start_time=start_time,
                    end_time=end_time,
                    status=SlotStatus.AVAILABLE,
                )
                db.add(slot)
                created.append(slot)
                created_for_doctor += 1

    await db.flush()
    return created


async def create_bookings(db: AsyncSession, students: list[User], doctors: list[Doctor], slots: list[OpdSlot]) -> int:
    if not students or not slots:
        return 0

    booked_count = 0
    ticket_counter = 1

    available_slots = [slot for slot in slots if slot.status == SlotStatus.AVAILABLE]
    random.shuffle(available_slots)
    slot_sample = available_slots[: min(len(available_slots), max(6, len(students) // 2))]

    for slot in slot_sample:
        patient = random.choice(students)
        status = random.choice([BookingStatus.CONFIRMED, BookingStatus.CONFIRMED, BookingStatus.COMPLETED])

        slot.status = SlotStatus.BOOKED
        slot.patient_id = patient.id

        db.add(
            OpdBooking(
                patient_id=patient.id,
                doctor_id=slot.doctor_id,
                booking_date=slot.date,
                booking_time=slot.start_time,
                status=status,
                symptoms=random.choice(["Headache", "Fever", "Allergy", "Follow-up"]),
                notes="Generated by seeder.py",
                qr_code_data=f'{{"type":"opd_booking","ticket":"VIT-OPD-{ticket_counter:05d}"}}',
                qr_code_url=f"opd/VIT-OPD-{ticket_counter:05d}.png",
                ticket_number=f"VIT-OPD-{ticket_counter:05d}",
                fees_paid=next((float(doc.fees) for doc in doctors if doc.id == slot.doctor_id), None),
            )
        )
        booked_count += 1
        ticket_counter += 1

    specialists = [doctor for doctor in doctors if doctor.type == DoctorType.SPECIALIST and doctor.is_active]
    random.shuffle(specialists)

    for doctor in specialists[: min(len(specialists), max(2, len(students) // 5))]:
        patient = random.choice(students)
        booking_date = date.today() + timedelta(days=random.randint(1, 10))
        booking_time = random.choice([time(hour=10, minute=0), time(hour=11, minute=30), time(hour=15, minute=0)])

        db.add(
            OpdBooking(
                patient_id=patient.id,
                doctor_id=doctor.id,
                booking_date=booking_date,
                booking_time=booking_time,
                status=BookingStatus.CONFIRMED,
                symptoms=random.choice(["Consultation", "Pain management", "Follow-up"]),
                notes="Specialist appointment generated by seeder.py",
                qr_code_data=f'{{"type":"opd_booking","ticket":"VIT-OPD-{ticket_counter:05d}"}}',
                qr_code_url=f"opd/VIT-OPD-{ticket_counter:05d}.png",
                ticket_number=f"VIT-OPD-{ticket_counter:05d}",
                fees_paid=float(doctor.fees),
            )
        )
        booked_count += 1
        ticket_counter += 1

    await db.flush()
    return booked_count


async def create_lab_catalog(db: AsyncSession) -> list[LabTest]:
    tests: list[LabTest] = []

    for name, category, price, preparation in LAB_TEST_TEMPLATES:
        test = LabTest(
            name=name,
            category=category,
            price=price,
            preparation=preparation,
            description=f"{name} diagnostic panel.",
            turnaround_hrs=random.choice([12, 24, 36]),
            is_profile=False,
            is_active=True,
        )
        db.add(test)
        tests.append(test)

    await db.flush()

    base_tests = [test for test in tests if not test.is_profile]
    for profile_name, category in PROFILE_TEMPLATES:
        selected = random.sample(base_tests, k=3)
        profile = LabTest(
            name=profile_name,
            category=category,
            price=round(sum(float(item.price) for item in selected) * 0.9, 2),
            preparation="Includes multiple tests. Follow individual preparation notes.",
            description=", ".join(item.name for item in selected),
            turnaround_hrs=24,
            is_profile=True,
            is_active=True,
        )
        db.add(profile)
        await db.flush()

        for item in selected:
            db.add(LabTestProfileItem(profile_id=profile.id, test_id=item.id))

        tests.append(profile)

    await db.flush()
    return tests


async def create_lab_orders(db: AsyncSession, students: list[User], tests: list[LabTest]) -> int:
    if not students or not tests:
        return 0

    orders_created = 0
    candidates = random.sample(students, k=min(len(students), max(4, len(students) // 2)))

    for idx, student in enumerate(candidates, start=1):
        selected = random.sample(tests, k=random.randint(1, min(3, len(tests))))
        total_amount = round(sum(float(test.price) for test in selected), 2)

        order = LabOrder(
            patient_id=student.id,
            status=random.choice(
                [
                    OrderStatus.PENDING,
                    OrderStatus.SAMPLE_COLLECTED,
                    OrderStatus.PROCESSING,
                    OrderStatus.COMPLETED,
                ]
            ),
            total_amount=total_amount,
            appointment_date=date.today() + timedelta(days=random.randint(0, 7)),
            appointment_time=random.choice([time(hour=8, minute=30), time(hour=9, minute=15), time(hour=10, minute=0)]),
            ticket_number=f"VIT-LAB-{idx:05d}",
            notes="Generated by seeder.py",
            qr_code_data=f'{{"type":"lab_order","ticket":"VIT-LAB-{idx:05d}"}}',
            qr_code_url=f"lab/VIT-LAB-{idx:05d}.png",
        )
        db.add(order)
        await db.flush()

        for test in selected:
            db.add(
                LabOrderItem(
                    order_id=order.id,
                    test_id=test.id,
                    price_at_order=float(test.price),
                )
            )

        orders_created += 1

    await db.flush()
    return orders_created


async def create_records_and_shares(
    db: AsyncSession,
    admin_user: User,
    students: list[User],
    max_per_student: int,
    skip_records: bool,
) -> tuple[int, int]:
    if skip_records or not students or max_per_student <= 0:
        return 0, 0

    try:
        from core.storage import get_storage
    except ModuleNotFoundError:
        print("Storage dependencies unavailable. Skipping medical record seeding.")
        return 0, 0

    storage = get_storage()
    try:
        await storage.ensure_bucket()
    except Exception:
        print("Storage bucket unavailable. Skipping medical record seeding.")
        return 0, 0

    records_created = 0
    shares_created = 0
    created_records: list[MedicalRecord] = []

    for student in students:
        per_student_count = max_per_student if max_per_student == 1 else random.randint(1, max_per_student)
        for _ in range(per_student_count):
            record_type = random.choice(list(RecordType))
            payload = (
                f"Generated medical record\n"
                f"Patient: {student.name}\n"
                f"Patient ID: {student.id}\n"
                f"Type: {record_type.value}\n"
                f"Created At: {datetime.now(timezone.utc).isoformat()}\n"
            ).encode("utf-8")

            encrypted_data, key = encrypt_file(payload)
            key_ref = store_data_key(key)
            object_key = f"records/{student.id}/{secrets.token_hex(8)}.txt"

            await storage.upload_bytes(
                key=object_key,
                data=encrypted_data,
                content_type="text/plain",
            )

            record = MedicalRecord(
                patient_id=student.id,
                uploaded_by=admin_user.id,
                type=record_type,
                title=f"{record_type.value.replace('_', ' ').title()} #{records_created + 1}",
                description="Seeded sample record for local development.",
                file_path=object_key,
                encryption_key_ref=key_ref,
                file_size_bytes=len(payload),
                mime_type="text/plain",
                is_active=True,
            )
            db.add(record)
            created_records.append(record)
            records_created += 1

    await db.flush()

    for record in created_records:
        if random.random() < 0.5:
            db.add(
                RecordShareToken(
                    record_id=record.id,
                    token=secrets.token_urlsafe(18),
                    expires_at=datetime.now(timezone.utc) + timedelta(hours=12),
                    max_accesses=random.choice([1, 2]),
                )
            )
            shares_created += 1

    await db.flush()
    return records_created, shares_created


async def run_seed(args: argparse.Namespace) -> SeedSummary:
    random.seed(args.seed)

    session_factory, engine = _build_session_factory(args.db_url)

    try:
        async with session_factory() as db:
            if args.reset:
                await reset_database(db)

            admin, faculty_users, students = await create_users(db, args.faculty, args.students)
            doctors = await create_doctors(db, args.doctors)
            slots = await create_gp_slots(db, doctors, args.days)
            tests = await create_lab_catalog(db)

            bookings_count = await create_bookings(db, students, doctors, slots)
            orders_count = await create_lab_orders(db, students, tests)
            records_count, share_tokens_count = await create_records_and_shares(
                db,
                admin,
                students,
                args.records_per_student,
                args.skip_records,
            )

            await db.commit()

            return SeedSummary(
                users=1 + len(faculty_users) + len(students),
                doctors=len(doctors),
                slots=len(slots),
                bookings=bookings_count,
                tests=len(tests),
                orders=orders_count,
                records=records_count,
                share_tokens=share_tokens_count,
            )
    finally:
        if engine is not None:
            await engine.dispose()


async def main() -> None:
    args = parse_args()
    summary = await run_seed(args)

    print("Seed complete.")
    print(f"Users: {summary.users}")
    print(f"Doctors: {summary.doctors}")
    print(f"OPD Slots: {summary.slots}")
    print(f"OPD Bookings: {summary.bookings}")
    print(f"Lab Tests (including profiles): {summary.tests}")
    print(f"Lab Orders: {summary.orders}")
    print(f"Medical Records: {summary.records}")
    print(f"Record Share Tokens: {summary.share_tokens}")


if __name__ == "__main__":
    asyncio.run(main())
