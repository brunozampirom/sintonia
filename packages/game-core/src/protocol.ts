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

export interface PublicRoundState {
  cluerId: string;
  spectrum: Spectrum;
  /** Clue text — only set when voiceMode=false and cluer has typed and submitted. */
  clueText?: string;
  /** Whether cluer has signaled the clue was given (voiceMode=true). */
  clueSubmitted: boolean;
  /** Map of playerId → submitted guess angle (private until reveal). */
  submittedGuessIds: string[];
  /** All players' guesses, only present in `result` phase after reveal. */
  guesses?: { playerId: string; angle: number; score: number }[];
  /** Server timestamp ms when the current phase deadline expires, if any. */
  deadlineAt?: number;
}

/**
 * Public state broadcast to every client in the room. The cluer's
 * `targetAngle` is sent SEPARATELY via PRIVATE_TARGET — never appears
 * in here, otherwise guesser clients could read it from devtools.
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
}

// ---------- Client → Server ----------

export type ClientMessage =
  | { type: "JOIN"; code: RoomCode; playerId: string; name: string; color: string }
  | { type: "LEAVE" }
  | { type: "READY"; isReady: boolean }
  | { type: "START_GAME"; settings: GameInitConfig; voiceMode: boolean }
  | { type: "SUBMIT_CLUE_TEXT"; text: string }
  | { type: "CLUE_SAID" }
  | { type: "SUBMIT_GUESS"; angle: number }
  | { type: "SKIP_CARD" }
  | { type: "READY_NEXT_ROUND" };

// ---------- Server → Client ----------

export type ServerErrorCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_FULL"
  | "INVALID_CODE"
  | "NOT_HOST"
  | "ALREADY_STARTED"
  | "BAD_REQUEST"
  | "INTERNAL";

export type ServerMessage =
  | { type: "STATE"; state: PublicRoomState }
  | { type: "PRIVATE_TARGET"; angle: number }
  | { type: "ERROR"; code: ServerErrorCode; message: string };
