from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator
)


class UserCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned_name = value.strip()

        if len(cleaned_name) < 2:
            raise ValueError(
                "Name must contain at least 2 characters"
            )

        return cleaned_name

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(character.islower() for character in value):
            raise ValueError(
                "Password must contain a lowercase letter"
            )

        if not any(character.isupper() for character in value):
            raise ValueError(
                "Password must contain an uppercase letter"
            )

        if not any(character.isdigit() for character in value):
            raise ValueError(
                "Password must contain a number"
            )

        return value


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )