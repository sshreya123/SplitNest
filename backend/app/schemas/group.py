from datetime import datetime
from uuid import UUID
from app.models.enums import GroupRole
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    EmailStr
)


class GroupCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=120
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    default_currency: str = Field(
        default="INR",
        min_length=3,
        max_length=3
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned_name = value.strip()

        if len(cleaned_name) < 2:
            raise ValueError(
                "Group name must contain at least 2 characters"
            )

        return cleaned_name

    @field_validator("description")
    @classmethod
    def clean_description(
        cls,
        value: str | None
    ) -> str | None:
        if value is None:
            return None

        cleaned_description = value.strip()

        return cleaned_description or None

    @field_validator("default_currency")
    @classmethod
    def validate_currency(cls, value: str) -> str:
        currency = value.strip().upper()

        if not currency.isalpha():
            raise ValueError(
                "Currency must contain exactly 3 letters"
            )

        return currency


class GroupResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    default_currency: str
    created_by_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )
class GroupListItem(BaseModel):
    id: UUID
    name: str
    description: str | None
    default_currency: str
    created_by_id: UUID
    current_user_role: GroupRole
    member_count: int
    created_at: datetime
    updated_at: datetime
class GroupMemberDetail(BaseModel):
    user_id: UUID
    name: str
    email: str
    role: GroupRole
    joined_at: datetime


class GroupDetailResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    default_currency: str
    created_by_id: UUID
    current_user_role: GroupRole
    member_count: int
    members: list[GroupMemberDetail]
    created_at: datetime
    updated_at: datetime
    
class GroupMemberAdd(BaseModel):
    email: EmailStr