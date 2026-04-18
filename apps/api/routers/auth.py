from fastapi import APIRouter, Depends
from sqlalchemy import select

from core.config import get_settings
from dependencies import DbSession, get_current_user
from models.user import User, UserRole
from schemas.user import AuthVerifyTokenRequest, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def _derive_role(email: str) -> UserRole:
    admin_emails = {
        value.strip().lower() for value in settings.admin_emails.split(",") if value.strip()
    }
    lowered = email.lower()
    if lowered in admin_emails:
        return UserRole.ADMIN
    if lowered.endswith("@vit.ac.in"):
        return UserRole.FACULTY
    return UserRole.STUDENT


@router.post("/verify-token", response_model=UserOut)
async def verify_token(payload: AuthVerifyTokenRequest, db: DbSession) -> User:
    desired_role = _derive_role(payload.email)
    user = (await db.execute(select(User).where(User.email == payload.email))).scalar_one_or_none()

    if user is None:
        user = User(
            email=payload.email,
            name=payload.name,
            avatar_url=payload.avatar,
            role=desired_role,
        )
        db.add(user)
    else:
        user.name = payload.name
        user.avatar_url = payload.avatar
        if desired_role == UserRole.ADMIN and user.role != UserRole.ADMIN:
            user.role = UserRole.ADMIN

    await db.commit()
    await db.refresh(user)
    return user


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
