from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class ActivityResponse(BaseModel):
    id: UUID
    group_id: UUID
    actor_id: UUID
    actor_name: str
    action: str
    entity_type: str
    entity_id: UUID | None
    details: dict[str, Any]
    created_at: datetime


class ActivityListResponse(BaseModel):
    items: list[ActivityResponse]

    total: int = Field(
        ge=0
    )

    limit: int = Field(
        ge=1,
        le=100
    )

    offset: int = Field(
        ge=0
    )