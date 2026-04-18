from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr

from models.user import UserRole


class AuthVerifyTokenRequest(BaseModel):
    email: EmailStr
    name: str
    avatar: str | None = None


class FamilyMemberCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    reg_number: str | None = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    name: str
    phone: str | None
    role: UserRole
    avatar_url: str | None
    reg_number: str | None
    department: str | None
    parent_id: UUID | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
