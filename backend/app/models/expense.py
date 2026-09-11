import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
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
from app.models.enums import SplitType


class Expense(Base):
    __tablename__ = "expenses"

    __table_args__ = (
        CheckConstraint(
            "total_amount > 0",
            name="ck_expenses_total_amount_positive"
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

    title: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(
            precision=12,
            scale=2
        ),
        nullable=False
    )

    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False
    )

    split_type: Mapped[SplitType] = mapped_column(
        Enum(
            SplitType,
            name="expense_split_type"
        ),
        default=SplitType.EQUAL,
        nullable=False
    )

    paid_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "users.id",
            ondelete="RESTRICT"
        ),
        index=True,
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

    expense_date: Mapped[date] = mapped_column(
        Date,
        default=date.today,
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

    group = relationship(
        "Group",
        back_populates="expenses"
    )

    payer = relationship(
        "User",
        back_populates="paid_expenses",
        foreign_keys=[paid_by_id]
    )

    creator = relationship(
        "User",
        back_populates="created_expenses",
        foreign_keys=[created_by_id]
    )

    splits = relationship(
        "ExpenseSplit",
        back_populates="expense",
        cascade="all, delete-orphan"
    )


class ExpenseSplit(Base):
    __tablename__ = "expense_splits"

    __table_args__ = (
        UniqueConstraint(
            "expense_id",
            "user_id",
            name="uq_expense_splits_expense_user"
        ),

        CheckConstraint(
            "amount >= 0",
            name="ck_expense_splits_amount_non_negative"
        ),

        CheckConstraint(
            "percentage IS NULL OR "
            "(percentage >= 0 AND percentage <= 100)",
            name="ck_expense_splits_percentage_range"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    expense_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "expenses.id",
            ondelete="CASCADE"
        ),
        index=True,
        nullable=False
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "users.id",
            ondelete="RESTRICT"
        ),
        index=True,
        nullable=False
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(
            precision=12,
            scale=2
        ),
        nullable=False
    )

    percentage: Mapped[Decimal | None] = mapped_column(
        Numeric(
            precision=5,
            scale=2
        ),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    expense = relationship(
        "Expense",
        back_populates="splits"
    )

    user = relationship(
        "User",
        back_populates="expense_splits"
    )