from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import (
    BaseModel,
    Field,
    model_validator
)


class SettlementCreate(BaseModel):
    from_user_id: UUID
    to_user_id: UUID

    amount: Decimal = Field(
        gt=0,
        max_digits=12,
        decimal_places=2
    )

    note: str | None = Field(
        default=None,
        max_length=300
    )

    settlement_date: date = Field(
        default_factory=date.today
    )

    @model_validator(mode="after")
    def validate_different_users(
        self
    ):
        if (
            self.from_user_id ==
            self.to_user_id
        ):
            raise ValueError(
                "Sender and receiver must be different"
            )

        return self


class SettlementResponse(BaseModel):
    id: UUID
    group_id: UUID
    from_user_id: UUID
    from_user_name: str
    to_user_id: UUID
    to_user_name: str
    amount: Decimal
    currency: str
    note: str | None
    settlement_date: date
    created_by_id: UUID
    created_at: datetime