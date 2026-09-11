from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from app.core.config import settings


password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    return password_hash.verify(
        plain_password,
        hashed_password
    )
def decode_access_token(
    token: str,
) -> UUID:
    """
    Decode an access token and return the user ID.

    This function can be reused by normal HTTP
    authentication and WebSocket authentication.
    """

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[
                settings.jwt_algorithm
            ],
        )

        if payload.get("type") != "access":
            raise InvalidTokenError(
                "Token is not an access token"
            )

        subject = payload.get("sub")

        if subject is None:
            raise InvalidTokenError(
                "Token subject is missing"
            )

        return UUID(str(subject))

    except (
        InvalidTokenError,
        ValueError,
        TypeError,
    ) as error:
        raise InvalidTokenError(
            "Invalid access token"
        ) from error

def create_access_token(user_id: UUID) -> str:
    current_time = datetime.now(timezone.utc)

    expires_at = current_time + timedelta(
        minutes=settings.access_token_expire_minutes
    )

    payload = {
        "sub": str(user_id),
        "type": "access",
        "iat": current_time,
        "exp": expires_at,
        "jti": str(uuid4())
    }

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )


def create_refresh_token(
    user_id: UUID,
    token_jti: UUID,
    family_id: UUID
) -> tuple[str, datetime]:
    current_time = datetime.now(timezone.utc)

    expires_at = current_time + timedelta(
        days=settings.refresh_token_expire_days
    )

    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "iat": current_time,
        "exp": expires_at,
        "jti": str(token_jti),
        "family_id": str(family_id)
    }

    token = jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )

    return token, expires_at