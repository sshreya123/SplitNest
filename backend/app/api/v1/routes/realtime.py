import asyncio
from uuid import UUID

from fastapi import (
    APIRouter,
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

AUTHENTICATION_TIMEOUT_SECONDS = 5


@router.websocket(
    "/groups/{group_id}"
)
async def group_websocket(
    websocket: WebSocket,
    group_id: UUID,
):
    """
    Connect an authenticated group member to
    real-time updates for one group.

    Authentication is received through the first
    WebSocket message instead of the URL.
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

    # The socket must be accepted before the
    # backend can receive its first message.
    await websocket.accept()

    try:
        authentication_message = (
            await asyncio.wait_for(
                websocket.receive_json(),
                timeout=(
                    AUTHENTICATION_TIMEOUT_SECONDS
                ),
            )
        )

    except asyncio.TimeoutError:
        await websocket.close(
            code=1008,
            reason="Authentication timed out",
        )
        return

    except WebSocketDisconnect:
        return

    except ValueError:
        await websocket.close(
            code=1008,
            reason="Invalid authentication message",
        )
        return

    if (
        not isinstance(
            authentication_message,
            dict,
        )
        or authentication_message.get("type")
        != "authenticate"
    ):
        await websocket.close(
            code=1008,
            reason="Authentication required",
        )
        return

    token = authentication_message.get(
        "token"
    )

    if (
        not isinstance(token, str)
        or not token
    ):
        await websocket.close(
            code=1008,
            reason="Access token required",
        )
        return

    try:
        user_id = decode_access_token(
            token
        )

    except InvalidTokenError:
        await websocket.close(
            code=1008,
            reason="Invalid access token",
        )
        return

    db = SessionLocal()

    try:
        user = db.get(
            User,
            user_id,
        )

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
                code=1008,
                reason="Group access denied",
            )
            return

    finally:
        db.close()

    # The route has already accepted the socket.
    # Therefore, the manager must not accept it again.
    await group_connection_manager.connect(
        group_id=group_id,
        websocket=websocket,
        accept_connection=False,
    )

    try:
        await websocket.send_json({
            "type": "connection.ready",
            "group_id": str(group_id),
        })

        while True:
            message = (
                await websocket.receive_text()
            )

            if message == "ping":
                await websocket.send_json({
                    "type": "connection.pong",
                })

    except WebSocketDisconnect:
        pass

    except Exception:
        pass

    finally:
        group_connection_manager.disconnect(
            group_id=group_id,
            websocket=websocket,
        )