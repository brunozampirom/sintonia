// NetworkContext — owns the WebSocket connection to the PartyKit
// room server. Wraps each "session" (one connected room) in a single
// hook surface so screens don't have to wrangle ws lifecycle.
//
// Phase 0: connect to a room by code, send JOIN, observe the public
// state. No game logic yet — Phase 2 wires START_GAME et al.

import { getOrCreatePlayerId } from "@/lib/persistent-id";
import type {
  ClientMessage,
  PublicRoomState,
  ServerMessage,
} from "@sintonia/game-core";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

// Dev: PartyKit local server. Prod: deployed PartyKit URL (TBD when
// we run `partykit deploy`).
const PARTYKIT_HOST = __DEV__
  ? "localhost:1999"
  : "sintonia.brunozampirom.partykit.dev"; // placeholder; update on first deploy

function buildSocketUrl(code: string): string {
  const protocol = __DEV__ ? "ws" : "wss";
  return `${protocol}://${PARTYKIT_HOST}/parties/main/${code.toUpperCase()}`;
}

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

interface NetworkContextValue {
  status: ConnectionStatus;
  state: PublicRoomState | null;
  privateTargetAngle: number | null;
  lastError: { code: string; message: string } | null;
  playerId: string | null;
  /** Connect to a room by code. Returns a promise that resolves once JOIN is sent. */
  connect: (params: { code: string; name: string; color: string }) => Promise<void>;
  /** Tear down current connection. */
  disconnect: () => void;
  /** Send a typed client message. No-op if not connected. */
  send: (message: ClientMessage) => void;
}

const NetworkContext = createContext<NetworkContextValue>({
  status: "idle",
  state: null,
  privateTargetAngle: null,
  lastError: null,
  playerId: null,
  connect: async () => {},
  disconnect: () => {},
  send: () => {},
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [state, setState] = useState<PublicRoomState | null>(null);
  const [privateTargetAngle, setPrivateTargetAngle] = useState<number | null>(null);
  const [lastError, setLastError] = useState<{ code: string; message: string } | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  // Pending payload sent the instant the socket opens. Lets `connect()`
  // resolve early without callers needing to await onOpen explicitly.
  const pendingJoinRef = useRef<ClientMessage | null>(null);

  // Resolve the persistent player ID up-front so it's ready by the time
  // any screen wants to join a room.
  useEffect(() => {
    let active = true;
    getOrCreatePlayerId().then((id) => {
      if (active) setPlayerId(id);
    });
    return () => {
      active = false;
    };
  }, []);

  const send = useCallback((message: ClientMessage) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(message));
  }, []);

  const disconnect = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: "LEAVE" } satisfies ClientMessage));
      } catch {
        // socket may have just closed
      }
    }
    ws?.close();
    wsRef.current = null;
    pendingJoinRef.current = null;
    setStatus("idle");
    setState(null);
    setPrivateTargetAngle(null);
  }, []);

  const connect = useCallback(
    async ({ code, name, color }: { code: string; name: string; color: string }) => {
      // Tear down any previous connection cleanly.
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      const id = playerId ?? (await getOrCreatePlayerId());
      if (!playerId) setPlayerId(id);

      const url = buildSocketUrl(code);
      setStatus("connecting");
      setLastError(null);

      const ws = new WebSocket(url);
      wsRef.current = ws;
      pendingJoinRef.current = {
        type: "JOIN",
        code: code.toUpperCase(),
        playerId: id,
        name,
        color,
      };

      ws.onopen = () => {
        setStatus("connected");
        const pending = pendingJoinRef.current;
        pendingJoinRef.current = null;
        if (pending) ws.send(JSON.stringify(pending));
      };

      ws.onmessage = (evt) => {
        let msg: ServerMessage;
        try {
          msg = JSON.parse(typeof evt.data === "string" ? evt.data : "") as ServerMessage;
        } catch {
          return;
        }
        switch (msg.type) {
          case "STATE":
            setState(msg.state);
            break;
          case "PRIVATE_TARGET":
            setPrivateTargetAngle(msg.angle);
            break;
          case "ERROR":
            setLastError({ code: msg.code, message: msg.message });
            break;
        }
      };

      ws.onerror = () => {
        setStatus("error");
      };

      ws.onclose = () => {
        if (wsRef.current === ws) {
          wsRef.current = null;
          setStatus("disconnected");
        }
      };
    },
    [playerId],
  );

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  const value = useMemo<NetworkContextValue>(
    () => ({
      status,
      state,
      privateTargetAngle,
      lastError,
      playerId,
      connect,
      disconnect,
      send,
    }),
    [status, state, privateTargetAngle, lastError, playerId, connect, disconnect, send],
  );

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork() {
  return useContext(NetworkContext);
}
