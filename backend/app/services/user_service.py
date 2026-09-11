from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import hash_password, verify_password

def get_user_by_email(
    db: Session,
    email: str
) -> User | None:
    statement = select(User).where(
        User.email == email
    )

    return db.scalar(statement)

def authenticate_user(
    db: Session,
    email: str,
    password: str
) -> User | None:
    normalized_email = email.lower()

    user = get_user_by_email(
        db,
        normalized_email
    )

    if user is None:
        return None

    if not verify_password(
        password,
        user.password_hash
    ):
        return None

    if not user.is_active:
        return None

    return user
def create_user(
    db: Session,
    user_data: UserCreate
) -> User:
    normalized_email = str(user_data.email).lower()

    user = User(
        name=user_data.name,
        email=normalized_email,
        password_hash=hash_password(user_data.password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user