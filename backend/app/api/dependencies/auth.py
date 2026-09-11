from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer
)
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.dependencies import get_db
from app.models.user import User


bearer_scheme = HTTPBearer(
    auto_error=False
)


def create_authentication_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        }
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db)
) -> User:
    if credentials is None:
        raise create_authentication_error()

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )

        if payload.get("type") != "access":
            raise create_authentication_error()

        subject = payload.get("sub")

        if subject is None:
            raise create_authentication_error()

        user_id = UUID(subject)

    except (
        InvalidTokenError,
        ValueError,
        TypeError
    ):
        raise create_authentication_error()

    user = db.get(User, user_id)

    if user is None or not user.is_active:
        raise create_authentication_error()

    return user