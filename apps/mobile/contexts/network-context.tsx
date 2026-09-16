// NetworkContext — owns the WebSocket connection to the PartyKit
// room server. Wraps each "session" (one connected room) in a single
// hook surface so screens don't have to wrangle ws lifecycle.
//
// Phase 3: auto-reconnect with exponential backoff. When the socket
// drops unexpectedly (network blip, server reboot) we retry up to
// MAX_RETRIES times. Same playerId + room code = server treats it as
// a reconnect and restores the seat. Explicit `disconnect()` (user
// pressed leave) suppresses retry by clearing the saved params.

import { getOrCreatePlayerId } from "@/lib/persistent-id";
import type {
  ClientMessage,
  PublicRoomState,
  ServerMessage,
} from "@sintonia/game-core";
import Constants from "expo-constants";
import { NativeModules } from "react-native";
// RN's own accessor for the dev server that served this bundle. Works under
// bridgeless, where NativeModules.SourceCode is no longer reachable. It is an
// internal path and ships no types, hence the suppression.
// @ts-expect-error untyped React Native internal
import getDevServer from "react-native/Libraries/Core/Devtools/getDevServer";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

// Dev: PartyKit local server. On a real device "localhost" is the phone
// itself, so we must point at the machine serving the app. The most
// reliable source for that is the URL the JS bundle was loaded from,
// by definition the dev machine, and it is correct on a simulator, on a
// device over LAN, and in Expo Go alike. `Constants.expoConfig.hostUri`
// comes back null in a dev build, which is how this used to fall through
// to a hardcoded IP that went stale the moment the wifi changed.
//
// Prod: our own Cloudflare Worker on a domain we control, so this host
// can be repointed without shipping a new binary to the stores.
const DEV_LAN_FALLBACK = "127.0.0.1"; // last resort; only if every source fails

function safeDevServerUrl(): string | null {
  try {
    return getDevServer()?.url ?? null;
  } catch {
    return null;
  }
}

function resolveDevPartykitHost(): string {
  const sources: Array<[string, string | null | undefined]> = [
    // e.g. http://10.0.0.5:8081/, the dev server that served this bundle
    ["devServer", safeDevServerUrl()],
    ["scriptURL", NativeModules?.SourceCode?.scriptURL],
    ["hostUri", Constants.expoConfig?.hostUri],
    ["debuggerHost", Constants.expoGoConfig?.debuggerHost],
  ];

  for (const [name, raw] of sources) {
    if (!raw) continue;
    // Strip scheme if present, then take the host up to the port.
    const withoutScheme = raw.replace(/^[a-z]+:\/\//i, "");
    const candidate = withoutScheme.split("/")[0]?.split(":")[0];
    // exp.host (tunnel) won't reach a local PartyKit; keep looking.
    if (!candidate || candidate.includes("exp.")) continue;
    const resolved = `${candidate}:1999`;
    console.log(`[NetworkContext] PartyKit host ${resolved} (from ${name}: ${raw})`);
    return resolved;
  }

  console.warn(
    `[NetworkContext] no dev host found, falling back to ${DEV_LAN_FALLBACK}:1999`
  );
  return `${DEV_LAN_FALLBACK}:1999`;
}

const PARTYKIT_HOST = __DEV__
  ? resolveDevPartykitHost()
  : "ws.sintonia.party"; // PartyServer on Cloudflare Workers, custom domain

// Reconnect with exponential backoff up to RETRY_MAX_MS, then keep retrying
// at that ceiling indefinitely. Real-world reasons the socket might drop —
// PartyKit deploy, brief wifi blip, app backgrounded — usually clear within
// seconds; giving up too early strands the player in a dead room.
const RETRY_BASE_MS = 500; // 500ms, 1s, 2s, 4s, 8s, then 8s, 8s, ...
const RETRY_MAX_MS = 8000;

function buildSocketUrl(code: string): string {
  const protocol = __DEV__ ? "ws" : "wss";
  return `${protocol}://${PARTYKIT_HOST}/parties/main/${code.toUpperCase()}`;
}

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";

interface ConnectParams {
  code: string;
  name: string;
  color: string;
  /** "host" creates the room; "guest" requires the room to already exist. */
  mode?: "host" | "guest";
}

interface NetworkContextValue {
  status: ConnectionStatus;
  state: PublicRoomState | null;
  privateTargetAngle: number | null;
  lastError: { code: string; message: string } | null;
  playerId: string | null;
  /** Retry attempt counter (resets to 0 on success). */
  retryAttempt: number;
  /** Latest room-closure notice from the server. `reason: "host"` = host
   * closed; `reason: "kicked"` = the host removed THIS client. */
  roomClosure: { reason: "host" | "kicked" } | null;
  /** Connect to a room by code. Returns a promise that resolves once JOIN is sent. */
  connect: (params: ConnectParams) => Promise<void>;
  /** Tear down current connection. Suppresses auto-reconnect. */
  disconnect: () => void;
  /** Send a typed client message. No-op if not connected. */
  send: (message: ClientMessage) => void;
  /** Clear the room closure notice (after the screen showed it). */
  clearRoomClosure: () => void;
}

const NetworkContext = createContext<NetworkContextValue>({
  status: "idle",
  state: null,
  privateTargetAngle: null,
  lastError: null,
  playerId: null,
  retryAttempt: 0,
  roomClosure: null,
  connect: async () => {},
  disconnect: () => {},
  send: () => {},
  clearRoomClosure: () => {},
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [state, setState] = useState<PublicRoomState | null>(null);
  const [privateTargetAngle, setPrivateTargetAngle] = useState<number | null>(null);
  const [lastError, setLastError] = useState<{ code: string; message: string } | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [roomClosure, setRoomClosure] = useState<{ reason: "host" | "kicked" } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  // Last connect params — used to replay JOIN on reconnect.
  const sessionRef = useRef<ConnectParams | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // When true, an explicit user-initiated disconnect happened — don't auto-reconnect.
  const userDisconnectedRef = useRef(false);
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

  const clearRetryTimer = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  const send = useCallback((message: ClientMessage) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(message));
  }, []);

  // Internal connect — does the actual WS dance. Called by public `connect`
  // (initial) and the retry timer.
  const openSocket = useCallback(
    async (params: ConnectParams, attempt: number) => {
      // Tear down any previous connection cleanly.
      if (wsRef.current) {
        try { wsRef.current.close(); } catch { /* noop */ }
        wsRef.current = null;
      }

      const id = playerId ?? (await getOrCreatePlayerId());
      if (!playerId) setPlayerId(id);

      const url = buildSocketUrl(params.code);
      setStatus(attempt === 0 ? "connecting" : "reconnecting");
      setRetryAttempt(attempt);

      const ws = new WebSocket(url);
      wsRef.current = ws;
      pendingJoinRef.current = {
        type: "JOIN",
        code: params.code.toUpperCase(),
        playerId: id,
        name: params.name,
        color: params.color,
        mode: params.mode,
      };

      ws.onopen = () => {
        setStatus("connected");
        setRetryAttempt(0);
        setLastError(null);
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
            // Terminal errors abort retry — server rejected the join.
            if (msg.code === "INVALID_CODE" || msg.code === "ROOM_FULL" || msg.code === "ALREADY_STARTED") {
              userDisconnectedRef.current = true;
            }
            break;
          case "ROOM_CLOSED":
            // Host nuked the room. Don't try to reconnect to a dead room.
            userDisconnectedRef.current = true;
            sessionRef.current = null;
            setRoomClosure({ reason: msg.reason });
            break;
          case "KICKED":
            // Host removed this client. Same vibe as ROOM_CLOSED for us, but
            // we want to surface a different message to the player.
            userDisconnectedRef.current = true;
            sessionRef.current = null;
            setRoomClosure({ reason: "kicked" });
            break;
        }
      };

      ws.onerror = () => {
        // We don't set 'error' immediately — onclose will fire next and
        // decide whether to retry or stay errored.
      };

      ws.onclose = () => {
        if (wsRef.current !== ws) return; // a newer connection replaced this one
        wsRef.current = null;

        // If the user explicitly left, stop here.
        if (userDisconnectedRef.current) {
          setStatus("disconnected");
          return;
        }

        // If the server told us off (invalid code etc.), no point retrying.
        if (sessionRef.current == null) {
          setStatus("disconnected");
          return;
        }

        // Retry path — infinite, capped at RETRY_MAX_MS.
        const nextAttempt = attempt + 1;
        setStatus("reconnecting");
        setRetryAttempt(nextAttempt);
        const delay = Math.min(RETRY_BASE_MS * Math.pow(2, nextAttempt - 1), RETRY_MAX_MS);
        retryTimerRef.current = setTimeout(() => {
          if (!sessionRef.current || userDisconnectedRef.current) return;
          void openSocket(sessionRef.current, nextAttempt);
        }, delay);
      };
    },
    [playerId],
  );

  const connect = useCallback(
    async (params: ConnectParams) => {
      userDisconnectedRef.current = false;
      sessionRef.current = params;
      setRoomClosure(null);
      clearRetryTimer();
      await openSocket(params, 0);
    },
    [openSocket],
  );

  const clearRoomClosure = useCallback(() => setRoomClosure(null), []);

  const disconnect = useCallback(() => {
    userDisconnectedRef.current = true;
    sessionRef.current = null;
    clearRetryTimer();
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
    setRetryAttempt(0);
  }, []);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      clearRetryTimer();
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
      retryAttempt,
      roomClosure,
      connect,
      disconnect,
      send,
      clearRoomClosure,
    }),
    [status, state, privateTargetAngle, lastError, playerId, retryAttempt, roomClosure, connect, disconnect, send, clearRoomClosure],
  );

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork() {
  return useContext(NetworkContext);
}
