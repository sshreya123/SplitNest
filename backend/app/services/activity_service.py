from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.activity import Activity
from app.models.group import GroupMember
from app.models.user import User
from app.schemas.activity import (
    ActivityListResponse,
    ActivityResponse,
)


class ActivityGroupNotAccessibleError(
    Exception
):
    pass


def add_activity(
    db: Session,
    group_id: UUID,
    actor_id: UUID,
    action: str,
    entity_type: str,
    entity_id: UUID | None,
    details: dict[str, Any] | None = None,
) -> Activity:
    """
    Add an activity to the current database
    transaction.

    This function does not commit. The service
    performing the original action will commit
    both records together.
    """

    activity = Activity(
        group_id=group_id,
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details or {},
    )

    db.add(activity)

    return activity


def get_group_activities(
    db: Session,
    group_id: UUID,
    current_user: User,
    limit: int = 20,
    offset: int = 0,
) -> ActivityListResponse:
    """
    Return a paginated group activity timeline.
    """

    current_membership = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id
            == current_user.id,
        )
    )

    if current_membership is None:
        raise ActivityGroupNotAccessibleError

    total = db.scalar(
        select(
            func.count(Activity.id)
        ).where(
            Activity.group_id == group_id
        )
    )

    rows = db.execute(
        select(
            Activity,
            User.name,
        )
        .join(
            User,
            User.id == Activity.actor_id,
        )
        .where(
            Activity.group_id == group_id
        )
        .order_by(
            Activity.created_at.desc(),
            Activity.id.desc(),
        )
        .limit(limit)
        .offset(offset)
    ).all()

    items = [
        ActivityResponse(
            id=activity.id,
            group_id=activity.group_id,
            actor_id=activity.actor_id,
            actor_name=actor_name,
            action=activity.action,
            entity_type=activity.entity_type,
            entity_id=activity.entity_id,
            details=activity.details,
            created_at=activity.created_at,
        )
        for activity, actor_name in rows
    ]

    return ActivityListResponse(
        items=items,
        total=total or 0,
        limit=limit,
        offset=offset,
    )