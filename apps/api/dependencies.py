from collections.abc import Awaitable, Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db_session
from core.security import decode_jwt_token
from models.user import User, UserRole

DbSession = Annotated[AsyncSession, Depends(get_db_session)]


async def get_current_user(request: Request, db: DbSession) -> User:
    auth_header = request.headers.get("Authorization", "")
    user_email = request.headers.get("X-User-Email")
    user_id_header = request.headers.get("X-User-Id")

    if auth_header.startswith("Bearer "):
        payload = decode_jwt_token(auth_header.removeprefix("Bearer ").strip())
        user_email = payload.get("email") or payload.get("sub") or user_email

    stmt = None
    if user_email:
        stmt = select(User).where(User.email == user_email)
    elif user_id_header:
        try:
            stmt = select(User).where(User.id == UUID(user_id_header))
        except ValueError as exc:
            raise HTTPException(status_code=401, detail="Invalid user id header") from exc

    if stmt is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    user = (await db.execute(stmt)).scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    return user


def require_role(allowed_roles: list[UserRole | str]) -> Callable[[User], Awaitable[User]]:
    normalized = {UserRole(role) if isinstance(role, str) else role for role in allowed_roles}

    async def _checker(user: Annotated[User, Depends(get_current_user)]) -> User:
        if user.role not in normalized:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return _checker
