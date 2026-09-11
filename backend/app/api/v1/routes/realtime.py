from uuid import UUID

from fastapi import (
    APIRouter,
    Query,
    WebSocket,
    WebSocketDisconnect,
)
from jwt.exceptions import InvalidTokenError
from sqlalchemy import select

from app.core.config import settings
from app.core.security import (
    decode_access_token,
)
from app.db.session import SessionLocal
from app.models.group import GroupMember
from app.models.user import User
from app.realtime.manager import (
    group_connection_manager,
)


router = APIRouter()


@router.websocket(
    "/groups/{group_id}"
)
async def group_websocket(
    websocket: WebSocket,
    group_id: UUID,
    token: str = Query(...),
):
    """
    Connect an authenticated group member to
    real-time updates for one group.
    """

    allowed_origins = set(
        settings.backend_cors_origins
    )

    allowed_origins.update({
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    })

    origin = websocket.headers.get(
        "origin"
    )

    if (
        origin is not None
        and origin not in allowed_origins
    ):
        await websocket.close(code=1008)
        return

    try:
        user_id = decode_access_token(
            token
        )

    except InvalidTokenError:
        await websocket.close(code=1008)
        return

    db = SessionLocal()

    try:
        user = db.get(User, user_id)

        membership = db.scalar(
            select(GroupMember).where(
                GroupMember.group_id
                == group_id,
                GroupMember.user_id
                == user_id,
            )
        )

        if (
            user is None
            or not user.is_active
            or membership is None
        ):
            await websocket.close(
                code=1008
            )

            return

    finally:
        db.close()

    await group_connection_manager.connect(
        group_id=group_id,
        websocket=websocket,
    )

    await websocket.send_json({
        "type": "connection.ready",
        "group_id": str(group_id),
    })

    try:
        while True:
            message = (
                await websocket.receive_text()
            )

            if message == "ping":
                await websocket.send_json({
                    "type": "connection.pong",
                })

    except WebSocketDisconnect:
        group_connection_manager.disconnect(
            group_id=group_id,
            websocket=websocket,
        )

    except Exception:
        group_connection_manager.disconnect(
            group_id=group_id,
            websocket=websocket,
        )