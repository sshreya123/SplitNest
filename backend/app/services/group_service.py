from app.services.activity_service import add_activity

from sqlalchemy.orm import Session
from sqlalchemy import func, select
from app.models.enums import GroupRole
from app.models.group import Group, GroupMember
from app.models.user import User
from uuid import UUID
from sqlalchemy.exc import IntegrityError
from app.schemas.group import (
    GroupCreate,
    GroupDetailResponse,
    GroupListItem,
    GroupMemberAdd,
    GroupMemberDetail,
)

class GroupNotAccessibleError(Exception):
    pass


class GroupAdminRequiredError(Exception):
    pass


class MemberUserNotFoundError(Exception):
    pass


class UserAlreadyGroupMemberError(Exception):
    pass
def create_group(
    db: Session,
    group_data: GroupCreate,
    creator: User
) -> Group:
    group = Group(
        name=group_data.name,
        description=group_data.description,
        default_currency=group_data.default_currency,
        created_by_id=creator.id
    )

    db.add(group)

    # Sends the INSERT to PostgreSQL without
    # committing the transaction.
    db.flush()

    creator_membership = GroupMember(
        group_id=group.id,
        user_id=creator.id,
        role=GroupRole.ADMIN
    )

    db.add(creator_membership)

    add_activity(
        db=db,
        group_id=group.id,
        actor_id=creator.id,
        action="group.created",
        entity_type="group",
        entity_id=group.id,
        details={
            "group_name": group.name,
            "currency": group.default_currency
        }
    )

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(group)

    return group
def get_user_groups(
    db: Session,
    user: User
) -> list[GroupListItem]:
    member_count_query = (
        select(
            GroupMember.group_id,
            func.count(
                GroupMember.id
            ).label("member_count")
        )
        .group_by(GroupMember.group_id)
        .subquery()
    )

    statement = (
        select(
            Group,
            GroupMember.role,
            func.coalesce(
                member_count_query.c.member_count,
                0
            ).label("member_count")
        )
        .join(
            GroupMember,
            GroupMember.group_id == Group.id
        )
        .outerjoin(
            member_count_query,
            member_count_query.c.group_id
            == Group.id
        )
        .where(
            GroupMember.user_id == user.id
        )
        .order_by(
            Group.created_at.desc()
        )
    )

    rows = db.execute(statement).all()

    return [
        GroupListItem(
            id=group.id,
            name=group.name,
            description=group.description,
            default_currency=group.default_currency,
            created_by_id=group.created_by_id,
            current_user_role=role,
            member_count=member_count,
            created_at=group.created_at,
            updated_at=group.updated_at
        )
        for group, role, member_count in rows
    ]
    
def get_group_detail(
    db: Session,
    group_id: UUID,
    user: User
) -> GroupDetailResponse | None:
    current_membership = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user.id
        )
    )

    # The group is only visible to its members.
    if current_membership is None:
        return None

    group = db.scalar(
        select(Group).where(
            Group.id == group_id
        )
    )

    if group is None:
        return None

    statement = (
        select(
            GroupMember,
            User
        )
        .join(
            User,
            User.id == GroupMember.user_id
        )
        .where(
            GroupMember.group_id == group_id
        )
        .order_by(
            GroupMember.joined_at.asc()
        )
    )

    member_rows = db.execute(statement).all()

    members = [
        GroupMemberDetail(
            user_id=member.user_id,
            name=member_user.name,
            email=member_user.email,
            role=member.role,
            joined_at=member.joined_at
        )
        for member, member_user in member_rows
    ]

    return GroupDetailResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        default_currency=group.default_currency,
        created_by_id=group.created_by_id,
        current_user_role=current_membership.role,
        member_count=len(members),
        members=members,
        created_at=group.created_at,
        updated_at=group.updated_at
    )
def add_group_member(
    db: Session,
    group_id: UUID,
    member_data: GroupMemberAdd,
    current_user: User
) -> GroupMemberDetail:
    current_membership = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == current_user.id
        )
    )

    # Only members of the group can access it.
    if current_membership is None:
        raise GroupNotAccessibleError

    # Only an administrator can add members.
    if current_membership.role != GroupRole.ADMIN:
        raise GroupAdminRequiredError

    target_user = db.scalar(
        select(User).where(
            func.lower(User.email)
            == member_data.email.lower()
        )
    )

    if target_user is None:
        raise MemberUserNotFoundError

    existing_membership = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == target_user.id
        )
    )

    if existing_membership is not None:
        raise UserAlreadyGroupMemberError

    membership = GroupMember(
        group_id=group_id,
        user_id=target_user.id,
        role=GroupRole.MEMBER
    )

    db.add(membership)

    # Record this action in the activity table.
    add_activity(
        db=db,
        group_id=group_id,
        actor_id=current_user.id,
        action="member.added",
        entity_type="member",
        entity_id=target_user.id,
        details={
            "member_user_id": str(target_user.id),
            "member_name": target_user.name,
            "member_email": target_user.email,
            "role": GroupRole.MEMBER.value
        }
    )

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise UserAlreadyGroupMemberError from None
    except Exception:
        db.rollback()
        raise

    db.refresh(membership)

    return GroupMemberDetail(
        user_id=target_user.id,
        name=target_user.name,
        email=target_user.email,
        role=membership.role,
        joined_at=membership.joined_at
    )