from collections import defaultdict
from typing import Any
from uuid import UUID

from fastapi import WebSocket


class GroupConnectionManager:
    """
    Store active WebSocket connections separately
    for each SplitNest group.
    """

    def __init__(self):
        self.active_connections: dict[
            UUID,
            set[WebSocket],
        ] = defaultdict(set)

    async def connect(
        self,
        group_id: UUID,
        websocket: WebSocket,
    ) -> None:
        """
        Accept a browser connection and add it to
        the correct group.
        """

        await websocket.accept()

        self.active_connections[
            group_id
        ].add(websocket)

    def disconnect(
        self,
        group_id: UUID,
        websocket: WebSocket,
    ) -> None:
        """
        Remove a browser when it closes the page
        or loses its connection.
        """

        group_connections = (
            self.active_connections.get(
                group_id
            )
        )

        if group_connections is None:
            return

        group_connections.discard(websocket)

        if not group_connections:
            self.active_connections.pop(
                group_id,
                None,
            )

    async def broadcast(
        self,
        group_id: UUID,
        event: dict[str, Any],
    ) -> None:
        """
        Send one event to every browser currently
        connected to this group.
        """

        group_connections = list(
            self.active_connections.get(
                group_id,
                set(),
            )
        )

        disconnected_connections = []

        for websocket in group_connections:
            try:
                await websocket.send_json(
                    event
                )

            except Exception:
                disconnected_connections.append(
                    websocket
                )

        for websocket in (
            disconnected_connections
        ):
            self.disconnect(
                group_id=group_id,
                websocket=websocket,
            )


group_connection_manager = (
    GroupConnectionManager()
)