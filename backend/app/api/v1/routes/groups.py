

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    Header,
    HTTPException,
    status,
)
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from uuid import UUID
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseResponse,
    GroupBalanceResponse,
    GroupDebtSimplificationResponse,
)
from app.schemas.activity import ActivityListResponse
from app.services.activity_service import (
    ActivityGroupNotAccessibleError,
    get_group_activities,
)
from app.realtime.manager import (
    group_connection_manager,
)
from app.services.settlement_service import (
    SettlementAmountExceedsBalanceError,
    SettlementDebtNotFoundError,
    SettlementGroupNotAccessibleError,
    SettlementMemberInvalidError,
    SettlementPermissionError,
    SettlementIdempotencyConflictError,
    create_settlement,
    get_group_settlements
)

from app.services.expense_service import (
    ExpenseDeletePermissionError,
    ExpenseGroupNotAccessibleError,
    ExpenseNotFoundError,
    ExpenseParticipantNotMemberError,
    ExpensePayerNotMemberError,
    create_equal_split_expense,
    delete_group_expense,
    get_group_balances,
    get_group_expenses,
    ExpenseUpdatePermissionError,
update_group_expense,
simplify_group_debts
)
from app.api.dependencies.auth import get_current_user
from app.db.dependencies import get_db
from app.models.user import User
from app.schemas.group import (
    GroupCreate,
    GroupDetailResponse,
    GroupListItem,
    GroupMemberAdd,
    GroupMemberDetail,
    GroupResponse,
)
from app.services.group_service import (
    GroupAdminRequiredError,
    GroupNotAccessibleError,
    MemberUserNotFoundError,
    UserAlreadyGroupMemberError,
    add_group_member,
    create_group,
    get_group_detail,
    get_user_groups,
)
from app.schemas.settlement import (
    SettlementCreate,
    SettlementResponse
)

router = APIRouter()


@router.post(
    "",
    response_model=GroupResponse,
    status_code=status.HTTP_201_CREATED
)
def create_expense_group(
    group_data: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> GroupResponse:
    try:
        return create_group(
            db,
            group_data,
            current_user
        )

    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create the group"
        ) from None

@router.get(
    "",
    response_model=list[GroupListItem]
)
def list_my_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> list[GroupListItem]:
    return get_user_groups(
        db,
        current_user
    )
    
@router.get(
    "/{group_id}",
    response_model=GroupDetailResponse
)
def retrieve_group_detail(
    group_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> GroupDetailResponse:
    group_detail = get_group_detail(
        db,
        group_id,
        current_user
    )

    if group_detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    return group_detail
@router.post(
    "/{group_id}/members",
    response_model=GroupMemberDetail,
    status_code=status.HTTP_201_CREATED,
)
def add_member_to_group(
    group_id: UUID,
    member_data: GroupMemberAdd,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
) -> GroupMemberDetail:
    try:
        member = add_group_member(
            db=db,
            group_id=group_id,
            member_data=member_data,
            current_user=current_user,
        )

        background_tasks.add_task(
            group_connection_manager.broadcast,
            group_id,
            {
                "type": "member.added",
                "group_id": str(group_id),
                "user_id": str(
                    member.user_id
                ),
            },
        )

        return member

    except GroupNotAccessibleError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found",
        ) from None

    except GroupAdminRequiredError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Only a group admin can "
                "add members"
            ),
        ) from None

    except MemberUserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No SplitNest user exists "
                "with this email"
            ),
        ) from None

    except UserAlreadyGroupMemberError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This user is already "
                "a group member"
            ),
        ) from None

    except SQLAlchemyError:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail="Unable to add the group member",
        ) from None
@router.post(
    "/{group_id}/expenses",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_group_expense(
    group_id: UUID,
    expense_data: ExpenseCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
) -> ExpenseResponse:
    try:
        expense = create_equal_split_expense(
            db=db,
            group_id=group_id,
            expense_data=expense_data,
            current_user=current_user,
        )

        background_tasks.add_task(
            group_connection_manager.broadcast,
            group_id,
            {
                "type": "expense.created",
                "group_id": str(group_id),
                "expense_id": str(expense.id),
            },
        )

        return expense

    except ExpenseGroupNotAccessibleError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found",
        ) from None

    except ExpensePayerNotMemberError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "The payer must be a group member"
            ),
        ) from None

    except ExpenseParticipantNotMemberError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Every participant must be "
                "a group member"
            ),
        ) from None

    except SQLAlchemyError:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail="Unable to create the expense",
        ) from None
@router.get(
    "/{group_id}/expenses",
    response_model=list[ExpenseResponse]
)
def list_group_expenses(
    group_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
) -> list[ExpenseResponse]:
    try:
        return get_group_expenses(
            db,
            group_id,
            current_user
        )

    except ExpenseGroupNotAccessibleError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        ) from None

    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load group expenses"
        ) from None
        
@router.get(
    "/{group_id}/balances",
    response_model=GroupBalanceResponse,
)
def retrieve_group_balances(
    group_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
) -> GroupBalanceResponse:
    try:
        return get_group_balances(
            db=db,
            group_id=group_id,
            current_user=current_user,
        )

    except ExpenseGroupNotAccessibleError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found",
        ) from None

    except SQLAlchemyError:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail="Unable to calculate balances",
        ) from None


@router.get(
    "/{group_id}/debt-suggestions",
    response_model=GroupDebtSimplificationResponse,
)
def retrieve_debt_suggestions(
    group_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
) -> GroupDebtSimplificationResponse:
    try:
        return simplify_group_debts(
            db=db,
            group_id=group_id,
            current_user=current_user,
        )

    except ExpenseGroupNotAccessibleError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found",
        ) from None

    except SQLAlchemyError:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to calculate "
                "debt suggestions"
            ),
        ) from None
@router.post(
    "/{group_id}/settlements",
    response_model=SettlementResponse,
    status_code=status.HTTP_201_CREATED,
)
def record_group_settlement(
    group_id: UUID,
    settlement_data: SettlementCreate,
    background_tasks: BackgroundTasks,

    idempotency_key: str = Header(
        ...,
        alias="Idempotency-Key",
        min_length=1,
        max_length=64,
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
) -> SettlementResponse:
    try:
        settlement = create_settlement(
            db=db,
            group_id=group_id,
            settlement_data=settlement_data,
            current_user=current_user,
            idempotency_key=idempotency_key,
        )

        background_tasks.add_task(
            group_connection_manager.broadcast,
            group_id,
            {
                "type": "settlement.created",
                "group_id": str(group_id),
                "settlement_id": str(
                    settlement.id
                ),
            },
        )

        return settlement

    except SettlementGroupNotAccessibleError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found",
        ) from None

    except SettlementMemberInvalidError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Both people must be members "
                "of this group"
            ),
        ) from None

    except SettlementPermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You cannot record this "
                "settlement"
            ),
        ) from None

    except SettlementDebtNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "The selected sender does not "
                "currently owe the receiver"
            ),
        ) from None

    except SettlementAmountExceedsBalanceError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Settlement amount cannot exceed "
                f"{error.maximum_amount}"
            ),
        ) from None

    except SettlementIdempotencyConflictError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This payment request conflicts "
                "with an existing request"
            ),
        ) from None

    except SQLAlchemyError:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail="Unable to record settlement",
        ) from None
@router.get(
    "/{group_id}/settlements",
    response_model=list[SettlementResponse]
)
def list_group_settlements(
    group_id: UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
) -> list[SettlementResponse]:
    try:
        return get_group_settlements(
            db,
            group_id,
            current_user
        )

    except SettlementGroupNotAccessibleError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        ) from None

    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load settlements"
        ) from None
@router.delete(
    "/{group_id}/expenses/{expense_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_group_expense(
    group_id: UUID,
    expense_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
) -> None:
    try:
        delete_group_expense(
            db=db,
            group_id=group_id,
            expense_id=expense_id,
            current_user=current_user,
        )

        background_tasks.add_task(
            group_connection_manager.broadcast,
            group_id,
            {
                "type": "expense.deleted",
                "group_id": str(group_id),
                "expense_id": str(expense_id),
            },
        )

    except ExpenseGroupNotAccessibleError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found",
        ) from None

    except ExpenseNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        ) from None

    except ExpenseDeletePermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You do not have permission "
                "to delete this expense"
            ),
        ) from None

    except SQLAlchemyError:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail="Unable to delete the expense",
        ) from None
@router.put(
    "/{group_id}/expenses/{expense_id}",
    response_model=ExpenseResponse,
)
def edit_group_expense(
    group_id: UUID,
    expense_id: UUID,
    expense_data: ExpenseCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
) -> ExpenseResponse:
    try:
        expense = update_group_expense(
            db=db,
            group_id=group_id,
            expense_id=expense_id,
            expense_data=expense_data,
            current_user=current_user,
        )

        background_tasks.add_task(
            group_connection_manager.broadcast,
            group_id,
            {
                "type": "expense.updated",
                "group_id": str(group_id),
                "expense_id": str(expense.id),
            },
        )

        return expense

    except ExpenseGroupNotAccessibleError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found",
        ) from None

    except ExpenseNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        ) from None

    except ExpenseUpdatePermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You do not have permission "
                "to edit this expense"
            ),
        ) from None

    except ExpensePayerNotMemberError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "The payer must be a group member"
            ),
        ) from None

    except ExpenseParticipantNotMemberError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Every participant must be "
                "a group member"
            ),
        ) from None

    except SQLAlchemyError:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail="Unable to update the expense",
        ) from None
@router.get(
    "/{group_id}/activities",
    response_model=ActivityListResponse,
)
def list_group_activities(
    group_id: UUID,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ActivityListResponse:
    try:
        return get_group_activities(
            db=db,
            group_id=group_id,
            current_user=current_user,
            limit=limit,
            offset=offset,
        )

    except ActivityGroupNotAccessibleError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found",
        ) from None