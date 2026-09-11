from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import (
    BaseModel,
    Field,
    field_validator,
        model_validator

)

from app.models.enums import SplitType
class ExpenseSplitInput(BaseModel):
    user_id: UUID

    amount: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2
    )

    percentage: Decimal | None = Field(
        default=None,
        ge=0,
        le=100,
        max_digits=5,
        decimal_places=2
    )

class ExpenseCreate(BaseModel):
    title: str = Field(
        min_length=2,
        max_length=150
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    total_amount: Decimal = Field(
        gt=0,
        max_digits=12,
        decimal_places=2
    )

    paid_by_id: UUID

    split_type: SplitType = (
        SplitType.EQUAL
    )

    # Used when split_type is "equal".
    participant_ids: list[UUID] = Field(
        default_factory=list
    )

    # Used for exact and percentage splits.
    splits: list[ExpenseSplitInput] = Field(
        default_factory=list
    )

    expense_date: date = Field(
        default_factory=date.today
    )

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        title = value.strip()

        if len(title) < 2:
            raise ValueError(
                "Expense title must contain "
                "at least 2 characters"
            )

        return title

    @field_validator("description")
    @classmethod
    def clean_description(
        cls,
        value: str | None
    ) -> str | None:
        if value is None:
            return None

        description = value.strip()

        return description or None

    @model_validator(mode="after")
    def validate_split_details(self):
        if self.split_type == SplitType.EQUAL:
            if not self.participant_ids:
                raise ValueError(
                    "Select at least one participant"
                )

            if (
                len(self.participant_ids) !=
                len(set(self.participant_ids))
            ):
                raise ValueError(
                    "Participants must not "
                    "contain duplicates"
                )

            return self

        if not self.splits:
            raise ValueError(
                "Split details are required"
            )

        split_user_ids = [
            split.user_id
            for split in self.splits
        ]

        if (
            len(split_user_ids) !=
            len(set(split_user_ids))
        ):
            raise ValueError(
                "Split members must not "
                "contain duplicates"
            )

        if self.split_type == SplitType.EXACT:
            if any(
                split.amount is None
                for split in self.splits
            ):
                raise ValueError(
                    "Every exact split must "
                    "have an amount"
                )

            exact_total = sum(
                (
                    split.amount
                    or Decimal("0.00")
                    for split in self.splits
                ),
                Decimal("0.00")
            )

            if (
                exact_total.quantize(
                    Decimal("0.01")
                )
                !=
                self.total_amount.quantize(
                    Decimal("0.01")
                )
            ):
                raise ValueError(
                    "Exact split amounts must "
                    "equal the total expense amount"
                )

        if (
            self.split_type ==
            SplitType.PERCENTAGE
        ):
            if any(
                split.percentage is None
                for split in self.splits
            ):
                raise ValueError(
                    "Every percentage split must "
                    "have a percentage"
                )

            percentage_total = sum(
                (
                    split.percentage
                    or Decimal("0.00")
                    for split in self.splits
                ),
                Decimal("0.00")
            )

            if (
                percentage_total.quantize(
                    Decimal("0.01")
                )
                != Decimal("100.00")
            ):
                raise ValueError(
                    "Percentage splits must "
                    "total exactly 100"
                )

        return self
class ExpenseSplitResponse(BaseModel):
    user_id: UUID
    name: str
    amount: Decimal
    percentage: Decimal | None = None


class ExpenseResponse(BaseModel):
    id: UUID
    group_id: UUID
    title: str
    description: str | None
    total_amount: Decimal
    currency: str
    split_type: SplitType
    paid_by_id: UUID
    paid_by_name: str
    created_by_id: UUID
    expense_date: date
    splits: list[ExpenseSplitResponse]
    created_at: datetime
    updated_at: datetime
    
class MemberBalanceResponse(BaseModel):
    user_id: UUID
    name: str
    total_paid: Decimal
    total_share: Decimal
    net_balance: Decimal


class GroupBalanceResponse(BaseModel):
    group_id: UUID
    currency: str
    total_expenses: Decimal
    members: list[MemberBalanceResponse]
    
class DebtSuggestionResponse(BaseModel):
    from_user_id: UUID
    from_user_name: str
    to_user_id: UUID
    to_user_name: str
    amount: Decimal


class GroupDebtSimplificationResponse(BaseModel):
    group_id: UUID
    currency: str
    suggestions: list[DebtSuggestionResponse]