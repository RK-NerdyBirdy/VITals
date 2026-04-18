from datetime import datetime, time
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from models.doctor import DoctorType


class DoctorAvailabilityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    day_of_week: int
    start_time: time
    end_time: time
    max_patients: int


class DoctorCreate(BaseModel):
    name: str
    specialty: str
    type: DoctorType
    qualification: str | None = None
    affiliation: str | None = "VIT Health Centre"
    phone: str | None = None
    email: str | None = None
    fees: float = 0
    image_url: str | None = None
    bio: str | None = None


class DoctorUpdate(BaseModel):
    name: str | None = None
    specialty: str | None = None
    qualification: str | None = None
    affiliation: str | None = None
    phone: str | None = None
    email: str | None = None
    fees: float | None = None
    image_url: str | None = None
    bio: str | None = None
    is_active: bool | None = None


class DoctorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    specialty: str
    type: DoctorType
    qualification: str | None
    affiliation: str | None
    phone: str | None
    email: str | None
    fees: float
    image_url: str | None
    bio: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class DoctorDetailOut(DoctorOut):
    availabilities: list[DoctorAvailabilityOut] = Field(default_factory=list)
