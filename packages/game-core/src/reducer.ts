// Pure state machine for a Sintonia game session. Same code runs on
// the mobile client (single-device mode) and on the multiplayer
// server (online mode — server owns truth, clients render the state
// it broadcasts). Lifted from apps/mobile/hooks/use-game-state.ts
// lines 169-432; only the imports changed.

import { FALLBACK_TEAM_COLORS, reconcileColors } from "./colors";
import {
  buildAllGuessQueue,
  buildSpectrumPool,
  pickRandomSpectrum,
  randomTargetAngle,
} from "./pickers";
import { calculateScore } from "./scoring";
import type {
  GameAction,
  GameInitConfig,
  GameState,
  RoundGuess,
  RoundRecord,
  Spectrum,
} from "./types";

function numSides(state: Pick<GameState, "gameMode" | "playerNames">): number {
  return state.gameMode === "individual" ? state.playerNames.length : 2;
}

function usesSelection(
  state: Pick<GameState, "gameMode" | "roundFlow" | "playerNames">,
): boolean {
  return (
    state.gameMode === "individual" &&
    state.roundFlow === "single-guess" &&
    state.playerNames.length >= 3
  );
}

export function createInitialState(
  settings: GameInitConfig,
  baseSpectrums: Spectrum[],
): GameState {
  const pool = buildSpectrumPool(baseSpectrums, settings.customSpectrums);
  const { spectrum, index } = pickRandomSpectrum(pool, []);
  const skips = settings.skipsPerPlayer;
  const isIndividual = settings.gameMode === "individual";
  const playerNames = isIndividual ? [...settings.playerNames] : [];
  const numPlayers = isIndividual ? playerNames.length : 2;
  const playerColors = isIndividual ? reconcileColors(numPlayers, settings.playerColors) : [];

  const useSelection =
    isIndividual && settings.roundFlow === "single-guess" && numPlayers >= 3;

  let initialQueue: number[];
  if (!isIndividual) {
    initialQueue = [0];
  } else if (numPlayers === 2) {
    initialQueue = [1];
  } else if (settings.roundFlow === "all-guess") {
    initialQueue = buildAllGuessQueue(0, numPlayers);
  } else {
    initialQueue = []; // single-guess + N>=3 — ROLL_ROLES decides
  }

  return {
    gameMode: settings.gameMode,
    scoringTarget: settings.scoringTarget,
    roundFlow: settings.roundFlow,
    phase: useSelection ? "selection" : "clue",
    round: 1,
    activeSideIndex: 0,
    scores: Array(numPlayers).fill(0),
    playerNames,
    playerColors,
    playCounts: Array(numPlayers).fill(0),
    targetAngle: randomTargetAngle(),
    guessAngle: 90,
    currentSpectrum: spectrum,
    usedIndices: [index],
    lastRoundScore: 0,
    skipsRemaining: Array(numPlayers).fill(skips),
    winningScore: settings.winningScore,
    allSpectrums: pool,
    roundHistory: [],
    guessQueue: initialQueue,
    currentGuesserIndex: initialQueue[0] ?? null,
    roundGuesses: [],
    teamNames: [settings.teams[0].name, settings.teams[1].name],
    teamColors: [
      settings.teams[0].color ?? FALLBACK_TEAM_COLORS[0],
      settings.teams[1].color ?? FALLBACK_TEAM_COLORS[1],
    ],
    teamPlayers: [settings.teams[0].players, settings.teams[1].players],
    clueGiverIndices: [0, 0],
  };
}

export function getClueGiverName(state: GameState): string {
  if (state.gameMode === "individual") {
    return state.playerNames[state.activeSideIndex] ?? "";
  }
  const teamIdx = state.activeSideIndex;
  const playerIdx = state.clueGiverIndices[teamIdx];
  return state.teamPlayers[teamIdx]?.[playerIdx] ?? "";
}

export function getGuesserName(state: GameState): string {
  if (state.gameMode === "individual") {
    if (state.currentGuesserIndex == null) return "";
    return state.playerNames[state.currentGuesserIndex] ?? "";
  }
  // Teams collaborative: cluer and guesser are from the same team.
  // Guesser is the player AFTER the cluer in the team rotation.
  const teamIdx = state.activeSideIndex;
  const teamPlayers = state.teamPlayers[teamIdx] ?? [];
  if (teamPlayers.length < 2) return "";
  const cluerIdx = state.clueGiverIndices[teamIdx] ?? 0;
  const guesserIdx = (cluerIdx + 1) % teamPlayers.length;
  return teamPlayers[guesserIdx] ?? "";
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME":
      return createInitialState(action.settings, state.allSpectrums);

    case "SUBMIT_CLUE":
      return { ...state, phase: "guess" };

    case "SUBMIT_GUESS": {
      const guesserIdx = state.currentGuesserIndex ?? 0;
      const score = calculateScore(state.targetAngle, action.guessAngle);
      const newRoundGuesses: RoundGuess[] = [
        ...state.roundGuesses,
        { playerIndex: guesserIdx, angle: action.guessAngle, score },
      ];

      const moreGuessers = state.guessQueue.length > 1;

      if (moreGuessers) {
        const newQueue = state.guessQueue.slice(1);
        return {
          ...state,
          roundGuesses: newRoundGuesses,
          guessQueue: newQueue,
          currentGuesserIndex: newQueue[0] ?? null,
          guessAngle: 90,
          phase: "pass",
          lastRoundScore: score,
        };
      }

      // Apply final scoring for the round
      const newScores = [...state.scores];
      const isAllGuess =
        state.gameMode === "individual" &&
        state.roundFlow === "all-guess" &&
        state.playerNames.length >= 3;

      let cluerBonus = 0;
      if (isAllGuess) {
        for (const g of newRoundGuesses) {
          if (g.playerIndex < newScores.length) {
            newScores[g.playerIndex] += g.score;
          }
          if (g.score > 0) cluerBonus++;
        }
        if (state.activeSideIndex < newScores.length) {
          newScores[state.activeSideIndex] += cluerBonus;
        }
      } else {
        const onlyGuess = newRoundGuesses[0];
        const scorerIdx =
          state.scoringTarget === "cluer" ? state.activeSideIndex : onlyGuess.playerIndex;
        if (scorerIdx < newScores.length) {
          newScores[scorerIdx] += onlyGuess.score;
        }
      }

      const isGameOver = newScores.some((s) => s >= state.winningScore);

      const firstGuess = newRoundGuesses[0];
      const record: RoundRecord = {
        round: state.round,
        spectrum: state.currentSpectrum,
        targetAngle: state.targetAngle,
        guessAngle: firstGuess.angle,
        score: isAllGuess ? cluerBonus : firstGuess.score,
        clueGiver: state.activeSideIndex,
        guesser: firstGuess.playerIndex,
        clueGiverName: getClueGiverName(state),
        guesserName: state.gameMode === "teams" ? getGuesserName(state) : undefined,
        teamName: state.gameMode === "teams" ? state.teamNames[state.activeSideIndex] : undefined,
        guesses: newRoundGuesses.length > 1 ? newRoundGuesses : undefined,
        cluerBonus: isAllGuess ? cluerBonus : undefined,
      };

      return {
        ...state,
        phase: isGameOver ? "gameover" : "result",
        guessAngle: action.guessAngle,
        scores: newScores,
        lastRoundScore: isAllGuess
          ? Math.max(0, ...newRoundGuesses.map((g) => g.score))
          : firstGuess.score,
        roundGuesses: newRoundGuesses,
        roundHistory: [...state.roundHistory, record],
      };
    }

    case "DISMISS_PASS":
      return { ...state, phase: "guess" };

    case "NEXT_ROUND": {
      const { spectrum, index } = pickRandomSpectrum(state.allSpectrums, state.usedIndices);
      const isIndividual = state.gameMode === "individual";
      const n = numSides(state);
      const newClueGiverIndices: [number, number] = [...state.clueGiverIndices];

      let nextActive = state.activeSideIndex;
      let newQueue: number[] = [];

      if (!isIndividual) {
        nextActive = state.activeSideIndex === 0 ? 1 : 0;
        newQueue = [nextActive];
        const prevTeamIdx = state.activeSideIndex;
        const teamSize = state.teamPlayers[prevTeamIdx].length;
        if (teamSize > 0) {
          newClueGiverIndices[prevTeamIdx] =
            (state.clueGiverIndices[prevTeamIdx] + 1) % teamSize;
        }
      } else if (n === 2) {
        nextActive = state.activeSideIndex === 0 ? 1 : 0;
        newQueue = [nextActive === 0 ? 1 : 0];
      } else if (state.roundFlow === "all-guess") {
        nextActive = (state.activeSideIndex + 1) % n;
        newQueue = buildAllGuessQueue(nextActive, n);
      } else {
        newQueue = []; // single-guess + N>=3 — selection phase will fill via ROLL_ROLES
      }

      const goesToSelection = usesSelection(state) && n >= 3;

      return {
        ...state,
        phase: goesToSelection ? "selection" : "clue",
        round: state.round + 1,
        activeSideIndex: nextActive,
        targetAngle: randomTargetAngle(),
        guessAngle: 90,
        currentSpectrum: spectrum,
        usedIndices: [...state.usedIndices, index],
        lastRoundScore: 0,
        clueGiverIndices: newClueGiverIndices,
        guessQueue: newQueue,
        currentGuesserIndex: newQueue[0] ?? null,
        roundGuesses: [],
      };
    }

    case "ROLL_ROLES": {
      const newPlayCounts = [...state.playCounts];
      if (action.cluer < newPlayCounts.length) newPlayCounts[action.cluer]++;
      if (action.guesser < newPlayCounts.length) newPlayCounts[action.guesser]++;
      return {
        ...state,
        phase: "clue",
        activeSideIndex: action.cluer,
        guessQueue: [action.guesser],
        currentGuesserIndex: action.guesser,
        playCounts: newPlayCounts,
      };
    }

    case "SKIP_ROUND": {
      const cluerIdx = state.activeSideIndex;
      const remaining = state.skipsRemaining[cluerIdx] ?? 0;
      if (remaining === 0) return state;

      const newSkips = [...state.skipsRemaining];
      if (remaining > 0) newSkips[cluerIdx] = remaining - 1;

      const { spectrum, index } = pickRandomSpectrum(state.allSpectrums, state.usedIndices);
      return {
        ...state,
        targetAngle: randomTargetAngle(),
        currentSpectrum: spectrum,
        usedIndices: [...state.usedIndices, index],
        skipsRemaining: newSkips,
      };
    }

    case "SET_LOCALE_POOL":
      return {
        ...state,
        allSpectrums: action.pool,
        usedIndices: [],
      };

    default:
      return state;
  }
}
