import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    String,
    UniqueConstraint,
    func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship
)

from app.db.base_class import Base
from app.models.enums import GroupRole


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    name: Mapped[str] = mapped_column(
        String(120),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    default_currency: Mapped[str] = mapped_column(
        String(3),
        default="INR",
        nullable=False
    )

    created_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "users.id",
            ondelete="RESTRICT"
        ),
        index=True,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    creator = relationship(
        "User",
        back_populates="created_groups",
        foreign_keys=[created_by_id]
    )

    memberships = relationship(
        "GroupMember",
        back_populates="group",
        cascade="all, delete-orphan"
    )
    expenses = relationship(
    "Expense",
    back_populates="group",
    cascade="all, delete-orphan"
)
    settlements = relationship(
    "Settlement",
    back_populates="group",
    cascade="all, delete-orphan"
)


class GroupMember(Base):
    __tablename__ = "group_members"

    __table_args__ = (
        UniqueConstraint(
            "group_id",
            "user_id",
            name="uq_group_members_group_user"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    group_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "groups.id",
            ondelete="CASCADE"
        ),
        index=True,
        nullable=False
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        index=True,
        nullable=False
    )

    role: Mapped[GroupRole] = mapped_column(
        Enum(
            GroupRole,
            name="group_role"
        ),
        default=GroupRole.MEMBER,
        nullable=False
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    group = relationship(
        "Group",
        back_populates="memberships"
    )

    user = relationship(
        "User",
        back_populates="group_memberships"
    )