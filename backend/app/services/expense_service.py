from decimal import Decimal, ROUND_DOWN
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import (
    Session,
    joinedload,
    selectinload,
)

from app.models.enums import GroupRole, SplitType
from app.models.expense import Expense, ExpenseSplit
from app.models.group import Group, GroupMember
from app.services.activity_service import (
    add_activity,
)
from app.models.settlement import Settlement
from app.models.user import User
from app.schemas.expense import (
    DebtSuggestionResponse,
    ExpenseCreate,
    ExpenseResponse,
    ExpenseSplitResponse,
    GroupBalanceResponse,
    GroupDebtSimplificationResponse,
    MemberBalanceResponse,
)


class ExpenseGroupNotAccessibleError(Exception):
    pass


class ExpensePayerNotMemberError(Exception):
    pass


class ExpenseParticipantNotMemberError(Exception):
    pass


class ExpenseNotFoundError(Exception):
    pass


class ExpenseDeletePermissionError(Exception):
    pass


class ExpenseUpdatePermissionError(Exception):
    pass


def get_group_and_membership(
    db: Session,
    group_id: UUID,
    current_user: User,
) -> tuple[Group, GroupMember]:
    """
    Find the group and verify that the current user
    belongs to the group.
    """

    current_membership = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == current_user.id,
        )
    )

    if current_membership is None:
        raise ExpenseGroupNotAccessibleError

    group = db.scalar(
        select(Group).where(
            Group.id == group_id
        )
    )

    if group is None:
        raise ExpenseGroupNotAccessibleError

    return group, current_membership


def get_group_member_names(
    db: Session,
    group_id: UUID,
) -> dict[UUID, str]:
    """
    Return all group members in this form:

    {
        user_id: user_name
    }
    """

    member_rows = db.execute(
        select(
            GroupMember.user_id,
            User.name,
        )
        .join(
            User,
            User.id == GroupMember.user_id,
        )
        .where(
            GroupMember.group_id == group_id
        )
    ).all()

    return {
        user_id: name
        for user_id, name in member_rows
    }


def calculate_expense_splits(
    expense_data: ExpenseCreate,
    group_member_ids: set[UUID],
) -> list[tuple[UUID, Decimal, Decimal | None]]:
    """
    Calculate the amount payable by every participant.

    Each returned tuple contains:

    (
        user_id,
        share_amount,
        percentage
    )
    """

    total_amount = expense_data.total_amount.quantize(
        Decimal("0.01")
    )

    # -------------------------------------------------
    # Equal split
    # -------------------------------------------------

    if expense_data.split_type == SplitType.EQUAL:
        participant_ids = expense_data.participant_ids

        if not participant_ids:
            raise ExpenseParticipantNotMemberError

        if not set(participant_ids).issubset(
            group_member_ids
        ):
            raise ExpenseParticipantNotMemberError

        participant_count = len(participant_ids)

        base_share = (
            total_amount / Decimal(participant_count)
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_DOWN,
        )

        distributed_amount = (
            base_share * participant_count
        )

        remaining_cents = int(
            (
                total_amount - distributed_amount
            ) / Decimal("0.01")
        )

        calculated_splits = []

        for index, user_id in enumerate(
            participant_ids
        ):
            share_amount = base_share

            if index < remaining_cents:
                share_amount += Decimal("0.01")

            calculated_splits.append(
                (
                    user_id,
                    share_amount,
                    None,
                )
            )

        return calculated_splits

    # Exact and percentage splits use expense_data.splits.

    split_user_ids = {
        split.user_id
        for split in expense_data.splits
    }

    if not split_user_ids:
        raise ExpenseParticipantNotMemberError

    if not split_user_ids.issubset(
        group_member_ids
    ):
        raise ExpenseParticipantNotMemberError

    # -------------------------------------------------
    # Exact split
    # -------------------------------------------------

    if expense_data.split_type == SplitType.EXACT:
        return [
            (
                split.user_id,
                (
                    split.amount
                    or Decimal("0.00")
                ).quantize(
                    Decimal("0.01")
                ),
                None,
            )
            for split in expense_data.splits
        ]

    # -------------------------------------------------
    # Percentage split
    # -------------------------------------------------

    if expense_data.split_type == SplitType.PERCENTAGE:
        raw_amounts = [
            (
                total_amount
                * (
                    split.percentage
                    or Decimal("0.00")
                )
                / Decimal("100")
            )
            for split in expense_data.splits
        ]

        rounded_amounts = [
            amount.quantize(
                Decimal("0.01"),
                rounding=ROUND_DOWN,
            )
            for amount in raw_amounts
        ]

        distributed_amount = sum(
            rounded_amounts,
            Decimal("0.00"),
        )

        remaining_cents = int(
            (
                total_amount - distributed_amount
            ) / Decimal("0.01")
        )

        # Give leftover cents to the participants
        # with the largest fractional remainder.
        remainder_order = sorted(
            range(len(raw_amounts)),
            key=lambda index: (
                raw_amounts[index]
                - rounded_amounts[index]
            ),
            reverse=True,
        )

        for index in remainder_order[
            :remaining_cents
        ]:
            rounded_amounts[index] += Decimal(
                "0.01"
            )

        return [
            (
                split.user_id,
                rounded_amounts[index],
                (
                    split.percentage
                    or Decimal("0.00")
                ).quantize(
                    Decimal("0.01")
                ),
            )
            for index, split in enumerate(
                expense_data.splits
            )
        ]

    raise ValueError(
        "Unsupported expense split type"
    )


def build_expense_response(
    expense: Expense,
    member_names: dict[UUID, str],
    split_models: list[ExpenseSplit],
) -> ExpenseResponse:
    """
    Convert an Expense database model into
    an ExpenseResponse.
    """

    return ExpenseResponse(
        id=expense.id,
        group_id=expense.group_id,
        title=expense.title,
        description=expense.description,
        total_amount=expense.total_amount,
        currency=expense.currency,
        split_type=expense.split_type,
        paid_by_id=expense.paid_by_id,
        paid_by_name=member_names[
            expense.paid_by_id
        ],
        created_by_id=expense.created_by_id,
        expense_date=expense.expense_date,
        splits=[
            ExpenseSplitResponse(
                user_id=split.user_id,
                name=member_names[
                    split.user_id
                ],
                amount=split.amount,
                percentage=split.percentage,
            )
            for split in split_models
        ],
        created_at=expense.created_at,
        updated_at=expense.updated_at,
    )


def create_equal_split_expense(
    db: Session,
    group_id: UUID,
    expense_data: ExpenseCreate,
    current_user: User,
) -> ExpenseResponse:
    """
    Create an equal, exact or percentage expense
    and record its activity.
    """

    group, _ = get_group_and_membership(
        db=db,
        group_id=group_id,
        current_user=current_user,
    )

    member_names = get_group_member_names(
        db=db,
        group_id=group_id,
    )

    group_member_ids = set(
        member_names.keys()
    )

    if expense_data.paid_by_id not in (
        group_member_ids
    ):
        raise ExpensePayerNotMemberError

    calculated_splits = calculate_expense_splits(
        expense_data=expense_data,
        group_member_ids=group_member_ids,
    )

    total_amount = (
        expense_data.total_amount.quantize(
            Decimal("0.01")
        )
    )

    expense = Expense(
        group_id=group.id,
        title=expense_data.title,
        description=expense_data.description,
        total_amount=total_amount,
        currency=group.default_currency,
        split_type=expense_data.split_type,
        paid_by_id=expense_data.paid_by_id,
        created_by_id=current_user.id,
        expense_date=expense_data.expense_date,
    )

    db.add(expense)
    db.flush()

    split_models: list[ExpenseSplit] = []

    for user_id, amount, percentage in (
        calculated_splits
    ):
        split = ExpenseSplit(
            expense_id=expense.id,
            user_id=user_id,
            amount=amount,
            percentage=percentage,
        )

        db.add(split)
        split_models.append(split)

    add_activity(
        db=db,
        group_id=group.id,
        actor_id=current_user.id,
        action="expense.created",
        entity_type="expense",
        entity_id=expense.id,
        details={
            "title": expense.title,
            "amount": str(
                expense.total_amount
            ),
            "currency": expense.currency,
            "split_type": (
                expense.split_type.value
            ),
        },
    )

    try:
        db.commit()

    except Exception:
        db.rollback()
        raise

    db.refresh(expense)

    return build_expense_response(
        expense=expense,
        member_names=member_names,
        split_models=split_models,
    )
def get_group_expenses(
    db: Session,
    group_id: UUID,
    current_user: User,
) -> list[ExpenseResponse]:
    """
    Return all expenses belonging to a group.
    """

    get_group_and_membership(
        db=db,
        group_id=group_id,
        current_user=current_user,
    )

    statement = (
        select(Expense)
        .options(
            joinedload(Expense.payer),
            selectinload(
                Expense.splits
            ).joinedload(
                ExpenseSplit.user
            ),
        )
        .where(
            Expense.group_id == group_id
        )
        .order_by(
            Expense.expense_date.desc(),
            Expense.created_at.desc(),
        )
    )

    expenses = db.scalars(
        statement
    ).unique().all()

    responses: list[ExpenseResponse] = []

    for expense in expenses:
        member_names = {
            expense.paid_by_id:
            expense.payer.name
        }

        for split in expense.splits:
            member_names[
                split.user_id
            ] = split.user.name

        responses.append(
            build_expense_response(
                expense=expense,
                member_names=member_names,
                split_models=list(
                    expense.splits
                ),
            )
        )

    return responses


def get_group_balances(
    db: Session,
    group_id: UUID,
    current_user: User,
) -> GroupBalanceResponse:
    """
    Calculate each group member's balance.

    Formula:

    net balance =
        total paid
        - total expense share
        + settlements sent
        - settlements received
    """

    group, _ = get_group_and_membership(
        db=db,
        group_id=group_id,
        current_user=current_user,
    )

    member_rows = db.execute(
        select(
            GroupMember.user_id,
            User.name,
        )
        .join(
            User,
            User.id == GroupMember.user_id,
        )
        .where(
            GroupMember.group_id == group_id
        )
        .order_by(
            User.name.asc()
        )
    ).all()

    paid_rows = db.execute(
        select(
            Expense.paid_by_id,
            func.sum(Expense.total_amount),
        )
        .where(
            Expense.group_id == group_id
        )
        .group_by(
            Expense.paid_by_id
        )
    ).all()

    share_rows = db.execute(
        select(
            ExpenseSplit.user_id,
            func.sum(ExpenseSplit.amount),
        )
        .join(
            Expense,
            Expense.id == ExpenseSplit.expense_id,
        )
        .where(
            Expense.group_id == group_id
        )
        .group_by(
            ExpenseSplit.user_id
        )
    ).all()

    sent_rows = db.execute(
        select(
            Settlement.from_user_id,
            func.sum(Settlement.amount),
        )
        .where(
            Settlement.group_id == group_id
        )
        .group_by(
            Settlement.from_user_id
        )
    ).all()

    received_rows = db.execute(
        select(
            Settlement.to_user_id,
            func.sum(Settlement.amount),
        )
        .where(
            Settlement.group_id == group_id
        )
        .group_by(
            Settlement.to_user_id
        )
    ).all()

    total_expenses = db.scalar(
        select(
            func.coalesce(
                func.sum(
                    Expense.total_amount
                ),
                0,
            )
        )
        .where(
            Expense.group_id == group_id
        )
    )

    paid_by_user = {
        user_id: amount
        for user_id, amount in paid_rows
    }

    share_by_user = {
        user_id: amount
        for user_id, amount in share_rows
    }

    sent_by_user = {
        user_id: amount
        for user_id, amount in sent_rows
    }

    received_by_user = {
        user_id: amount
        for user_id, amount in received_rows
    }

    zero = Decimal("0.00")
    balances: list[MemberBalanceResponse] = []

    for user_id, name in member_rows:
        total_paid = paid_by_user.get(
            user_id,
            zero,
        )

        total_share = share_by_user.get(
            user_id,
            zero,
        )

        total_sent = sent_by_user.get(
            user_id,
            zero,
        )

        total_received = received_by_user.get(
            user_id,
            zero,
        )

        net_balance = (
            total_paid
            - total_share
            + total_sent
            - total_received
        ).quantize(
            Decimal("0.01")
        )

        balances.append(
            MemberBalanceResponse(
                user_id=user_id,
                name=name,
                total_paid=total_paid,
                total_share=total_share,
                net_balance=net_balance,
            )
        )

    normalized_total_expenses = Decimal(
        str(total_expenses or 0)
    ).quantize(
        Decimal("0.01")
    )

    return GroupBalanceResponse(
        group_id=group.id,
        currency=group.default_currency,
        total_expenses=normalized_total_expenses,
        members=balances,
    )


def delete_group_expense(
    db: Session,
    group_id: UUID,
    expense_id: UUID,
    current_user: User,
) -> None:
    """
    Delete an expense.

    The creator or group administrator can delete it.
    """

    _, current_membership = (
        get_group_and_membership(
            db=db,
            group_id=group_id,
            current_user=current_user,
        )
    )

    expense = db.scalar(
        select(Expense).where(
            Expense.id == expense_id,
            Expense.group_id == group_id,
        )
    )

    if expense is None:
        raise ExpenseNotFoundError

    is_creator = (
        expense.created_by_id == current_user.id
    )

    is_admin = (
        current_membership.role
        == GroupRole.ADMIN
    )

    if not is_creator and not is_admin:
        raise ExpenseDeletePermissionError

    add_activity(
        db=db,
        group_id=group_id,
        actor_id=current_user.id,
        action="expense.deleted",
        entity_type="expense",
        entity_id=expense.id,
        details={
            "title": expense.title,
            "amount": str(
                expense.total_amount
            ),
            "currency": expense.currency,
        },
    )

    db.delete(expense)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise


def update_group_expense(
    db: Session,
    group_id: UUID,
    expense_id: UUID,
    expense_data: ExpenseCreate,
    current_user: User,
) -> ExpenseResponse:
    """
    Update an expense and replace its old splits
    with newly calculated splits.
    """

    group, current_membership = (
        get_group_and_membership(
            db=db,
            group_id=group_id,
            current_user=current_user,
        )
    )

    expense = db.scalar(
        select(Expense)
        .options(
            selectinload(Expense.splits)
        )
        .where(
            Expense.id == expense_id,
            Expense.group_id == group_id,
        )
    )

    if expense is None:
        raise ExpenseNotFoundError

    is_creator = (
        expense.created_by_id == current_user.id
    )

    is_admin = (
        current_membership.role
        == GroupRole.ADMIN
    )

    if not is_creator and not is_admin:
        raise ExpenseUpdatePermissionError

    member_names = get_group_member_names(
        db=db,
        group_id=group_id,
    )

    group_member_ids = set(
        member_names.keys()
    )

    if expense_data.paid_by_id not in (
        group_member_ids
    ):
        raise ExpensePayerNotMemberError

    calculated_splits = calculate_expense_splits(
        expense_data=expense_data,
        group_member_ids=group_member_ids,
    )

    total_amount = expense_data.total_amount.quantize(
        Decimal("0.01")
    )

    expense.title = expense_data.title
    expense.description = expense_data.description
    expense.total_amount = total_amount
    expense.currency = group.default_currency
    expense.split_type = expense_data.split_type
    expense.paid_by_id = expense_data.paid_by_id
    expense.expense_date = expense_data.expense_date

    # Remove all previous split records.
    expense.splits.clear()

    # Execute deletion of old splits before adding
    # the new ones.
    db.flush()

    new_splits: list[ExpenseSplit] = []

    for user_id, amount, percentage in (
        calculated_splits
    ):
        split = ExpenseSplit(
            expense_id=expense.id,
            user_id=user_id,
            amount=amount,
            percentage=percentage,
        )

        expense.splits.append(split)
        new_splits.append(split)

    add_activity(
        db=db,
        group_id=group.id,
        actor_id=current_user.id,
        action="expense.updated",
        entity_type="expense",
        entity_id=expense.id,
        details={
            "title": expense.title,
            "amount": str(
                expense.total_amount
            ),
            "currency": expense.currency,
            "split_type": (
                expense.split_type.value
            ),
        },
    )

    try:
        db.commit()

    except Exception:
        db.rollback()
        raise

    db.refresh(expense)

    return build_expense_response(
        expense=expense,
        member_names=member_names,
        split_models=new_splits,
    )
def calculate_debt_suggestions(
    members: list[MemberBalanceResponse],
) -> list[DebtSuggestionResponse]:
    """
    Calculate simplified payment suggestions
    using member balances.

    This function does not use the database,
    which makes it easy to test.
    """

    zero = Decimal("0.00")

    debtors = []
    creditors = []

    for member in members:
        balance = member.net_balance.quantize(
            Decimal("0.01")
        )

        if balance < zero:
            debtors.append({
                "user_id": member.user_id,
                "name": member.name,
                "amount": abs(balance),
            })

        elif balance > zero:
            creditors.append({
                "user_id": member.user_id,
                "name": member.name,
                "amount": balance,
            })

    # Start with the largest debts and credits.
    debtors.sort(
        key=lambda member: member["amount"],
        reverse=True,
    )

    creditors.sort(
        key=lambda member: member["amount"],
        reverse=True,
    )

    suggestions: list[
        DebtSuggestionResponse
    ] = []

    debtor_index = 0
    creditor_index = 0

    while (
        debtor_index < len(debtors)
        and creditor_index < len(creditors)
    ):
        debtor = debtors[debtor_index]
        creditor = creditors[creditor_index]

        payment_amount = min(
            debtor["amount"],
            creditor["amount"],
        ).quantize(
            Decimal("0.01")
        )

        if payment_amount > zero:
            suggestions.append(
                DebtSuggestionResponse(
                    from_user_id=debtor[
                        "user_id"
                    ],
                    from_user_name=debtor[
                        "name"
                    ],
                    to_user_id=creditor[
                        "user_id"
                    ],
                    to_user_name=creditor[
                        "name"
                    ],
                    amount=payment_amount,
                )
            )

        debtor["amount"] = (
            debtor["amount"]
            - payment_amount
        ).quantize(
            Decimal("0.01")
        )

        creditor["amount"] = (
            creditor["amount"]
            - payment_amount
        ).quantize(
            Decimal("0.01")
        )

        if debtor["amount"] == zero:
            debtor_index += 1

        if creditor["amount"] == zero:
            creditor_index += 1

    return suggestions


def simplify_group_debts(
    db: Session,
    group_id: UUID,
    current_user: User,
) -> GroupDebtSimplificationResponse:
    """
    Load balances from the database and use
    the calculation function to simplify them.
    """

    balance_summary = get_group_balances(
        db=db,
        group_id=group_id,
        current_user=current_user,
    )

    suggestions = calculate_debt_suggestions(
        balance_summary.members
    )

    return GroupDebtSimplificationResponse(
        group_id=balance_summary.group_id,
        currency=balance_summary.currency,
        suggestions=suggestions,
    )