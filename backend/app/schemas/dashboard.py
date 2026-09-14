from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel

from app.models.enums import GroupRole


class DashboardGroupItem(BaseModel):
    id: UUID
    name: str
    description: str | None
    default_currency: str
    current_user_role: GroupRole
    member_count: int
    created_at: datetime


class DashboardActivityItem(BaseModel):
    id: UUID
    group_id: UUID
    group_name: str
    actor_name: str
    action: str
    entity_type: str
    entity_id: UUID | None
    details: dict[str, Any]
    created_at: datetime


class DashboardSummaryResponse(BaseModel):
    currency: str
    total_balance: Decimal
    you_are_owed: Decimal
    you_owe: Decimal
    active_groups: int
    recent_groups: list[DashboardGroupItem]
    recent_activities: list[DashboardActivityItem]