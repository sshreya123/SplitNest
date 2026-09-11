from decimal import Decimal
from uuid import uuid4

from app.schemas.expense import (
    MemberBalanceResponse,
)
from app.services.expense_service import (
    calculate_debt_suggestions,
)


def create_member_balance(
    name: str,
    net_balance: Decimal,
) -> MemberBalanceResponse:
    return MemberBalanceResponse(
        user_id=uuid4(),
        name=name,
        total_paid=Decimal("0.00"),
        total_share=Decimal("0.00"),
        net_balance=net_balance,
    )


def test_debt_simplification_matches_debtors_with_creditor():
    """
    Two people who owe money should pay the
    person who must receive money.
    """

    anagha = create_member_balance(
        name="Anagha",
        net_balance=Decimal("-300.00"),
    )

    rahul = create_member_balance(
        name="Rahul",
        net_balance=Decimal("-200.00"),
    )

    shreya = create_member_balance(
        name="Shreya",
        net_balance=Decimal("500.00"),
    )

    suggestions = calculate_debt_suggestions(
        [
            anagha,
            rahul,
            shreya,
        ]
    )

    assert len(suggestions) == 2

    assert suggestions[0].from_user_id == (
        anagha.user_id
    )

    assert suggestions[0].to_user_id == (
        shreya.user_id
    )

    assert suggestions[0].amount == Decimal(
        "300.00"
    )

    assert suggestions[1].from_user_id == (
        rahul.user_id
    )

    assert suggestions[1].to_user_id == (
        shreya.user_id
    )

    assert suggestions[1].amount == Decimal(
        "200.00"
    )


def test_debt_simplification_returns_empty_when_settled():
    """
    If every balance is zero, no payment
    suggestion should be created.
    """

    first_member = create_member_balance(
        name="Shreya",
        net_balance=Decimal("0.00"),
    )

    second_member = create_member_balance(
        name="Anagha",
        net_balance=Decimal("0.00"),
    )

    suggestions = calculate_debt_suggestions(
        [
            first_member,
            second_member,
        ]
    )

    assert suggestions == []