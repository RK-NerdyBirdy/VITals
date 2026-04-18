from datetime import date, datetime, time
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from models.opd import BookingStatus, SlotStatus


class SlotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    doctor_id: UUID
    date: date
    start_time: time
    end_time: time
    status: SlotStatus
    patient_id: UUID | None
    locked_until: datetime | None


class SlotLockResponse(BaseModel):
    lock_token: str
    expires_at: datetime


class SlotBookRequest(BaseModel):
    lock_token: str
    symptoms: str | None = None
    notes: str | None = None


class SpecialistAppointmentCreate(BaseModel):
    doctor_id: UUID
    booking_date: date
    booking_time: time
    symptoms: str | None = None
    notes: str | None = None


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    doctor_id: UUID
    booking_date: date
    booking_time: time
    status: BookingStatus
    symptoms: str | None
    notes: str | None
    qr_code_data: str | None
    qr_code_url: str | None
    ticket_number: str | None
    fees_paid: float | None
    created_at: datetime
    updated_at: datetime


class BookingStatusUpdate(BaseModel):
    status: BookingStatus
