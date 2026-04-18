from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from dependencies import DbSession, get_current_user, require_role
from models.user import User, UserRole
from schemas.user import FamilyMemberCreate, UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{id}/family", response_model=list[UserOut])
async def list_family_members(
    id: UUID,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[User]:
    if current_user.id != id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Cannot access family for another account")

    members = (
        await db.execute(select(User).where(User.parent_id == id).order_by(User.created_at.desc()))
    ).scalars().all()
    return list(members)


@router.post("/{id}/family", response_model=UserOut)
async def add_family_member(
    id: UUID,
    payload: FamilyMemberCreate,
    db: DbSession,
    current_user: Annotated[User, Depends(require_role([UserRole.FACULTY]))],
) -> User:
    if current_user.id != id:
        raise HTTPException(status_code=403, detail="Cannot add family for another faculty account")

    existing = (await db.execute(select(User).where(User.email == payload.email))).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=409, detail="Email already in use")

    member = User(
        email=payload.email,
        name=payload.name,
        phone=payload.phone,
        reg_number=payload.reg_number,
        role=UserRole.STUDENT,
        parent_id=current_user.id,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)

    return member


@router.delete("/{id}/family/{member_id}")
async def remove_family_member(
    id: UUID,
    member_id: UUID,
    db: DbSession,
    current_user: Annotated[User, Depends(require_role([UserRole.FACULTY]))],
) -> dict[str, str]:
    if current_user.id != id:
        raise HTTPException(status_code=403, detail="Cannot delete family for another faculty account")

    member = (
        await db.execute(select(User).where(User.id == member_id, User.parent_id == current_user.id))
    ).scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=404, detail="Family member not found")

    await db.delete(member)
    await db.commit()
    return {"detail": "Family member removed"}


@router.get("/{id}", response_model=UserOut)
async def get_user_by_id(
    id: UUID,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if current_user.id != id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Cannot access another profile")

    user = (await db.execute(select(User).where(User.id == id))).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user
