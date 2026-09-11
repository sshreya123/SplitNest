from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import (
    Session,
    joinedload,
)
from app.services.activity_service import (
    add_activity,
)
from app.models.enums import GroupRole
from app.models.group import Group, GroupMember
from app.models.settlement import Settlement
from app.models.user import User
from app.schemas.settlement import (
    SettlementCreate,
    SettlementResponse,
)
from app.services.expense_service import (
    get_group_balances,
)


class SettlementGroupNotAccessibleError(
    Exception
):
    pass


class SettlementMemberInvalidError(Exception):
    pass


class SettlementPermissionError(Exception):
    pass


class SettlementDebtNotFoundError(Exception):
    pass


class SettlementIdempotencyConflictError(
    Exception
):
    pass


class SettlementAmountExceedsBalanceError(
    Exception
):
    def __init__(
        self,
        maximum_amount: Decimal,
    ):
        self.maximum_amount = maximum_amount

        super().__init__(
            "Settlement amount exceeds balance"
        )


def build_settlement_response(
    settlement: Settlement,
    member_names: dict[UUID, str] | None = None,
) -> SettlementResponse:
    """
    Convert a Settlement database object into
    the response returned by the API.
    """

    if member_names is not None:
        sender_name = member_names[
            settlement.from_user_id
        ]

        receiver_name = member_names[
            settlement.to_user_id
        ]
    else:
        sender_name = settlement.sender.name
        receiver_name = settlement.receiver.name

    return SettlementResponse(
        id=settlement.id,
        group_id=settlement.group_id,
        from_user_id=settlement.from_user_id,
        from_user_name=sender_name,
        to_user_id=settlement.to_user_id,
        to_user_name=receiver_name,
        amount=settlement.amount,
        currency=settlement.currency,
        note=settlement.note,
        settlement_date=(
            settlement.settlement_date
        ),
        created_by_id=settlement.created_by_id,
        created_at=settlement.created_at,
    )


def get_existing_settlement_by_key(
    db: Session,
    idempotency_key: str,
) -> Settlement | None:
    """
    Find a settlement that has already been saved
    using the given unique request key.
    """

    return db.scalar(
        select(Settlement)
        .options(
            joinedload(Settlement.sender),
            joinedload(Settlement.receiver),
        )
        .where(
            Settlement.idempotency_key
            == idempotency_key
        )
    )


def create_settlement(
    db: Session,
    group_id: UUID,
    settlement_data: SettlementCreate,
    current_user: User,
    idempotency_key: str,
) -> SettlementResponse:
    """
    Record a settlement safely.

    The idempotency key prevents the same request
    from creating the same payment twice.
    """

    clean_idempotency_key = (
        idempotency_key.strip()
    )

    if (
        not clean_idempotency_key
        or len(clean_idempotency_key) > 64
    ):
        raise SettlementIdempotencyConflictError

    current_membership = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id
            == current_user.id,
        )
    )

    if current_membership is None:
        raise SettlementGroupNotAccessibleError

    # Lock the group while checking its balance and
    # saving the settlement. This prevents two
    # simultaneous payments from overpaying a debt.
    group = db.scalar(
        select(Group)
        .where(
            Group.id == group_id
        )
        .with_for_update()
    )

    if group is None:
        raise SettlementGroupNotAccessibleError

    # If this request was already completed, return
    # the existing settlement instead of creating
    # another one.
    existing_settlement = (
        get_existing_settlement_by_key(
            db=db,
            idempotency_key=(
                clean_idempotency_key
            ),
        )
    )

    if existing_settlement is not None:
        same_group = (
            existing_settlement.group_id
            == group_id
        )

        same_creator = (
            existing_settlement.created_by_id
            == current_user.id
        )

        if not same_group or not same_creator:
            raise (
                SettlementIdempotencyConflictError
            )

        return build_settlement_response(
            existing_settlement
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
    ).all()

    member_names = {
        user_id: name
        for user_id, name in member_rows
    }

    sender_is_member = (
        settlement_data.from_user_id
        in member_names
    )

    receiver_is_member = (
        settlement_data.to_user_id
        in member_names
    )

    if (
        not sender_is_member
        or not receiver_is_member
    ):
        raise SettlementMemberInvalidError

    is_sender = (
        current_user.id
        == settlement_data.from_user_id
    )

    is_admin = (
        current_membership.role
        == GroupRole.ADMIN
    )

    # A normal member can record their own payment.
    # An administrator can record a payment for
    # another group member.
    if not is_sender and not is_admin:
        raise SettlementPermissionError

    # Load the latest balances after locking
    # the group.
    balance_summary = get_group_balances(
        db=db,
        group_id=group_id,
        current_user=current_user,
    )

    balances_by_user = {
        member.user_id: member.net_balance
        for member in balance_summary.members
    }

    sender_balance = balances_by_user.get(
        settlement_data.from_user_id,
        Decimal("0.00"),
    )

    receiver_balance = balances_by_user.get(
        settlement_data.to_user_id,
        Decimal("0.00"),
    )

    # A negative balance means the sender owes money.
    # A positive balance means the receiver should
    # receive money.
    if (
        sender_balance >= Decimal("0.00")
        or receiver_balance <= Decimal("0.00")
    ):
        raise SettlementDebtNotFoundError

    maximum_amount = min(
        abs(sender_balance),
        receiver_balance,
    ).quantize(
        Decimal("0.01")
    )

    settlement_amount = (
        settlement_data.amount.quantize(
            Decimal("0.01")
        )
    )

    if settlement_amount > maximum_amount:
        raise SettlementAmountExceedsBalanceError(
            maximum_amount
        )

    note = (
        settlement_data.note.strip()
        if settlement_data.note
        else None
    )

    settlement = Settlement(
        group_id=group.id,
        idempotency_key=(
            clean_idempotency_key
        ),
        from_user_id=(
            settlement_data.from_user_id
        ),
        to_user_id=(
            settlement_data.to_user_id
        ),
        amount=settlement_amount,
        currency=group.default_currency,
        note=note or None,
        settlement_date=(
            settlement_data.settlement_date
        ),
        created_by_id=current_user.id,
    )

    db.add(settlement)

    add_activity(
        db=db,
        group_id=group.id,
        actor_id=current_user.id,
        action="settlement.created",
        entity_type="settlement",
        entity_id=settlement.id,
        details={
            "from_user_id": str(
                settlement.from_user_id
            ),
            "from_user_name": member_names[
                settlement.from_user_id
            ],
            "to_user_id": str(
                settlement.to_user_id
            ),
            "to_user_name": member_names[
                settlement.to_user_id
            ],
            "amount": str(
                settlement.amount
            ),
            "currency": settlement.currency,
        },
    )

    try:
        db.commit()

    except IntegrityError:
        db.rollback()

        # Two identical requests may arrive at almost
        # the same time. If the first request saved
        # successfully, return that saved result.
        existing_settlement = (
            get_existing_settlement_by_key(
                db=db,
                idempotency_key=(
                    clean_idempotency_key
                ),
            )
        )

        if existing_settlement is None:
            # The integrity error was unrelated to
            # the idempotency key.
            raise

        same_group = (
            existing_settlement.group_id
            == group_id
        )

        same_creator = (
            existing_settlement.created_by_id
            == current_user.id
        )

        if not same_group or not same_creator:
            raise (
                SettlementIdempotencyConflictError
            )

        return build_settlement_response(
            existing_settlement
        )

    except Exception:
        db.rollback()
        raise

    db.refresh(settlement)

    return build_settlement_response(
        settlement=settlement,
        member_names=member_names,
    )


def get_group_settlements(
    db: Session,
    group_id: UUID,
    current_user: User,
) -> list[SettlementResponse]:
    """
    Return all settlements recorded for a group.
    """

    current_membership = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id
            == current_user.id,
        )
    )

    if current_membership is None:
        raise SettlementGroupNotAccessibleError

    group_exists = db.scalar(
        select(Group.id).where(
            Group.id == group_id
        )
    )

    if group_exists is None:
        raise SettlementGroupNotAccessibleError

    statement = (
        select(Settlement)
        .options(
            joinedload(Settlement.sender),
            joinedload(Settlement.receiver),
        )
        .where(
            Settlement.group_id == group_id
        )
        .order_by(
            Settlement.settlement_date.desc(),
            Settlement.created_at.desc(),
        )
    )

    settlements = db.scalars(
        statement
    ).all()

    return [
        build_settlement_response(settlement)
        for settlement in settlements
    ]