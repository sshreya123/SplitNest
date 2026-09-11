from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID, uuid4

import jwt
from jwt.exceptions import InvalidTokenError
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token
)
from app.models.refresh_token import RefreshToken
from app.models.user import User


@dataclass
class TokenPair:
    access_token: str
    refresh_token: str


class RefreshTokenError(Exception):
    pass


def issue_token_pair(
    db: Session,
    user_id: UUID,
    family_id: UUID | None = None
) -> TokenPair:
    refresh_jti = uuid4()

    current_family_id = (
        family_id if family_id is not None else uuid4()
    )

    access_token = create_access_token(user_id)

    refresh_token, refresh_expires_at = (
        create_refresh_token(
            user_id=user_id,
            token_jti=refresh_jti,
            family_id=current_family_id
        )
    )

    refresh_token_record = RefreshToken(
        jti=refresh_jti,
        family_id=current_family_id,
        user_id=user_id,
        expires_at=refresh_expires_at
    )

    db.add(refresh_token_record)
    db.commit()

    return TokenPair(
        access_token=access_token,
        refresh_token=refresh_token
    )


def revoke_token_family(
    db: Session,
    family_id: UUID,
    revoked_at: datetime
) -> None:
    statement = (
        update(RefreshToken)
        .where(
            RefreshToken.family_id == family_id,
            RefreshToken.revoked_at.is_(None)
        )
        .values(revoked_at=revoked_at)
    )

    db.execute(statement)
    db.commit()


def rotate_refresh_token(
    db: Session,
    encoded_refresh_token: str
) -> TokenPair:
    current_time = datetime.now(timezone.utc)

    try:
        payload = jwt.decode(
            encoded_refresh_token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )

        if payload.get("type") != "refresh":
            raise RefreshTokenError()

        user_id = UUID(payload["sub"])
        token_jti = UUID(payload["jti"])
        family_id = UUID(payload["family_id"])

    except (
        InvalidTokenError,
        KeyError,
        ValueError,
        TypeError
    ):
        raise RefreshTokenError() from None

    statement = select(RefreshToken).where(
        RefreshToken.jti == token_jti
    )

    stored_token = db.scalar(statement)

    if stored_token is None:
        raise RefreshTokenError()

    if (
        stored_token.user_id != user_id
        or stored_token.family_id != family_id
    ):
        raise RefreshTokenError()

    if stored_token.revoked_at is not None:
        revoke_token_family(
            db,
            family_id,
            current_time
        )

        raise RefreshTokenError()

    if stored_token.expires_at <= current_time:
        stored_token.revoked_at = current_time
        db.commit()

        raise RefreshTokenError()

    user = db.get(User, user_id)

    if user is None or not user.is_active:
        revoke_token_family(
            db,
            family_id,
            current_time
        )

        raise RefreshTokenError()

    stored_token.revoked_at = current_time

    new_refresh_jti = uuid4()

    new_access_token = create_access_token(
        user_id
    )

    new_refresh_token, new_expires_at = (
        create_refresh_token(
            user_id=user_id,
            token_jti=new_refresh_jti,
            family_id=family_id
        )
    )

    new_token_record = RefreshToken(
        jti=new_refresh_jti,
        family_id=family_id,
        user_id=user_id,
        expires_at=new_expires_at
    )

    db.add(new_token_record)
    db.commit()

    return TokenPair(
        access_token=new_access_token,
        refresh_token=new_refresh_token
    )
def revoke_refresh_session(
    db: Session,
    encoded_refresh_token: str
) -> None:
    current_time = datetime.now(timezone.utc)

    try:
        payload = jwt.decode(
            encoded_refresh_token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            options={
                "verify_exp": False
            }
        )

        if payload.get("type") != "refresh":
            return

        user_id = UUID(payload["sub"])
        token_jti = UUID(payload["jti"])
        family_id = UUID(payload["family_id"])

    except (
        InvalidTokenError,
        KeyError,
        ValueError,
        TypeError
    ):
        return

    statement = select(RefreshToken).where(
        RefreshToken.jti == token_jti
    )

    stored_token = db.scalar(statement)

    if stored_token is None:
        return

    if (
        stored_token.user_id != user_id
        or stored_token.family_id != family_id
    ):
        return

    revoke_token_family(
        db,
        family_id,
        current_time
    )