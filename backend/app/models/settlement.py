import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship
)

from app.db.base_class import Base


class Settlement(Base):
    __tablename__ = "settlements"

    __table_args__ = (
        CheckConstraint(
            "amount > 0",
            name="ck_settlements_amount_positive"
        ),

        CheckConstraint(
            "from_user_id <> to_user_id",
            name="ck_settlements_different_users"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    idempotency_key: Mapped[str | None] = mapped_column(
    String(64),
    unique=True,
    index=True,
    nullable=True
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

    from_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "users.id",
            ondelete="RESTRICT"
        ),
        index=True,
        nullable=False
    )

    to_user_id: Mapped[uuid.UUID] = mapped_column(
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

    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False
    )

    note: Mapped[str | None] = mapped_column(
        String(300),
        nullable=True
    )

    settlement_date: Mapped[date] = mapped_column(
        Date,
        default=date.today,
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

    group = relationship(
        "Group",
        back_populates="settlements"
    )

    sender = relationship(
        "User",
        back_populates="sent_settlements",
        foreign_keys=[from_user_id]
    )

    receiver = relationship(
        "User",
        back_populates="received_settlements",
        foreign_keys=[to_user_id]
    )

    creator = relationship(
        "User",
        back_populates="created_settlements",
        foreign_keys=[created_by_id]
    )