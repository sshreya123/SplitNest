from decimal import Decimal

from sqlalchemy import (
    func,
    select,
)
from sqlalchemy.orm import Session

from app.models.activity import Activity
from app.models.group import (
    Group,
    GroupMember,
)
from app.models.user import User
from app.schemas.dashboard import (
    DashboardActivityItem,
    DashboardGroupItem,
    DashboardSummaryResponse,
)
from app.services.expense_service import (
    get_group_balances,
)


def get_dashboard_summary(
    db: Session,
    current_user: User,
) -> DashboardSummaryResponse:
    """
    Return dashboard information for the logged-in user.
    """

    member_count_query = (
        select(
            func.count(GroupMember.id)
        )
        .where(
            GroupMember.group_id == Group.id
        )
        .correlate(Group)
        .scalar_subquery()
    )

    group_rows = db.execute(
        select(
            Group,
            GroupMember.role,
            member_count_query.label(
                "member_count"
            ),
        )
        .join(
            GroupMember,
            GroupMember.group_id == Group.id,
        )
        .where(
            GroupMember.user_id == current_user.id
        )
        .order_by(
            Group.updated_at.desc()
        )
    ).all()

    zero = Decimal("0.00")
    you_are_owed = zero
    you_owe = zero

    for group, _, _ in group_rows:
        # The current dashboard displays INR amounts.
        # Other currencies can be added later.
        if group.default_currency != "INR":
            continue

        balance_summary = get_group_balances(
            db=db,
            group_id=group.id,
            current_user=current_user,
        )

        current_member_balance = next(
            (
                member
                for member in balance_summary.members
                if member.user_id == current_user.id
            ),
            None,
        )

        if current_member_balance is None:
            continue

        net_balance = (
            current_member_balance.net_balance
        )

        if net_balance > zero:
            you_are_owed += net_balance
        elif net_balance < zero:
            you_owe += abs(net_balance)

    you_are_owed = you_are_owed.quantize(
        Decimal("0.01")
    )
    you_owe = you_owe.quantize(
        Decimal("0.01")
    )

    total_balance = (
        you_are_owed - you_owe
    ).quantize(
        Decimal("0.01")
    )

    recent_groups = [
        DashboardGroupItem(
            id=group.id,
            name=group.name,
            description=group.description,
            default_currency=(
                group.default_currency
            ),
            current_user_role=role,
            member_count=member_count,
            created_at=group.created_at,
        )
        for group, role, member_count
        in group_rows[:5]
    ]

    activity_rows = db.execute(
        select(
            Activity,
            Group.name.label("group_name"),
            User.name.label("actor_name"),
        )
        .join(
            Group,
            Group.id == Activity.group_id,
        )
        .join(
            User,
            User.id == Activity.actor_id,
        )
        .join(
            GroupMember,
            GroupMember.group_id
            == Activity.group_id,
        )
        .where(
            GroupMember.user_id
            == current_user.id
        )
        .order_by(
            Activity.created_at.desc()
        )
        .limit(5)
    ).all()

    recent_activities = [
        DashboardActivityItem(
            id=activity.id,
            group_id=activity.group_id,
            group_name=group_name,
            actor_name=actor_name,
            action=activity.action,
            entity_type=activity.entity_type,
            entity_id=activity.entity_id,
            details=activity.details,
            created_at=activity.created_at,
        )
        for activity, group_name, actor_name
        in activity_rows
    ]

    return DashboardSummaryResponse(
        currency="INR",
        total_balance=total_balance,
        you_are_owed=you_are_owed,
        you_owe=you_owe,
        active_groups=len(group_rows),
        recent_groups=recent_groups,
        recent_activities=recent_activities,
    )