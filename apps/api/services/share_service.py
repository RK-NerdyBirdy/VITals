from __future__ import annotations

import secrets
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import make_expiry
from models.record import RecordShareToken


async def create_share_token(
    db: AsyncSession,
    record_id: UUID,
    expires_in_minutes: int = 15,
    max_accesses: int = 1,
) -> RecordShareToken:
    token = secrets.token_urlsafe(24)
    share = RecordShareToken(
        record_id=record_id,
        token=token,
        expires_at=make_expiry(expires_in_minutes),
        max_accesses=max_accesses,
    )
    db.add(share)
    await db.commit()
    await db.refresh(share)
    return share


async def validate_share_token(db: AsyncSession, token: str) -> RecordShareToken:
    share = (await db.execute(select(RecordShareToken).where(RecordShareToken.token == token))).scalar_one_or_none()
    if share is None:
        raise HTTPException(status_code=404, detail="Invalid share token")

    now = datetime.now(timezone.utc)
    expiry = share.expires_at
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    if expiry < now:
        raise HTTPException(status_code=410, detail="Share token expired")

    if share.accessed_count >= share.max_accesses:
        raise HTTPException(status_code=410, detail="Share token exhausted")

    return share
