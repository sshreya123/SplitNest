from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import (
    create_user,
    get_user_by_email
)

from app.core.config import settings
from app.schemas.auth import (
    LoginRequest,
    TokenResponse
)
from app.services.user_service import authenticate_user
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.services.token_service import issue_token_pair
from app.services.token_service import (
    RefreshTokenError,
    issue_token_pair,
    revoke_refresh_session,
    rotate_refresh_token
)
from fastapi import Request, Response

router = APIRouter()
def set_refresh_cookie(
    response: Response,
    refresh_token: str
) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=refresh_token,
        max_age=(
            settings.refresh_token_expire_days
            * 24
            * 60
            * 60
        ),
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/api/v1/auth"
    )


def delete_refresh_cookie(
    response: Response
) -> None:
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/api/v1/auth"
    )

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
) -> UserResponse:
    normalized_email = str(user_data.email).lower()

    existing_user = get_user_by_email(
        db,
        normalized_email
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists"
        )

    try:
        return create_user(db, user_data)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists"
        )

@router.post(
    "/login",
    response_model=TokenResponse
)
def login_user(
    credentials: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
) -> TokenResponse:
    user = authenticate_user(
        db,
        str(credentials.email),
        credentials.password
    )
   

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    token_pair = issue_token_pair(
    db,
    user.id
)

    set_refresh_cookie(
    response,
    token_pair.refresh_token
)

    return TokenResponse(
    access_token=token_pair.access_token,
    token_type="bearer",
    expires_in=(
        settings.access_token_expire_minutes * 60
    )
)

    
@router.get(
    "/me",
    response_model=UserResponse
)
def get_authenticated_user(
    current_user: User = Depends(get_current_user)
) -> User:
    return current_user


@router.post(
    "/refresh",
    response_model=TokenResponse
)
def refresh_access_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
) -> TokenResponse:
    encoded_refresh_token = request.cookies.get(
        settings.refresh_cookie_name
    )

    if encoded_refresh_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is missing"
        )

    try:
        token_pair = rotate_refresh_token(
            db,
            encoded_refresh_token
        )

    except RefreshTokenError:
        delete_refresh_cookie(response)

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        ) from None

    set_refresh_cookie(
        response,
        token_pair.refresh_token
    )

    return TokenResponse(
        access_token=token_pair.access_token,
        token_type="bearer",
        expires_in=(
            settings.access_token_expire_minutes * 60
        )
    )
@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT
)
def logout_user(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
) -> None:
    encoded_refresh_token = request.cookies.get(
        settings.refresh_cookie_name
    )

    if encoded_refresh_token is not None:
        revoke_refresh_session(
            db,
            encoded_refresh_token
        )

    delete_refresh_cookie(response)