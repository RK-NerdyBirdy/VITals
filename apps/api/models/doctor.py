from __future__ import annotations

import enum
from datetime import datetime, time
from uuid import UUID

from sqlalchemy import CheckConstraint, Enum, ForeignKey, Integer, Numeric, SmallInteger, Text, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base


class DoctorType(str, enum.Enum):
    GENERAL = "GENERAL"
    SPECIALIST = "SPECIALIST"


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    specialty: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[DoctorType] = mapped_column(
        Enum(DoctorType, name="doctor_type"),
        nullable=False,
    )
    qualification: Mapped[str | None] = mapped_column(Text, nullable=True)
    affiliation: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(Text, nullable=True)
    email: Mapped[str | None] = mapped_column(Text, nullable=True)
    fees: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False, default=0, server_default="0")
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default=text("now()")
    )
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default=text("now()"), onupdate=text("now()")
    )

    availabilities: Mapped[list[DoctorAvailability]] = relationship(
        back_populates="doctor", cascade="all, delete-orphan"
    )


class DoctorAvailability(Base):
    __tablename__ = "doctor_availability"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    doctor_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("doctors.id", ondelete="CASCADE"),
        nullable=False,
    )
    day_of_week: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    start_time: Mapped[time] = mapped_column(nullable=False)
    end_time: Mapped[time] = mapped_column(nullable=False)
    max_patients: Mapped[int] = mapped_column(Integer, default=20, server_default="20")

    doctor: Mapped[Doctor] = relationship(back_populates="availabilities")

    __table_args__ = (
        CheckConstraint("day_of_week BETWEEN 0 AND 6", name="ck_doctor_availability_day"),
    )
