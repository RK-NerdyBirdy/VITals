from datetime import date, datetime, time
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from models.lab import OrderStatus


class LabTestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None
    preparation: str | None
    price: float
    is_profile: bool
    turnaround_hrs: int
    category: str | None
    is_active: bool
    created_at: datetime


class LabTestMiniOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    category: str | None
    is_profile: bool


class LabTestDetailOut(LabTestOut):
    profile_item_ids: list[UUID] = Field(default_factory=list)
    profile_items: list[LabTestMiniOut] = Field(default_factory=list)


class LabOrderCreate(BaseModel):
    test_ids: list[UUID] = Field(min_length=1)
    appointment_date: date | None = None
    appointment_time: time | None = None
    notes: str | None = None


class LabOrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    test_id: UUID
    price_at_order: float
    created_at: datetime
    test: LabTestMiniOut | None = None


class LabOrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    status: OrderStatus
    total_amount: float
    appointment_date: date | None
    appointment_time: time | None
    qr_code_data: str | None
    qr_code_url: str | None
    ticket_number: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
    items: list[LabOrderItemOut] = Field(default_factory=list)


class LabOrderStatusUpdate(BaseModel):
    status: OrderStatus


class AdminLabTestCreate(BaseModel):
    name: str
    description: str | None = None
    preparation: str | None = None
    price: float = Field(ge=0)
    is_profile: bool = False
    turnaround_hrs: int = Field(default=24, ge=1)
    category: str | None = None
    is_active: bool = True
    profile_item_ids: list[UUID] = Field(default_factory=list)


class AdminLabTestUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    preparation: str | None = None
    price: float | None = Field(default=None, ge=0)
    is_profile: bool | None = None
    turnaround_hrs: int | None = Field(default=None, ge=1)
    category: str | None = None
    is_active: bool | None = None
    profile_item_ids: list[UUID] | None = None
