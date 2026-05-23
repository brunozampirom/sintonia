// PartyKit room server for Sintonia multiplayer.
//
// Each instance of this class IS a room — PartyKit gives one Durable
// Object per unique URL path. Clients connect to
//   wss://<host>/parties/main/<ROOM_CODE>
// and PartyKit routes them all to the same instance. Room state lives
// on the instance (in-memory) and persists in Durable Object storage
// across deploys via the `room.storage` API.
//
// Phase 0 scope: just track presence (join / leave) and broadcast it.
// No game logic yet — Phase 2 plugs in @sintonia/game-core's reducer.

import type * as Party from "partykit/server";
import type {
  ClientMessage,
  PublicPlayer,
  PublicRoomState,
  ServerMessage,
} from "@sintonia/game-core";

interface RoomMember {
  connectionId: string;
  playerId: string;
  name: string;
  color: string;
  connected: boolean;
  isHost: boolean;
  isReady: boolean;
}

export default class SintoniaRoom implements Party.Server {
  // playerId → member (one persistent ID across reconnects)
  private members: Map<string, RoomMember> = new Map();
  private hostPlayerId: string | null = null;

  constructor(readonly room: Party.Room) {}

  // ---------- Lifecycle ----------

  onConnect(conn: Party.Connection) {
    // Bare connection — the client must send { type: 'JOIN', ... } before
    // it's considered part of the room. Until then we keep it
    // anonymous. Send current state so they can render the lobby.
    conn.send(this.encodeServerMessage({ type: "STATE", state: this.publicState() }));
  }

  onMessage(rawMessage: string, sender: Party.Connection) {
    let message: ClientMessage;
    try {
      message = JSON.parse(rawMessage) as ClientMessage;
    } catch {
      this.sendError(sender, "BAD_REQUEST", "Invalid JSON.");
      return;
    }

    switch (message.type) {
      case "JOIN":
        return this.handleJoin(sender, message);
      case "LEAVE":
        return this.handleLeave(sender);
      case "READY":
        return this.handleReady(sender, message.isReady);
      default:
        // Phase 0 — game messages (START_GAME, SUBMIT_CLUE_TEXT, etc.)
        // are not implemented yet. Acknowledge gracefully.
        this.sendError(sender, "BAD_REQUEST", `Unsupported in Phase 0: ${message.type}`);
        return;
    }
  }

  onClose(conn: Party.Connection) {
    // Mark the member as disconnected but don't delete them — they can
    // reconnect within the same room session under the same playerId.
    const member = this.findMemberByConnection(conn.id);
    if (!member) return;
    member.connected = false;
    this.broadcastState();
  }

  // ---------- Handlers ----------

  private handleJoin(
    conn: Party.Connection,
    message: Extract<ClientMessage, { type: "JOIN" }>,
  ) {
    const { code, playerId, name, color } = message;
    const expectedCode = this.room.id.toUpperCase();
    if (code.toUpperCase() !== expectedCode) {
      this.sendError(conn, "INVALID_CODE", `Room code mismatch (room is ${expectedCode}).`);
      return;
    }

    const existing = this.members.get(playerId);
    if (existing) {
      // Reconnect: same player, possibly new socket
      existing.connectionId = conn.id;
      existing.connected = true;
      existing.name = name; // allow name change on reconnect
      existing.color = color;
    } else {
      const isFirst = this.members.size === 0;
      if (isFirst) this.hostPlayerId = playerId;
      this.members.set(playerId, {
        connectionId: conn.id,
        playerId,
        name,
        color,
        connected: true,
        isHost: isFirst,
        isReady: false,
      });
    }

    this.broadcastState();
  }

  private handleLeave(conn: Party.Connection) {
    const member = this.findMemberByConnection(conn.id);
    if (!member) return;
    this.members.delete(member.playerId);

    // If the host left, promote the oldest remaining member.
    if (member.playerId === this.hostPlayerId) {
      const next = this.members.values().next().value as RoomMember | undefined;
      this.hostPlayerId = next?.playerId ?? null;
      if (next) next.isHost = true;
    }

    this.broadcastState();
  }

  private handleReady(conn: Party.Connection, isReady: boolean) {
    const member = this.findMemberByConnection(conn.id);
    if (!member) return;
    member.isReady = isReady;
    this.broadcastState();
  }

  // ---------- Helpers ----------

  private findMemberByConnection(connectionId: string): RoomMember | undefined {
    for (const m of this.members.values()) {
      if (m.connectionId === connectionId) return m;
    }
    return undefined;
  }

  private publicState(): PublicRoomState {
    const players: PublicPlayer[] = [];
    for (const m of this.members.values()) {
      players.push({
        id: m.playerId,
        name: m.name,
        color: m.color,
        connected: m.connected,
        isHost: m.isHost,
        isReady: m.isReady,
        score: 0,
      });
    }
    return {
      code: this.room.id.toUpperCase(),
      hostId: this.hostPlayerId ?? "",
      phase: "lobby",
      voiceMode: false,
      players,
      roundNumber: 0,
      history: [],
    };
  }

  private broadcastState() {
    this.room.broadcast(
      this.encodeServerMessage({ type: "STATE", state: this.publicState() }),
    );
  }

  private sendError(
    conn: Party.Connection,
    code: Extract<ServerMessage, { type: "ERROR" }>["code"],
    message: string,
  ) {
    conn.send(this.encodeServerMessage({ type: "ERROR", code, message }));
  }

  private encodeServerMessage(msg: ServerMessage): string {
    return JSON.stringify(msg);
  }
}

SintoniaRoom satisfies Party.Worker;
