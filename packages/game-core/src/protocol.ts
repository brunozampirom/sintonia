// Wire protocol for the multiplayer WebSocket. Both the mobile client
// and the PartyKit room import these types so the messages can't drift.

import type {
  GameInitConfig,
  GamePhase,
  RoundRecord,
  Spectrum,
} from "./types";

export type RoomCode = string; // 4 chars, A-HJ-NP-Z + 2-9

export interface PublicPlayer {
  id: string; // persistent UUID from the client
  name: string;
  color: string;
  connected: boolean;
  isHost: boolean;
  isReady: boolean;
  score: number;
}

export interface PublicRoundGuess {
  playerId: string;
  angle: number;
  score: number;
}

/**
 * Lightweight settings the host has chosen for this room. Broadcast to every
 * client so guests can see what's coming — read-only from their side. The
 * host can mutate via `UPDATE_ROOM_SETTINGS` messages.
 */
export interface RoomConfig {
  voiceMode: boolean;
  winningScore: number;
  skipsPerPlayer: number;
  clueTimeLimit: number;
  guessTimeLimit: number;
}

export interface PublicRoundState {
  cluerId: string;
  spectrum: Spectrum;
  /** Clue text — only set when voiceMode=false and cluer has typed and submitted. */
  clueText?: string;
  /** Whether cluer has signaled the clue was given (voiceMode=true), or text was submitted (voiceMode=false). */
  clueSubmitted: boolean;
  /** Players who have already submitted their guess this round (parallel all-guess UX). */
  submittedGuessIds: string[];
  /** Player(s) whose turn it is to guess. In single-guess this has 1 id; in parallel all-guess every non-cluer who hasn't submitted yet. */
  expectedGuessIds: string[];
  /** All players' guesses, only present in `result`/`gameover` phase after reveal. */
  guesses?: PublicRoundGuess[];
  /** Final target — only revealed in `result`/`gameover` phase. */
  targetAngle?: number;
  /** Server timestamp ms when the current phase deadline expires, if any. */
  deadlineAt?: number;
  /** All-guess: extra points the cluer earned this round from successful guesses. */
  cluerBonus?: number;
  /** Skips remaining for the current cluer. -1 = unlimited. Only set in clue phase. */
  cluerSkipsRemaining?: number;
}

/**
 * Public state broadcast to every client in the room. The cluer's
 * `targetAngle` is sent SEPARATELY via PRIVATE_TARGET — never appears
 * in here during clue/guess phases. It IS included in `round.targetAngle`
 * once we hit `result`/`gameover` (reveal is fine then).
 */
export interface PublicRoomState {
  code: RoomCode;
  hostId: string;
  phase: "lobby" | GamePhase;
  voiceMode: boolean;
  players: PublicPlayer[];
  config?: GameInitConfig;
  round?: PublicRoundState;
  roundNumber: number;
  history: RoundRecord[];
  /** Game-over only: id of the winning player (highest score, lowest avg diff tiebreaker). */
  winnerId?: string;
  /** Set while we're in the 3-2-1 pre-game countdown. Epoch ms when round 1 starts. */
  gameStartingAt?: number;
  /** Synced from the host so guests can preview the match settings. */
  roomConfig?: RoomConfig;
  /** Result phase only: id of the player who'll be the cluer next round.
   *  Undefined when not yet determinable (e.g. single-guess + N>=3 where
   *  the selection phase will roll roles). */
  nextCluerId?: string;
}

// ---------- Client → Server ----------

export type ClientMessage =
  | {
      type: "JOIN";
      code: RoomCode;
      playerId: string;
      name: string;
      color: string;
      /** "host" = expecting to create this room (becomes host if empty);
       *  "guest" = expecting an EXISTING room (server rejects if empty). */
      mode?: "host" | "guest";
    }
  | { type: "LEAVE" }
  | { type: "READY"; isReady: boolean }
  | {
      type: "START_GAME";
      settings: GameInitConfig;
      voiceMode: boolean;
      /** Localized spectrum pool from the host's app (server has no i18n data). */
      spectrumPool: Spectrum[];
    }
  | { type: "SUBMIT_CLUE_TEXT"; text: string }
  | { type: "CLUE_SAID" }
  | { type: "SUBMIT_GUESS"; angle: number }
  | { type: "SKIP_CARD" }
  | { type: "READY_NEXT_ROUND" }
  /** Host-only — terminates the room for everyone. */
  | { type: "CLOSE_ROOM" }
  /** Host-only — removes a specific player from the room. */
  | { type: "KICK_PLAYER"; targetPlayerId: string }
  /** Host-only, gameover-only — drops the finished game and returns the room
   *  to the lobby so a new match can be configured. */
  | { type: "RETURN_TO_LOBBY" }
  /** Host-only, lobby-only — push the chosen settings so guests see them. */
  | { type: "UPDATE_ROOM_SETTINGS"; config: RoomConfig };

// ---------- Server → Client ----------

export type ServerErrorCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_FULL"
  | "INVALID_CODE"
  | "NOT_HOST"
  | "ALREADY_STARTED"
  | "NOT_IN_GAME"
  | "WRONG_PHASE"
  | "NOT_YOUR_TURN"
  | "BAD_REQUEST"
  | "INTERNAL";

export type ServerMessage =
  | { type: "STATE"; state: PublicRoomState }
  | { type: "PRIVATE_TARGET"; angle: number }
  | { type: "ERROR"; code: ServerErrorCode; message: string }
  /** Broadcast when the host closes the room. Clients should leave to home. */
  | { type: "ROOM_CLOSED"; reason: "host" }
  /** Sent only to the kicked client; close socket on receipt. */
  | { type: "KICKED" };
