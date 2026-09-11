from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import (
    GroupRole,
    SplitType,
)
from app.models.expense import (
    Expense,
    ExpenseSplit,
)
import pytest
from app.models.group import (
    Group,
    GroupMember,
)
from app.models.settlement import Settlement
from app.models.user import User
from app.schemas.settlement import (
    SettlementCreate,
)
from app.services.settlement_service import (
    SettlementAmountExceedsBalanceError,
    create_settlement,
)


def test_same_idempotency_key_creates_one_settlement(
    db_session: Session,
):
    """
    Sending the same settlement request twice
    should create only one database row.
    """

    shreya = User(
        name="Shreya",
        email="shreya-test@example.com",
        password_hash="test-password-hash",
        is_active=True,
    )

    anagha = User(
        name="Anagha",
        email="anagha-test@example.com",
        password_hash="test-password-hash",
        is_active=True,
    )

    db_session.add_all([
        shreya,
        anagha,
    ])

    db_session.flush()

    group = Group(
        name="Test Group",
        description="Group used by Pytest",
        default_currency="INR",
        created_by_id=shreya.id,
    )

    db_session.add(group)
    db_session.flush()

    db_session.add_all([
        GroupMember(
            group_id=group.id,
            user_id=shreya.id,
            role=GroupRole.ADMIN,
        ),

        GroupMember(
            group_id=group.id,
            user_id=anagha.id,
            role=GroupRole.MEMBER,
        ),
    ])

    expense = Expense(
        group_id=group.id,
        title="Test Dinner",
        description="Test expense",
        total_amount=Decimal("100.00"),
        currency="INR",
        split_type=SplitType.EQUAL,
        paid_by_id=shreya.id,
        created_by_id=shreya.id,
        expense_date=date(2026, 9, 7),
    )

    db_session.add(expense)
    db_session.flush()

    db_session.add_all([
        ExpenseSplit(
            expense_id=expense.id,
            user_id=shreya.id,
            amount=Decimal("50.00"),
            percentage=None,
        ),

        ExpenseSplit(
            expense_id=expense.id,
            user_id=anagha.id,
            amount=Decimal("50.00"),
            percentage=None,
        ),
    ])

    db_session.commit()

    settlement_data = SettlementCreate(
        from_user_id=anagha.id,
        to_user_id=shreya.id,
        amount=Decimal("10.00"),
        note="Idempotency test",
        settlement_date=date(2026, 9, 7),
    )

    test_key = (
        "pytest-duplicate-settlement-001"
    )

    first_response = create_settlement(
        db=db_session,
        group_id=group.id,
        settlement_data=settlement_data,
        current_user=shreya,
        idempotency_key=test_key,
    )

    second_response = create_settlement(
        db=db_session,
        group_id=group.id,
        settlement_data=settlement_data,
        current_user=shreya,
        idempotency_key=test_key,
    )

    settlement_count = db_session.scalar(
        select(
            func.count(Settlement.id)
        ).where(
            Settlement.idempotency_key
            == test_key
        )
    )

    assert first_response.id == (
        second_response.id
    )

    assert settlement_count == 1

    assert first_response.amount == Decimal(
        "10.00"
    )
        # Anagha originally owed 50. After paying 10,
    # she now owes only 40. A payment of 50 must
    # therefore be rejected.
    excessive_payment = SettlementCreate(
        from_user_id=anagha.id,
        to_user_id=shreya.id,
        amount=Decimal("50.00"),
        note="Payment larger than debt",
        settlement_date=date(2026, 9, 7),
    )

    with pytest.raises(
        SettlementAmountExceedsBalanceError
    ) as captured_error:
        create_settlement(
            db=db_session,
            group_id=group.id,
            settlement_data=excessive_payment,
            current_user=shreya,
            idempotency_key=(
                "pytest-overpayment-001"
            ),
        )

    assert (
        captured_error.value.maximum_amount
        == Decimal("40.00")
    )

    final_settlement_count = db_session.scalar(
        select(
            func.count(Settlement.id)
        )
    )

    assert final_settlement_count == 1