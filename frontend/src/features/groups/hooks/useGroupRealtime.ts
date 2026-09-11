import {
  useEffect
} from "react";
import {
  useQueryClient
} from "@tanstack/react-query";

import {
  getAccessToken
} from "../../auth/store/tokenStore";


interface RealtimeEvent {
  type: string;
  group_id?: string;
}


export function useGroupRealtime(
  groupId: string | undefined
) {
  const queryClient = useQueryClient();


  useEffect(() => {
    if (!groupId) {
      return;
    }

    let socket: WebSocket | null = null;

    let reconnectTimer:
      ReturnType<typeof setTimeout>
      | null = null;

    let heartbeatTimer:
      ReturnType<typeof setInterval>
      | null = null;

    let shouldReconnect = true;


    function connect() {
      const accessToken =
        getAccessToken();

      const apiUrl =
        import.meta.env.VITE_API_URL;

      if (!accessToken || !apiUrl) {
        return;
      }

      const websocketBaseUrl =
        apiUrl.replace(
          /^http/,
          "ws"
        );

      const websocketUrl =
        `${websocketBaseUrl}` +
        `/ws/groups/${groupId}` +
        `?token=${encodeURIComponent(
          accessToken
        )}`;

      socket = new WebSocket(
        websocketUrl
      );


      socket.onopen = () => {
        heartbeatTimer = setInterval(
          () => {
            if (
              socket?.readyState ===
              WebSocket.OPEN
            ) {
              socket.send("ping");
            }
          },
          25000
        );
      };


      socket.onmessage = (
        messageEvent
      ) => {
        try {
          const event =
            JSON.parse(
              messageEvent.data
            ) as RealtimeEvent;

          if (
            event.type ===
              "connection.ready" ||
            event.type ===
              "connection.pong"
          ) {
            return;
          }

          void Promise.all([
            queryClient.invalidateQueries({
              queryKey: [
                "groups",
                groupId
              ]
            }),

            queryClient.invalidateQueries({
              queryKey: [
                "groups",
                groupId,
                "expenses"
              ]
            }),

            queryClient.invalidateQueries({
              queryKey: [
                "groups",
                groupId,
                "balances"
              ]
            }),

            queryClient.invalidateQueries({
              queryKey: [
                "groups",
                groupId,
                "debt-suggestions"
              ]
            }),

            queryClient.invalidateQueries({
  queryKey: [
    "groups",
    groupId,
    "settlements"
  ]
}),

queryClient.invalidateQueries({
  queryKey: [
    "group-activities",
    groupId
  ]
})
          ]);

        } catch {
          // Ignore messages that are not valid JSON.
        }
      };


      socket.onclose = () => {
        if (heartbeatTimer) {
          clearInterval(
            heartbeatTimer
          );

          heartbeatTimer = null;
        }

        if (shouldReconnect) {
          reconnectTimer = setTimeout(
            connect,
            3000
          );
        }
      };


      socket.onerror = () => {
        socket?.close();
      };
    }


    connect();


    return () => {
      shouldReconnect = false;

      if (reconnectTimer) {
        clearTimeout(
          reconnectTimer
        );
      }

      if (heartbeatTimer) {
        clearInterval(
          heartbeatTimer
        );
      }

      socket?.close();
    };
  }, [
    groupId,
    queryClient
  ]);
}