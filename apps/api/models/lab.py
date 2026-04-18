from __future__ import annotations

import enum
from datetime import date, datetime, time
from uuid import UUID

from sqlalchemy import Boolean, Date, Enum, ForeignKey, Index, Integer, Numeric, Text, Time, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    SAMPLE_COLLECTED = "SAMPLE_COLLECTED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class LabTest(Base):
    __tablename__ = "lab_tests"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    preparation: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    is_profile: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    turnaround_hrs: Mapped[int] = mapped_column(Integer, default=24, server_default="24")
    category: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=text("now()"))


class LabTestProfileItem(Base):
    __tablename__ = "lab_test_profile_items"

    profile_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("lab_tests.id", ondelete="CASCADE"),
        primary_key=True,
    )
    test_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("lab_tests.id", ondelete="CASCADE"),
        primary_key=True,
    )


class LabOrder(Base):
    __tablename__ = "lab_orders"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    patient_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="order_status"),
        default=OrderStatus.PENDING,
        server_default=OrderStatus.PENDING.value,
    )
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    appointment_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    appointment_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    qr_code_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    qr_code_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    ticket_number: Mapped[str | None] = mapped_column(Text, unique=True, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default=text("now()"), onupdate=text("now()")
    )

    __table_args__ = (Index("idx_orders_patient", "patient_id"),)

    items: Mapped[list["LabOrderItem"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
    )


class LabOrderItem(Base):
    __tablename__ = "lab_order_items"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    order_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("lab_orders.id", ondelete="CASCADE"),
        nullable=False,
    )
    test_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("lab_tests.id"), nullable=False
    )
    price_at_order: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=text("now()"))

    order: Mapped[LabOrder] = relationship(back_populates="items")
    test: Mapped[LabTest] = relationship()
