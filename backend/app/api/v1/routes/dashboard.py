from fastapi import (
    APIRouter,
    Depends,
)
from sqlalchemy.orm import Session

from app.api.dependencies.auth import (
    get_current_user,
)
from app.db.dependencies import get_db
from app.models.user import User
from app.schemas.dashboard import (
    DashboardSummaryResponse,
)
from app.services.dashboard_service import (
    get_dashboard_summary,
)


router = APIRouter()


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
)
def read_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
) -> DashboardSummaryResponse:
    return get_dashboard_summary(
        db=db,
        current_user=current_user,
    )