// All game-relevant types shared between the mobile client and the
// multiplayer server. The reducer in src/reducer.ts operates on these.

export interface Spectrum {
  left: string;
  right: string;
}

export type GameMode = "individual" | "teams";
export type ScoringTarget = "cluer" | "guesser";
export type RoundFlow = "all-guess" | "single-guess";

export interface TeamConfig {
  name: string;
  players: string[];
  color?: string;
}

/**
 * Settings required by the game reducer. Apps can extend this with
 * UI-only concerns (language, haptics, timers) without affecting the
 * reducer — structural typing means a richer object still satisfies
 * this contract.
 */
export interface GameInitConfig {
  gameMode: GameMode;
  scoringTarget: ScoringTarget;
  roundFlow: RoundFlow;
  winningScore: number;
  skipsPerPlayer: number; // -1 = unlimited
  playerNames: string[];
  playerColors: string[];
  customSpectrums: Spectrum[];
  teams: [TeamConfig, TeamConfig];
  /** Seconds for the cluer to submit clue; -1 = unlimited. Online-only. */
  clueTimeLimit?: number;
  /** Seconds for guess submission; -1 = unlimited. Online-only. */
  guessTimeLimit?: number;
}

export type GamePhase =
  | "selection"
  | "clue"
  | "pass"
  | "guess"
  | "result"
  | "gameover";

export interface RoundGuess {
  playerIndex: number;
  angle: number;
  score: number;
}

export interface RoundRecord {
  round: number;
  spectrum: Spectrum;
  targetAngle: number;
  guessAngle: number;
  score: number;
  clueGiver: number;
  guesser: number;
  clueGiverName?: string;
  guesserName?: string;
  teamName?: string;
  guesses?: RoundGuess[];
  cluerBonus?: number;
}

export interface GameState {
  gameMode: GameMode;
  scoringTarget: ScoringTarget;
  roundFlow: RoundFlow;
  phase: GamePhase;
  round: number;
  activeSideIndex: number;
  scores: number[];
  playerNames: string[];
  playerColors: string[];
  playCounts: number[];
  targetAngle: number;
  guessAngle: number;
  currentSpectrum: Spectrum;
  usedIndices: number[];
  lastRoundScore: number;
  skipsRemaining: number[];
  winningScore: number;
  allSpectrums: Spectrum[];
  roundHistory: RoundRecord[];
  guessQueue: number[];
  currentGuesserIndex: number | null;
  roundGuesses: RoundGuess[];
  // Teams mode
  teamNames: [string, string];
  teamColors: [string, string];
  teamPlayers: [string[], string[]];
  clueGiverIndices: [number, number];
}

export type GameAction =
  | { type: "START_GAME"; settings: GameInitConfig }
  | { type: "SUBMIT_CLUE" }
  | { type: "SUBMIT_GUESS"; guessAngle: number }
  | { type: "DISMISS_PASS" }
  | { type: "NEXT_ROUND" }
  | { type: "SKIP_ROUND" }
  | { type: "ROLL_ROLES"; cluer: number; guesser: number }
  | { type: "SET_LOCALE_POOL"; pool: Spectrum[] };
