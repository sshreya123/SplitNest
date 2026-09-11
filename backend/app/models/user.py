import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship
)
class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
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
    refresh_tokens = relationship(
    "RefreshToken",
    back_populates="user",
    cascade="all, delete-orphan"
)
    created_groups = relationship(
    "Group",
    back_populates="creator",
    foreign_keys="Group.created_by_id"
)

    group_memberships = relationship(
    "GroupMember",
    back_populates="user",
    cascade="all, delete-orphan"
)
    paid_expenses = relationship(
    "Expense",
    back_populates="payer",
    foreign_keys="Expense.paid_by_id"
)

    created_expenses = relationship(
    "Expense",
    back_populates="creator",
    foreign_keys="Expense.created_by_id"
)

    expense_splits = relationship(
    "ExpenseSplit",
    back_populates="user"
)
    sent_settlements = relationship(
    "Settlement",
    back_populates="sender",
    foreign_keys="Settlement.from_user_id"
)

    received_settlements = relationship(
    "Settlement",
    back_populates="receiver",
    foreign_keys="Settlement.to_user_id"
)

    created_settlements = relationship(
    "Settlement",
    back_populates="creator",
    foreign_keys="Settlement.created_by_id"
)