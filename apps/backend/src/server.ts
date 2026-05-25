// PartyKit room server for Sintonia multiplayer.
//
// Each instance of this class IS a room — PartyKit gives one Durable
// Object per unique URL path. Clients connect to
//   wss://<host>/parties/main/<ROOM_CODE>
// and PartyKit routes them all to the same instance. Room state lives
// on the instance (in-memory) and persists in Durable Object storage
// across deploys via the `room.storage` API.
//
// Phase 2: full game loop. Server owns truth — runs gameReducer from
// @sintonia/game-core, sends PRIVATE_TARGET to the cluer, accumulates
// parallel all-guess submissions before dispatching to the reducer.

import type * as Party from "partykit/server";
import {
  computeAvgDiffs,
  createInitialState,
  gameReducer,
  rollRoles,
  type ClientMessage,
  type GameInitConfig,
  type GameState,
  type PublicPlayer,
  type PublicRoomState,
  type PublicRoundGuess,
  type PublicRoundState,
  type ServerErrorCode,
  type ServerMessage,
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

interface ActiveGame {
  state: GameState;
  voiceMode: boolean;
  /** Reducer indices ↔ player ids, frozen at START_GAME time. */
  playerIdByIndex: string[];
  /** Set of player ids ready to advance from `result` to `NEXT_ROUND`. */
  readyForNext: Set<string>;
  /** Per-round: clue text the cluer typed (text mode only). */
  clueText?: string;
  /** Per-round: parallel all-guess accumulator. playerId → angle. */
  pendingGuesses: Map<string, number>;
  /** Seconds; -1 or undefined = unlimited. */
  clueTimeLimit: number;
  guessTimeLimit: number;
  /** Timestamp (ms) when current phase deadline expires; null = no deadline. */
  deadlineAt: number | null;
  /** Pending phase-expiry timer; cleared on phase change. */
  phaseTimer: ReturnType<typeof setTimeout> | null;
  /** Pre-rolled roles for single-guess + N>=3, captured when entering result
   *  phase so `nextCluerId` is knowable while still on the result screen. */
  prerolledCluer: number | null;
  prerolledGuesser: number | null;
}

// Grace window: if the host drops (network blip, app backgrounded) they have
// this long to reconnect before we tear down the room for everyone.
const HOST_DISCONNECT_GRACE_MS = 10_000;

export default class SintoniaRoom implements Party.Server {
  // playerId → member (one persistent ID across reconnects)
  private members: Map<string, RoomMember> = new Map();
  private hostPlayerId: string | null = null;
  private game: ActiveGame | null = null;
  private hostGraceTimer: ReturnType<typeof setTimeout> | null = null;
  // Last room config pushed by the host. Synced to all clients so guests can
  // preview the match settings. Reset when the room is cleared.
  private roomConfig: import("@sintonia/game-core").RoomConfig | null = null;
  /** Pre-game countdown — set by START_GAME, cleared when game.state init runs. */
  private gameStartingAt: number | null = null;
  private gameStartTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingStart:
    | { settings: GameInitConfig; voiceMode: boolean; spectrumPool: import("@sintonia/game-core").Spectrum[] }
    | null = null;

  constructor(readonly room: Party.Room) {}

  private clearHostGraceTimer() {
    if (this.hostGraceTimer) {
      clearTimeout(this.hostGraceTimer);
      this.hostGraceTimer = null;
    }
  }

  private closeRoomBroadcast() {
    this.room.broadcast(
      this.encodeServerMessage({ type: "ROOM_CLOSED", reason: "host" }),
    );
    for (const c of this.room.getConnections()) {
      try { c.close(); } catch { /* noop */ }
    }
    this.members.clear();
    this.hostPlayerId = null;
    this.game = null;
    this.clearHostGraceTimer();
  }

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
      case "START_GAME":
        return this.handleStartGame(sender, message);
      case "SUBMIT_CLUE_TEXT":
        return this.handleSubmitClueText(sender, message.text);
      case "CLUE_SAID":
        return this.handleClueSaid(sender);
      case "SUBMIT_GUESS":
        return this.handleSubmitGuess(sender, message.angle);
      case "SKIP_CARD":
        return this.handleSkipCard(sender);
      case "READY_NEXT_ROUND":
        return this.handleReadyNextRound(sender);
      case "CLOSE_ROOM":
        return this.handleCloseRoom(sender);
      case "KICK_PLAYER":
        return this.handleKickPlayer(sender, message.targetPlayerId);
      case "RETURN_TO_LOBBY":
        return this.handleReturnToLobby(sender);
      case "UPDATE_ROOM_SETTINGS":
        return this.handleUpdateRoomSettings(sender, message.config);
      default:
        this.sendError(sender, "BAD_REQUEST", `Unsupported: ${(message as { type: string }).type}`);
        return;
    }
  }

  onClose(conn: Party.Connection) {
    // Mark the member as disconnected — they can reconnect within the same
    // room session under the same playerId.
    // Host disconnect is special: the room is the host's session, so when
    // they leave we kill the room. A short grace window covers transient
    // blips (wifi, app backgrounded); if they don't come back within that
    // window we broadcast ROOM_CLOSED and tear everything down.
    const member = this.findMemberByConnection(conn.id);
    if (!member) return;
    member.connected = false;

    if (member.playerId === this.hostPlayerId) {
      this.clearHostGraceTimer();
      this.hostGraceTimer = setTimeout(() => {
        const stillHost = this.hostPlayerId === member.playerId;
        const stillDisconnected = !this.members.get(member.playerId)?.connected;
        if (stillHost && stillDisconnected) {
          this.closeRoomBroadcast();
        }
      }, HOST_DISCONNECT_GRACE_MS);
    }

    // Don't strand the room waiting on a disconnected player's input.
    this.handlePlayerGoneMidGame(member.playerId, false);

    this.broadcastState();
  }

  // ---------- Lobby handlers ----------

  private handleJoin(
    conn: Party.Connection,
    message: Extract<ClientMessage, { type: "JOIN" }>,
  ) {
    const { code, playerId, name, color, mode } = message;
    const expectedCode = this.room.id.toUpperCase();
    if (code.toUpperCase() !== expectedCode) {
      this.sendError(conn, "INVALID_CODE", `Room code mismatch (room is ${expectedCode}).`);
      return;
    }

    const existing = this.members.get(playerId);

    // Guests can only join rooms that already exist (host is in there).
    // Without this, PartyKit's "any URL is a room" model means typing a random
    // code as a guest silently creates that room with you as the new host.
    if (!existing && mode === "guest" && this.members.size === 0) {
      this.sendError(
        conn,
        "INVALID_CODE",
        "Essa sala não existe (ou já foi encerrada).",
      );
      return;
    }

    if (existing) {
      // Reconnect: same player, possibly new socket
      existing.connectionId = conn.id;
      existing.connected = true;
      existing.name = name; // allow name change on reconnect
      existing.color = color;
      // If this is the host reconnecting within the grace window, cancel the
      // pending "close the room" timer — they made it back.
      if (playerId === this.hostPlayerId) {
        this.clearHostGraceTimer();
      }
    } else {
      // New joins during an active game are allowed (they spectate until next game)
      // but we still seat them so reconnects work. Game uses frozen playerIdByIndex,
      // so post-START joiners don't affect indexing.
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

    // If reconnecting to an active game, push the cluer their private target.
    if (this.game && this.isCluer(playerId)) {
      conn.send(this.encodeServerMessage({
        type: "PRIVATE_TARGET",
        angle: this.game.state.targetAngle,
      }));
    }

    this.broadcastState();
  }

  private handleUpdateRoomSettings(
    conn: Party.Connection,
    config: import("@sintonia/game-core").RoomConfig,
  ) {
    const member = this.findMemberByConnection(conn.id);
    if (!member) {
      this.sendError(conn, "BAD_REQUEST", "Join the room first.");
      return;
    }
    if (member.playerId !== this.hostPlayerId) {
      this.sendError(conn, "NOT_HOST", "Only the host can change room settings.");
      return;
    }
    if (this.game) {
      // Settings are a pre-game concern; ignore while a match is running.
      return;
    }
    this.roomConfig = {
      voiceMode: !!config.voiceMode,
      winningScore: Number(config.winningScore) || 10,
      skipsPerPlayer: Number(config.skipsPerPlayer) ?? 0,
      clueTimeLimit: Number(config.clueTimeLimit) ?? -1,
      guessTimeLimit: Number(config.guessTimeLimit) ?? -1,
    };
    this.broadcastState();
  }

  private handleReturnToLobby(conn: Party.Connection) {
    const member = this.findMemberByConnection(conn.id);
    if (!member) {
      this.sendError(conn, "BAD_REQUEST", "Join the room first.");
      return;
    }
    if (member.playerId !== this.hostPlayerId) {
      this.sendError(conn, "NOT_HOST", "Only the host can return to lobby.");
      return;
    }
    if (!this.game) {
      // Already in lobby — silent no-op.
      return;
    }
    if (this.game.state.phase !== "gameover") {
      this.sendError(conn, "WRONG_PHASE", "Only allowed after the game ends.");
      return;
    }
    if (this.game.phaseTimer) clearTimeout(this.game.phaseTimer);
    this.game = null;
    this.broadcastState();
  }

  private handleKickPlayer(conn: Party.Connection, targetPlayerId: string) {
    const member = this.findMemberByConnection(conn.id);
    if (!member) {
      this.sendError(conn, "BAD_REQUEST", "Join the room first.");
      return;
    }
    if (member.playerId !== this.hostPlayerId) {
      this.sendError(conn, "NOT_HOST", "Only the host can kick players.");
      return;
    }
    if (targetPlayerId === this.hostPlayerId) {
      this.sendError(conn, "BAD_REQUEST", "Host can't kick themselves.");
      return;
    }
    const target = this.members.get(targetPlayerId);
    if (!target) {
      this.sendError(conn, "BAD_REQUEST", "Player not in this room.");
      return;
    }
    // Tell the kicked player first so their client knows it was intentional,
    // then close their socket and forget them.
    for (const c of this.room.getConnections()) {
      if (c.id === target.connectionId) {
        try { c.send(this.encodeServerMessage({ type: "KICKED" })); } catch { /* noop */ }
        try { c.close(); } catch { /* noop */ }
        break;
      }
    }
    this.members.delete(targetPlayerId);
    this.broadcastState();
  }

  private handleCloseRoom(conn: Party.Connection) {
    const member = this.findMemberByConnection(conn.id);
    if (!member) {
      this.sendError(conn, "BAD_REQUEST", "Join the room first.");
      return;
    }
    if (member.playerId !== this.hostPlayerId) {
      this.sendError(conn, "NOT_HOST", "Only the host can close the room.");
      return;
    }
    this.closeRoomBroadcast();
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

    // If everyone leaves an active game, drop it.
    if (this.members.size === 0) this.game = null;

    // Mid-game: they're GONE for good — auto-advance whatever phase they
    // were blocking (clue or guess).
    this.handlePlayerGoneMidGame(member.playerId, true);

    this.broadcastState();
  }

  // Called when a seated player either explicitly leaves or drops their
  // connection. `permanent=true` means LEAVE (member removed from list);
  // permanent=false means transient disconnect (member still seated, may
  // reconnect). Transient disconnects only relax the guess-phase wait —
  // we don't force the clue forward, otherwise a brief wifi blip could
  // skip the cluer's turn.
  private handlePlayerGoneMidGame(playerId: string, permanent: boolean) {
    if (!this.game) return;
    const wasCluer =
      this.game.playerIdByIndex[this.game.state.activeSideIndex] === playerId;
    if (permanent && this.game.state.phase === "clue" && wasCluer) {
      // Cluer bailed — auto-submit so the round doesn't get stuck.
      if (!this.game.voiceMode && !this.game.clueText) {
        this.game.clueText = "(sem dica)";
      }
      this.game.state = gameReducer(this.game.state, { type: "SUBMIT_CLUE" });
      this.scheduleDeadlineForCurrentPhase();
    }
    // For guess/pass phase: drop any pending guess and re-check if remaining
    // connected players have all submitted. If yes, flush.
    this.game.pendingGuesses.delete(playerId);
    this.tryFlushAllGuesses();
  }

  private handleReady(conn: Party.Connection, isReady: boolean) {
    const member = this.findMemberByConnection(conn.id);
    if (!member) return;
    member.isReady = isReady;
    this.broadcastState();
  }

  // ---------- Game handlers ----------

  private handleStartGame(
    conn: Party.Connection,
    message: Extract<ClientMessage, { type: "START_GAME" }>,
  ) {
    const member = this.findMemberByConnection(conn.id);
    if (!member) {
      this.sendError(conn, "BAD_REQUEST", "Join the room first.");
      return;
    }
    if (member.playerId !== this.hostPlayerId) {
      this.sendError(conn, "NOT_HOST", "Only the host can start the game.");
      return;
    }
    if (this.game) {
      // Allow a restart from the gameover screen — same room, new game.
      // Otherwise (any other phase) the host is trying to double-start.
      if (this.game.state.phase !== "gameover") {
        this.sendError(conn, "ALREADY_STARTED", "A game is already in progress.");
        return;
      }
      // Tear down the previous game so the fresh init below replaces it cleanly.
      if (this.game.phaseTimer) clearTimeout(this.game.phaseTimer);
      this.game = null;
    }

    const connectedMembers = [...this.members.values()].filter((m) => m.connected);
    if (connectedMembers.length < 2) {
      this.sendError(conn, "BAD_REQUEST", "Need at least 2 connected players.");
      return;
    }

    if (message.settings.gameMode === "teams") {
      // Teams online is out of scope for Phase 2.0.
      this.sendError(conn, "BAD_REQUEST", "Teams mode is not yet supported online.");
      return;
    }
    if (!Array.isArray(message.spectrumPool) || message.spectrumPool.length === 0) {
      this.sendError(conn, "BAD_REQUEST", "Empty spectrum pool.");
      return;
    }

    // Freeze player ordering for reducer indices. Host first, then by join order.
    const ordered = [
      connectedMembers.find((m) => m.playerId === this.hostPlayerId)!,
      ...connectedMembers.filter((m) => m.playerId !== this.hostPlayerId),
    ];
    const playerIdByIndex = ordered.map((m) => m.playerId);

    // Override settings.playerNames/Colors with the actual room composition.
    const settings: GameInitConfig = {
      ...message.settings,
      gameMode: "individual",
      playerNames: ordered.map((m) => m.name),
      playerColors: ordered.map((m) => m.color),
    };

    // Three-second pre-game countdown synced to every client via gameStartingAt.
    // Server actually initializes game state when the timer fires; until then
    // the room stays in `lobby` phase so the overlay can render on top.
    const PRE_GAME_MS = 3000;
    this.pendingStart = { settings, voiceMode: message.voiceMode, spectrumPool: message.spectrumPool };
    this.gameStartingAt = Date.now() + PRE_GAME_MS;
    if (this.gameStartTimer) clearTimeout(this.gameStartTimer);
    this.gameStartTimer = setTimeout(() => {
      this.commitPendingStart(playerIdByIndex);
    }, PRE_GAME_MS);
    this.broadcastState();
  }

  private commitPendingStart(playerIdByIndex: string[]) {
    if (!this.pendingStart) return;
    const { settings, voiceMode, spectrumPool } = this.pendingStart;
    this.pendingStart = null;
    this.gameStartingAt = null;
    this.gameStartTimer = null;

    let initialState = createInitialState(settings, spectrumPool);
    if (initialState.phase === "selection") {
      const { cluer, guesser } = rollRoles(initialState.playCounts);
      initialState = gameReducer(initialState, { type: "ROLL_ROLES", cluer, guesser });
    }

    this.game = {
      state: initialState,
      voiceMode,
      playerIdByIndex,
      readyForNext: new Set(),
      pendingGuesses: new Map(),
      clueTimeLimit: settings.clueTimeLimit ?? -1,
      guessTimeLimit: settings.guessTimeLimit ?? -1,
      deadlineAt: null,
      phaseTimer: null,
      prerolledCluer: null,
      prerolledGuesser: null,
    };

    this.scheduleDeadlineForCurrentPhase();
    this.sendPrivateTargetToCluer();
    this.broadcastState();
  }

  // Sets up a deadline + timer that auto-advances the game when the cluer
  // (clue phase) or guessers (guess phase) sit on their hands. Cleared on
  // phase change. -1 / undefined = no deadline.
  private scheduleDeadlineForCurrentPhase() {
    if (!this.game) return;
    if (this.game.phaseTimer) {
      clearTimeout(this.game.phaseTimer);
      this.game.phaseTimer = null;
    }
    this.game.deadlineAt = null;

    const phase = this.game.state.phase;
    const limit =
      phase === "clue"
        ? this.game.clueTimeLimit
        : phase === "guess" || phase === "pass"
          ? this.game.guessTimeLimit
          : -1;
    if (!limit || limit <= 0) return;

    this.game.deadlineAt = Date.now() + limit * 1000;
    this.game.phaseTimer = setTimeout(() => {
      this.onPhaseExpired();
    }, limit * 1000);
  }

  // Fired when a phase deadline runs out without the expected input.
  // - clue phase: force CLUE_SAID (voice) or empty text submit (text)
  // - guess phase: random guess for every player who hasn't submitted
  private onPhaseExpired() {
    if (!this.game) return;
    const game = this.game;
    const phase = game.state.phase;

    if (phase === "clue") {
      // Move forward as if the cluer signaled "ok let's go".
      if (!game.voiceMode && !game.clueText) {
        // Text mode timed out without a clue — use a placeholder so guessers
        // see SOMETHING (otherwise the bubble would be empty).
        game.clueText = "(sem dica)";
      }
      game.state = gameReducer(game.state, { type: "SUBMIT_CLUE" });
      this.scheduleDeadlineForCurrentPhase();
      this.broadcastState();
      return;
    }

    if (phase === "guess" || phase === "pass") {
      // Auto-submit a centered (90°) guess for everyone who hasn't gone yet.
      const expected = game.state.guessQueue.slice();
      for (const idx of expected) {
        const id = game.playerIdByIndex[idx];
        if (!game.pendingGuesses.has(id)) {
          game.pendingGuesses.set(id, 90);
        }
      }
      // Drive the reducer through every queued guess in order so we land in
      // result phase (same logic as the parallel-all-guess flush).
      for (const idx of expected) {
        const id = game.playerIdByIndex[idx];
        const ang = game.pendingGuesses.get(id) ?? 90;
        game.state = gameReducer(game.state, { type: "SUBMIT_GUESS", guessAngle: ang });
      }
      game.pendingGuesses.clear();
      this.scheduleDeadlineForCurrentPhase();
      this.broadcastState();
    }
  }

  // For all-guess mode in guess/pass phase, check whether all CONNECTED
  // expected guessers have submitted. If yes, flush the round through the
  // reducer (filling 90° defaults for anyone who's offline) and broadcast.
  // Returns true if it flushed, false otherwise.
  private tryFlushAllGuesses(): boolean {
    const game = this.game;
    if (!game) return false;
    const s = game.state;
    if (s.phase !== "guess" && s.phase !== "pass") return false;
    const isAllGuess =
      s.gameMode === "individual" &&
      s.roundFlow === "all-guess" &&
      s.playerNames.length >= 3;
    if (!isAllGuess) return false;

    // Players still expected to submit — guesses are required only from
    // people who are seated AND currently connected. Anyone offline gets a
    // default 90° in the flush below so the round doesn't stall on them.
    const expectedFromConnected = s.guessQueue
      .map((i) => game.playerIdByIndex[i])
      .filter((id) => !!id && (this.members.get(id)?.connected ?? false));
    const allIn = expectedFromConnected.every((id) => game.pendingGuesses.has(id));
    if (!allIn) return false;

    for (const i of s.guessQueue.slice()) {
      const id = game.playerIdByIndex[i];
      const guessAngle = game.pendingGuesses.get(id) ?? 90;
      game.state = gameReducer(game.state, { type: "SUBMIT_GUESS", guessAngle });
    }
    game.pendingGuesses.clear();
    this.scheduleDeadlineForCurrentPhase();
    this.broadcastState();
    return true;
  }

  private handleSubmitClueText(conn: Party.Connection, text: string) {
    const game = this.requireGame(conn);
    if (!game) return;
    if (game.voiceMode) {
      this.sendError(conn, "WRONG_PHASE", "Voice mode — use CLUE_SAID instead.");
      return;
    }
    if (game.state.phase !== "clue") {
      this.sendError(conn, "WRONG_PHASE", `Not in clue phase (current: ${game.state.phase}).`);
      return;
    }
    if (!this.isCallerCluer(conn)) {
      this.sendError(conn, "NOT_YOUR_TURN", "Only the cluer can submit the clue.");
      return;
    }
    const clean = (text ?? "").trim().slice(0, 80);
    if (!clean) {
      this.sendError(conn, "BAD_REQUEST", "Clue text is empty.");
      return;
    }
    game.clueText = clean;
    game.state = gameReducer(game.state, { type: "SUBMIT_CLUE" });
    this.scheduleDeadlineForCurrentPhase();
    this.broadcastState();
  }

  private handleClueSaid(conn: Party.Connection) {
    const game = this.requireGame(conn);
    if (!game) return;
    if (!game.voiceMode) {
      this.sendError(conn, "WRONG_PHASE", "Text mode — use SUBMIT_CLUE_TEXT.");
      return;
    }
    if (game.state.phase !== "clue") {
      this.sendError(conn, "WRONG_PHASE", `Not in clue phase (current: ${game.state.phase}).`);
      return;
    }
    if (!this.isCallerCluer(conn)) {
      this.sendError(conn, "NOT_YOUR_TURN", "Only the cluer can advance from clue.");
      return;
    }
    game.state = gameReducer(game.state, { type: "SUBMIT_CLUE" });
    this.scheduleDeadlineForCurrentPhase();
    this.broadcastState();
  }

  private handleSubmitGuess(conn: Party.Connection, angle: number) {
    const game = this.requireGame(conn);
    if (!game) return;
    if (game.state.phase !== "guess" && game.state.phase !== "pass") {
      this.sendError(conn, "WRONG_PHASE", `Not accepting guesses (phase: ${game.state.phase}).`);
      return;
    }
    if (typeof angle !== "number" || !Number.isFinite(angle)) {
      this.sendError(conn, "BAD_REQUEST", "Guess angle must be a number.");
      return;
    }
    const clamped = Math.max(0, Math.min(180, angle));

    const member = this.findMemberByConnection(conn.id);
    if (!member) {
      this.sendError(conn, "BAD_REQUEST", "Join first.");
      return;
    }
    const playerIdx = game.playerIdByIndex.indexOf(member.playerId);
    if (playerIdx < 0) {
      this.sendError(conn, "BAD_REQUEST", "Not a seated player.");
      return;
    }

    const isAllGuess =
      game.state.gameMode === "individual" &&
      game.state.roundFlow === "all-guess" &&
      game.state.playerNames.length >= 3;

    if (isAllGuess) {
      // Parallel collection. Anyone except the cluer.
      if (playerIdx === game.state.activeSideIndex) {
        this.sendError(conn, "NOT_YOUR_TURN", "Cluer doesn't guess.");
        return;
      }
      game.pendingGuesses.set(member.playerId, clamped);

      if (this.tryFlushAllGuesses()) return;

      // Broadcast partial progress so other clients see who submitted.
      this.broadcastState();
      return;
    }

    // Single-guess: must be the currentGuesser.
    if (game.state.currentGuesserIndex !== playerIdx) {
      this.sendError(conn, "NOT_YOUR_TURN", "Not your turn to guess.");
      return;
    }
    game.state = gameReducer(game.state, { type: "SUBMIT_GUESS", guessAngle: clamped });
    this.scheduleDeadlineForCurrentPhase();
    this.broadcastState();
  }

  private handleSkipCard(conn: Party.Connection) {
    const game = this.requireGame(conn);
    if (!game) return;
    if (game.state.phase !== "clue") {
      this.sendError(conn, "WRONG_PHASE", "Can only skip during clue phase.");
      return;
    }
    if (!this.isCallerCluer(conn)) {
      this.sendError(conn, "NOT_YOUR_TURN", "Only the cluer can skip.");
      return;
    }
    const before = game.state.targetAngle;
    game.state = gameReducer(game.state, { type: "SKIP_ROUND" });
    if (game.state.targetAngle !== before) {
      // Skip succeeded (had skips remaining) — re-send target + reset timer.
      this.sendPrivateTargetToCluer();
      this.scheduleDeadlineForCurrentPhase();
    }
    this.broadcastState();
  }

  private handleReadyNextRound(conn: Party.Connection) {
    const game = this.requireGame(conn);
    if (!game) return;
    if (game.state.phase !== "result") {
      this.sendError(conn, "WRONG_PHASE", "Can only advance from result phase.");
      return;
    }
    const member = this.findMemberByConnection(conn.id);
    if (!member) return;

    // New rule: only the player who'll be the NEXT cluer can advance. The
    // others (guessers next round) don't need to confirm anything. When
    // nextCluer can't be predicted (single-guess + N>=3 selection case),
    // fall back to the old "any seated player advances" semantic.
    const nextCluerId = this.computeNextCluerId();
    if (nextCluerId) {
      if (member.playerId !== nextCluerId) {
        // Silently ignore — UI hides the button for non-next-cluers anyway.
        return;
      }
    } else {
      game.readyForNext.add(member.playerId);
      const seatedConnected = game.playerIdByIndex.filter((id) => {
        const m = this.members.get(id);
        return m?.connected;
      });
      const allReady = seatedConnected.every((id) => game.readyForNext.has(id));
      if (!allReady) {
        this.broadcastState();
        return;
      }
    }

    game.readyForNext.clear();
    game.clueText = undefined;

    // Capture the pre-rolled roles (set when we entered result phase) before
    // they get cleared by the phase transition. Single-guess + N>=3 uses them
    // so the cluer we announced to clients is the cluer they actually get.
    const preCluer = game.prerolledCluer;
    const preGuesser = game.prerolledGuesser;

    game.state = gameReducer(game.state, { type: "NEXT_ROUND" });

    // If the reducer parked us in selection (single-guess + N>=3), use the
    // pre-rolled pair if we have it; otherwise fall back to a fresh roll.
    if (game.state.phase === "selection") {
      const cluer = preCluer ?? rollRoles(game.state.playCounts).cluer;
      const guesser = preGuesser ?? rollRoles(game.state.playCounts).guesser;
      game.state = gameReducer(game.state, { type: "ROLL_ROLES", cluer, guesser });
    }

    // We consumed (or didn't need) the pre-roll — clear so the next result
    // phase rolls fresh.
    game.prerolledCluer = null;
    game.prerolledGuesser = null;

    this.sendPrivateTargetToCluer();
    this.scheduleDeadlineForCurrentPhase();
    this.broadcastState();
  }

  // ---------- Helpers ----------

  private requireGame(conn: Party.Connection): ActiveGame | null {
    if (!this.game) {
      this.sendError(conn, "NOT_IN_GAME", "No game in progress.");
      return null;
    }
    return this.game;
  }

  private findMemberByConnection(connectionId: string): RoomMember | undefined {
    for (const m of this.members.values()) {
      if (m.connectionId === connectionId) return m;
    }
    return undefined;
  }

  private isCluer(playerId: string): boolean {
    if (!this.game) return false;
    return this.game.playerIdByIndex[this.game.state.activeSideIndex] === playerId;
  }

  private isCallerCluer(conn: Party.Connection): boolean {
    const member = this.findMemberByConnection(conn.id);
    return !!member && this.isCluer(member.playerId);
  }

  private sendPrivateTargetToCluer() {
    if (!this.game) return;
    const cluerId = this.game.playerIdByIndex[this.game.state.activeSideIndex];
    const cluerMember = this.members.get(cluerId);
    if (!cluerMember) return;
    for (const conn of this.room.getConnections()) {
      if (conn.id === cluerMember.connectionId) {
        conn.send(
          this.encodeServerMessage({
            type: "PRIVATE_TARGET",
            angle: this.game.state.targetAngle,
          }),
        );
        return;
      }
    }
  }

  private buildPublicRoundState(): PublicRoundState | undefined {
    if (!this.game) return undefined;
    const s = this.game.state;

    const cluerId = this.game.playerIdByIndex[s.activeSideIndex] ?? "";
    const submittedFromPending = [...this.game.pendingGuesses.keys()];
    // In sequential single-guess we never accumulate, but the reducer's
    // `roundGuesses` tracks the running total. Translate indices → ids.
    const submittedFromReducer = s.roundGuesses
      .map((g) => this.game!.playerIdByIndex[g.playerIndex])
      .filter((id): id is string => !!id);
    const submittedGuessIds = Array.from(
      new Set([...submittedFromPending, ...submittedFromReducer]),
    );

    const expectedGuessIds = (s.phase === "guess" || s.phase === "pass")
      ? s.guessQueue
        .map((i) => this.game!.playerIdByIndex[i])
        .filter((id): id is string => !!id && !this.game!.pendingGuesses.has(id))
      : [];

    const revealed = s.phase === "result" || s.phase === "gameover";
    const guesses: PublicRoundGuess[] | undefined = revealed
      ? s.roundGuesses.map((g) => ({
        playerId: this.game!.playerIdByIndex[g.playerIndex] ?? "",
        angle: g.angle,
        score: g.score,
      }))
      : undefined;

    const lastRecord = revealed ? s.roundHistory[s.roundHistory.length - 1] : undefined;

    const cluerSkipsRemaining = s.phase === "clue"
      ? s.skipsRemaining[s.activeSideIndex] ?? 0
      : undefined;

    return {
      cluerId,
      spectrum: s.currentSpectrum,
      clueText: this.game.clueText,
      clueSubmitted: s.phase !== "clue" && s.phase !== "selection",
      submittedGuessIds,
      expectedGuessIds,
      guesses,
      targetAngle: revealed ? s.targetAngle : undefined,
      cluerBonus: lastRecord?.cluerBonus,
      cluerSkipsRemaining,
      deadlineAt: this.game.deadlineAt ?? undefined,
    };
  }

  // Lock in who the next cluer will be the moment we enter result phase, so
  // the result UI can address them specifically. For single-guess + N>=3 the
  // reducer normally rolls roles via ROLL_ROLES inside the selection phase
  // *after* NEXT_ROUND; we pre-roll here using the same `rollRoles` helper so
  // clients can show "{name} é o próximo a dar a dica" right away. The
  // pre-rolled pair is consumed when handleReadyNextRound fires NEXT_ROUND.
  private prerollNextRoundIfNeeded() {
    if (!this.game) return;
    const s = this.game.state;
    if (s.phase !== "result") {
      this.game.prerolledCluer = null;
      this.game.prerolledGuesser = null;
      return;
    }
    // Already rolled for this result phase? leave it.
    if (this.game.prerolledCluer != null) return;
    const n = s.playerNames.length;
    if (s.gameMode === "teams" || s.roundFlow !== "single-guess" || n < 3) {
      return; // other cases have deterministic next cluer
    }
    const { cluer, guesser } = rollRoles(s.playCounts);
    this.game.prerolledCluer = cluer;
    this.game.prerolledGuesser = guesser;
  }

  // Who will be the cluer in the next round? Only meaningful in `result`
  // phase. Uses deterministic rotation (2 players, all-guess N>=3) or the
  // pre-rolled roles (single-guess N>=3).
  private computeNextCluerId(): string | undefined {
    if (!this.game || this.game.state.phase !== "result") return undefined;
    const s = this.game.state;
    const n = s.playerNames.length;
    if (s.gameMode === "teams") return undefined; // teams not supported online
    if (n === 2) {
      const next = s.activeSideIndex === 0 ? 1 : 0;
      return this.game.playerIdByIndex[next];
    }
    if (s.roundFlow === "all-guess") {
      const next = (s.activeSideIndex + 1) % n;
      return this.game.playerIdByIndex[next];
    }
    // single-guess + N>=3 → use the pre-roll.
    if (this.game.prerolledCluer != null) {
      return this.game.playerIdByIndex[this.game.prerolledCluer];
    }
    return undefined;
  }

  private computeWinnerId(): string | undefined {
    if (!this.game || this.game.state.phase !== "gameover") return undefined;
    const s = this.game.state;
    const n = s.playerNames.length;
    const diffs = computeAvgDiffs(s.roundHistory, n);
    let bestIdx = -1;
    let bestScore = -1;
    let bestDiff = Number.POSITIVE_INFINITY;
    for (let i = 0; i < n; i++) {
      const score = s.scores[i] ?? 0;
      const d = diffs[i] ?? Number.POSITIVE_INFINITY;
      if (score > bestScore || (score === bestScore && d < bestDiff)) {
        bestScore = score;
        bestDiff = d;
        bestIdx = i;
      }
    }
    return bestIdx >= 0 ? this.game.playerIdByIndex[bestIdx] : undefined;
  }

  private publicState(): PublicRoomState {
    // Lazy: lock in the next cluer the first time we render a result-phase
    // broadcast. Idempotent.
    this.prerollNextRoundIfNeeded();
    const players: PublicPlayer[] = [];
    for (const m of this.members.values()) {
      const idx = this.game?.playerIdByIndex.indexOf(m.playerId) ?? -1;
      const score = idx >= 0 ? (this.game!.state.scores[idx] ?? 0) : 0;
      players.push({
        id: m.playerId,
        name: m.name,
        color: m.color,
        connected: m.connected,
        isHost: m.isHost,
        isReady: m.isReady,
        score,
      });
    }

    let phase: PublicRoomState["phase"] = "lobby";
    if (this.game) {
      const p = this.game.state.phase;
      // Collapse 'pass' (server-internal accumulation step) into 'guess' for clients.
      // Collapse 'selection' (single-device SlotReel UX) into 'clue' — we auto-rolled.
      phase = p === "pass" ? "guess" : p === "selection" ? "clue" : p;
    }

    return {
      code: this.room.id.toUpperCase(),
      hostId: this.hostPlayerId ?? "",
      phase,
      voiceMode: this.game?.voiceMode ?? false,
      players,
      config: undefined,
      round: this.buildPublicRoundState(),
      roundNumber: this.game?.state.round ?? 0,
      history: this.game?.state.roundHistory ?? [],
      winnerId: this.computeWinnerId(),
      gameStartingAt: this.gameStartingAt ?? undefined,
      nextCluerId: this.computeNextCluerId(),
      roomConfig: this.roomConfig ?? undefined,
    };
  }

  private broadcastState() {
    this.room.broadcast(
      this.encodeServerMessage({ type: "STATE", state: this.publicState() }),
    );
  }

  private sendError(
    conn: Party.Connection,
    code: ServerErrorCode,
    message: string,
  ) {
    conn.send(this.encodeServerMessage({ type: "ERROR", code, message }));
  }

  private encodeServerMessage(msg: ServerMessage): string {
    return JSON.stringify(msg);
  }
}

SintoniaRoom satisfies Party.Worker;
