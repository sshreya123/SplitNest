from datetime import date
from decimal import Decimal
from uuid import uuid4

from app.models.enums import SplitType
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseSplitInput,
)
from app.services.expense_service import (
    ExpenseParticipantNotMemberError,
    calculate_expense_splits,
)
import pytest

from pydantic import ValidationError

def test_equal_split_between_two_members():
    """
    A 1000 rupee expense shared by two people
    should give each person a 500 rupee share.
    """

    first_user_id = uuid4()
    second_user_id = uuid4()

    group_member_ids = {
        first_user_id,
        second_user_id,
    }

    expense_data = ExpenseCreate(
        title="Dinner",
        description="Dinner for two people",
        total_amount=Decimal("1000.00"),
        paid_by_id=first_user_id,
        split_type=SplitType.EQUAL,
        participant_ids=[
            first_user_id,
            second_user_id,
        ],
        splits=[],
        expense_date=date(2026, 9, 7),
    )

    result = calculate_expense_splits(
        expense_data=expense_data,
        group_member_ids=group_member_ids,
    )

    assert len(result) == 2

    assert result[0] == (
        first_user_id,
        Decimal("500.00"),
        None,
    )

    assert result[1] == (
        second_user_id,
        Decimal("500.00"),
        None,
    )

    total_split_amount = sum(
        (
            split_amount
            for _, split_amount, _ in result
        ),
        Decimal("0.00"),
    )

    assert total_split_amount == Decimal(
        "1000.00"
    )
    
def test_equal_split_distributes_remaining_paise():
    """
    When an amount cannot be divided equally,
    SplitNest should distribute the remaining
    paise without losing money.
    """

    first_user_id = uuid4()
    second_user_id = uuid4()
    third_user_id = uuid4()

    participant_ids = [
        first_user_id,
        second_user_id,
        third_user_id,
    ]

    expense_data = ExpenseCreate(
        title="Snacks",
        description="Snacks for three people",
        total_amount=Decimal("100.00"),
        paid_by_id=first_user_id,
        split_type=SplitType.EQUAL,
        participant_ids=participant_ids,
        splits=[],
        expense_date=date(2026, 9, 7),
    )

    result = calculate_expense_splits(
        expense_data=expense_data,
        group_member_ids=set(
            participant_ids
        ),
    )

    assert result[0][1] == Decimal(
        "33.34"
    )

    assert result[1][1] == Decimal(
        "33.33"
    )

    assert result[2][1] == Decimal(
        "33.33"
    )

    total_split_amount = sum(
        (
            split_amount
            for _, split_amount, _ in result
        ),
        Decimal("0.00"),
    )

    assert total_split_amount == Decimal(
        "100.00"
    )
def test_exact_split_uses_entered_amounts():
    """
    An exact split should use the exact amounts
    entered for each member.
    """

    first_user_id = uuid4()
    second_user_id = uuid4()

    expense_data = ExpenseCreate(
        title="Shopping",
        description="Different shopping shares",
        total_amount=Decimal("1000.00"),
        paid_by_id=first_user_id,
        split_type=SplitType.EXACT,
        participant_ids=[],
        splits=[
            ExpenseSplitInput(
                user_id=first_user_id,
                amount=Decimal("700.00"),
                percentage=None,
            ),
            ExpenseSplitInput(
                user_id=second_user_id,
                amount=Decimal("300.00"),
                percentage=None,
            ),
        ],
        expense_date=date(2026, 9, 7),
    )

    result = calculate_expense_splits(
        expense_data=expense_data,
        group_member_ids={
            first_user_id,
            second_user_id,
        },
    )

    assert result[0] == (
        first_user_id,
        Decimal("700.00"),
        None,
    )

    assert result[1] == (
        second_user_id,
        Decimal("300.00"),
        None,
    )

    total_split_amount = sum(
        (
            split_amount
            for _, split_amount, _ in result
        ),
        Decimal("0.00"),
    )

    assert total_split_amount == Decimal(
        "1000.00"
    )


def test_percentage_split_calculates_amounts():
    """
    A 60/40 percentage split of 1000 should
    produce shares of 600 and 400.
    """

    first_user_id = uuid4()
    second_user_id = uuid4()

    expense_data = ExpenseCreate(
        title="Cab booking",
        description="Percentage split",
        total_amount=Decimal("1000.00"),
        paid_by_id=first_user_id,
        split_type=SplitType.PERCENTAGE,
        participant_ids=[],
        splits=[
            ExpenseSplitInput(
                user_id=first_user_id,
                amount=None,
                percentage=Decimal("60.00"),
            ),
            ExpenseSplitInput(
                user_id=second_user_id,
                amount=None,
                percentage=Decimal("40.00"),
            ),
        ],
        expense_date=date(2026, 9, 7),
    )

    result = calculate_expense_splits(
        expense_data=expense_data,
        group_member_ids={
            first_user_id,
            second_user_id,
        },
    )

    assert result[0] == (
        first_user_id,
        Decimal("600.00"),
        Decimal("60.00"),
    )

    assert result[1] == (
        second_user_id,
        Decimal("400.00"),
        Decimal("40.00"),
    )

    total_split_amount = sum(
        (
            split_amount
            for _, split_amount, _ in result
        ),
        Decimal("0.00"),
    )

    assert total_split_amount == Decimal(
        "1000.00"
    )
def test_exact_split_rejects_wrong_total():
    """
    A 1000 rupee expense cannot have exact
    shares that total only 900.
    """

    first_user_id = uuid4()
    second_user_id = uuid4()

    with pytest.raises(
        ValidationError,
        match=(
            "Exact split amounts must equal "
            "the total expense amount"
        ),
    ):
        ExpenseCreate(
            title="Shopping",
            description="Invalid exact split",
            total_amount=Decimal("1000.00"),
            paid_by_id=first_user_id,
            split_type=SplitType.EXACT,
            participant_ids=[],
            splits=[
                ExpenseSplitInput(
                    user_id=first_user_id,
                    amount=Decimal("600.00"),
                    percentage=None,
                ),
                ExpenseSplitInput(
                    user_id=second_user_id,
                    amount=Decimal("300.00"),
                    percentage=None,
                ),
            ],
            expense_date=date(2026, 9, 7),
        )


def test_percentage_split_rejects_wrong_total():
    """
    Percentage shares must total exactly 100%.
    """

    first_user_id = uuid4()
    second_user_id = uuid4()

    with pytest.raises(
        ValidationError,
        match=(
            "Percentage splits must total "
            "exactly 100"
        ),
    ):
        ExpenseCreate(
            title="Hotel",
            description=(
                "Invalid percentage split"
            ),
            total_amount=Decimal("1000.00"),
            paid_by_id=first_user_id,
            split_type=SplitType.PERCENTAGE,
            participant_ids=[],
            splits=[
                ExpenseSplitInput(
                    user_id=first_user_id,
                    amount=None,
                    percentage=Decimal(
                        "60.00"
                    ),
                ),
                ExpenseSplitInput(
                    user_id=second_user_id,
                    amount=None,
                    percentage=Decimal(
                        "30.00"
                    ),
                ),
            ],
            expense_date=date(2026, 9, 7),
        )
def test_expense_rejects_non_group_participant():
    """
    A person who is not a member of the group
    cannot participate in its expenses.
    """

    group_member_id = uuid4()
    stranger_id = uuid4()

    expense_data = ExpenseCreate(
        title="Private group dinner",
        description=(
            "Expense containing a stranger"
        ),
        total_amount=Decimal("1000.00"),
        paid_by_id=group_member_id,
        split_type=SplitType.EQUAL,
        participant_ids=[
            group_member_id,
            stranger_id,
        ],
        splits=[],
        expense_date=date(2026, 9, 7),
    )

    with pytest.raises(
        ExpenseParticipantNotMemberError
    ):
        calculate_expense_splits(
            expense_data=expense_data,

            # Only one person is really a member.
            group_member_ids={
                group_member_id
            },
        )