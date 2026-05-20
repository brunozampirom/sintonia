import { calculateScore } from '@/constants/game';
import { reconcileColors } from '@/constants/player-colors';
import { GameColors } from '@/constants/theme';
import type { GameMode, GameSettings, RoundFlow, ScoringTarget } from '@/contexts/settings-context';
import spectrumsEN from '@/data/spectrums.en.json';
import spectrumsES from '@/data/spectrums.es.json';
import spectrumsPtBR from '@/data/spectrums.pt-BR.json';
import type { SupportedLanguage } from '@/i18n';
import { useCallback, useEffect, useMemo, useReducer } from 'react';

export type GamePhase = 'selection' | 'clue' | 'pass' | 'guess' | 'result' | 'gameover';

const FALLBACK_TEAM_COLORS: [string, string] = [GameColors.sky, GameColors.primary];

export interface RoundGuess {
  playerIndex: number; // 0..N-1 in individual, 0|1 in teams
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

interface Spectrum {
  left: string;
  right: string;
}

interface GameState {
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

type GameAction =
  | { type: 'START_GAME'; settings: GameSettings }
  | { type: 'SUBMIT_CLUE' }
  | { type: 'SUBMIT_GUESS'; guessAngle: number }
  | { type: 'DISMISS_PASS' }
  | { type: 'NEXT_ROUND' }
  | { type: 'SKIP_ROUND' }
  | { type: 'ROLL_ROLES'; cluer: number; guesser: number }
  | { type: 'SET_LOCALE_POOL'; pool: Spectrum[] };

function getBaseSpectrums(language: SupportedLanguage): Spectrum[] {
  if (language === 'en') return spectrumsEN;
  if (language === 'es') return spectrumsES;
  return spectrumsPtBR;
}

function buildSpectrumPool(baseSpectrums: Spectrum[], customSpectrums: Spectrum[]): Spectrum[] {
  return [...baseSpectrums, ...customSpectrums];
}

function pickRandomSpectrum(pool: Spectrum[], usedIndices: number[]): { spectrum: Spectrum; index: number } {
  let available = pool
    .map((s, i) => ({ s, i }))
    .filter(({ i }) => !usedIndices.includes(i));

  if (available.length === 0) {
    available = pool.map((s, i) => ({ s, i }));
  }

  const pick = available[Math.floor(Math.random() * available.length)];
  return { spectrum: pick.s, index: pick.i };
}

function randomTargetAngle(): number {
  return Math.floor(Math.random() * 150) + 15;
}

function numSides(state: Pick<GameState, 'gameMode' | 'playerNames'>): number {
  return state.gameMode === 'individual' ? state.playerNames.length : 2;
}

function usesSelection(state: Pick<GameState, 'gameMode' | 'roundFlow' | 'playerNames'>): boolean {
  return (
    state.gameMode === 'individual' &&
    state.roundFlow === 'single-guess' &&
    state.playerNames.length >= 3
  );
}

function buildAllGuessQueue(activeIndex: number, n: number): number[] {
  return Array.from({ length: n - 1 }, (_, i) => (activeIndex + 1 + i) % n);
}

export function weightedPick(weights: number[], excludeIndex?: number): number {
  const indices = weights
    .map((_, i) => i)
    .filter((i) => i !== excludeIndex);
  const total = indices.reduce((s, i) => s + weights[i], 0);
  if (total <= 0) return indices[Math.floor(Math.random() * indices.length)];
  let r = Math.random() * total;
  for (const i of indices) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return indices[indices.length - 1];
}

export function rollRoles(playCounts: number[]): { cluer: number; guesser: number } {
  const weights = playCounts.map((c) => 1 / (1 + c));
  const cluer = weightedPick(weights);
  const guesser = weightedPick(weights, cluer);
  return { cluer, guesser };
}

/**
 * Compute per-side average guess diff (in degrees) across the history.
 * Used as a tiebreaker for tied scores at game over — lower is better.
 * Sides that never guessed return +Infinity (always lose tiebreaks).
 */
export function computeAvgDiffs(roundHistory: RoundRecord[], numSides: number): number[] {
  const sums = Array<number>(numSides).fill(0);
  const counts = Array<number>(numSides).fill(0);
  for (const r of roundHistory) {
    if (Array.isArray(r.guesses) && r.guesses.length > 0) {
      for (const g of r.guesses) {
        if (g.playerIndex < numSides) {
          sums[g.playerIndex] += Math.abs(r.targetAngle - g.angle);
          counts[g.playerIndex]++;
        }
      }
    } else if (r.guesser < numSides) {
      sums[r.guesser] += Math.abs(r.targetAngle - r.guessAngle);
      counts[r.guesser]++;
    }
  }
  return sums.map((s, i) => (counts[i] > 0 ? s / counts[i] : Number.POSITIVE_INFINITY));
}

function createInitialState(settings: GameSettings, baseSpectrums: Spectrum[]): GameState {
  const pool = buildSpectrumPool(baseSpectrums, settings.customSpectrums);
  const { spectrum, index } = pickRandomSpectrum(pool, []);
  const skips = settings.skipsPerPlayer;
  const isIndividual = settings.gameMode === 'individual';
  const playerNames = isIndividual ? [...settings.playerNames] : [];
  const numPlayers = isIndividual ? playerNames.length : 2;
  const playerColors = isIndividual ? reconcileColors(numPlayers, settings.playerColors) : [];

  const useSelection = isIndividual && settings.roundFlow === 'single-guess' && numPlayers >= 3;

  let initialQueue: number[];
  if (!isIndividual) {
    // Teams collaborative: cluer + guesser are from the same team.
    // The guess "side" is the same as the active team.
    initialQueue = [0];
  } else if (numPlayers === 2) {
    initialQueue = [1];
  } else if (settings.roundFlow === 'all-guess') {
    initialQueue = buildAllGuessQueue(0, numPlayers);
  } else {
    initialQueue = []; // single-guess + N>=3 — ROLL_ROLES decides
  }

  return {
    gameMode: settings.gameMode,
    scoringTarget: settings.scoringTarget,
    roundFlow: settings.roundFlow,
    phase: useSelection ? 'selection' : 'clue',
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

function getClueGiverName(state: GameState): string {
  if (state.gameMode === 'individual') {
    return state.playerNames[state.activeSideIndex] ?? '';
  }
  const teamIdx = state.activeSideIndex;
  const playerIdx = state.clueGiverIndices[teamIdx];
  return state.teamPlayers[teamIdx]?.[playerIdx] ?? '';
}

function getGuesserName(state: GameState): string {
  if (state.gameMode === 'individual') {
    if (state.currentGuesserIndex == null) return '';
    return state.playerNames[state.currentGuesserIndex] ?? '';
  }
  // Teams collaborative: cluer and guesser are from the same team.
  // Guesser is the player AFTER the cluer in the team rotation.
  const teamIdx = state.activeSideIndex;
  const teamPlayers = state.teamPlayers[teamIdx] ?? [];
  if (teamPlayers.length < 2) return '';
  const cluerIdx = state.clueGiverIndices[teamIdx] ?? 0;
  const guesserIdx = (cluerIdx + 1) % teamPlayers.length;
  return teamPlayers[guesserIdx] ?? '';
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return createInitialState(action.settings, state.allSpectrums);

    case 'SUBMIT_CLUE':
      return { ...state, phase: 'guess' };

    case 'SUBMIT_GUESS': {
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
          phase: 'pass',
          lastRoundScore: score,
        };
      }

      // Apply final scoring for the round
      const newScores = [...state.scores];
      const isAllGuess =
        state.gameMode === 'individual' &&
        state.roundFlow === 'all-guess' &&
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
          state.scoringTarget === 'cluer' ? state.activeSideIndex : onlyGuess.playerIndex;
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
        guesserName: state.gameMode === 'teams' ? getGuesserName(state) : undefined,
        teamName: state.gameMode === 'teams' ? state.teamNames[state.activeSideIndex] : undefined,
        guesses: newRoundGuesses.length > 1 ? newRoundGuesses : undefined,
        cluerBonus: isAllGuess ? cluerBonus : undefined,
      };

      return {
        ...state,
        phase: isGameOver ? 'gameover' : 'result',
        guessAngle: action.guessAngle,
        scores: newScores,
        lastRoundScore: isAllGuess
          ? Math.max(0, ...newRoundGuesses.map((g) => g.score))
          : firstGuess.score,
        roundGuesses: newRoundGuesses,
        roundHistory: [...state.roundHistory, record],
      };
    }

    case 'DISMISS_PASS':
      return { ...state, phase: 'guess' };

    case 'NEXT_ROUND': {
      const { spectrum, index } = pickRandomSpectrum(state.allSpectrums, state.usedIndices);
      const isIndividual = state.gameMode === 'individual';
      const n = numSides(state);
      const newClueGiverIndices: [number, number] = [...state.clueGiverIndices];

      let nextActive = state.activeSideIndex;
      let newQueue: number[] = [];

      if (!isIndividual) {
        nextActive = state.activeSideIndex === 0 ? 1 : 0;
        // Teams collaborative: guesser is same team (its in-team next player).
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
      } else if (state.roundFlow === 'all-guess') {
        nextActive = (state.activeSideIndex + 1) % n;
        newQueue = buildAllGuessQueue(nextActive, n);
      } else {
        // single-guess + N>=3 — selection phase will fill via ROLL_ROLES
        newQueue = [];
      }

      const goesToSelection = usesSelection(state) && n >= 3;

      return {
        ...state,
        phase: goesToSelection ? 'selection' : 'clue',
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

    case 'ROLL_ROLES': {
      const newPlayCounts = [...state.playCounts];
      if (action.cluer < newPlayCounts.length) newPlayCounts[action.cluer]++;
      if (action.guesser < newPlayCounts.length) newPlayCounts[action.guesser]++;
      return {
        ...state,
        phase: 'clue',
        activeSideIndex: action.cluer,
        guessQueue: [action.guesser],
        currentGuesserIndex: action.guesser,
        playCounts: newPlayCounts,
      };
    }

    case 'SKIP_ROUND': {
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

    case 'SET_LOCALE_POOL':
      return {
        ...state,
        allSpectrums: action.pool,
        usedIndices: [],
      };

    default:
      return state;
  }
}

export function useGameState(settings: GameSettings, language: SupportedLanguage) {
  const baseSpectrums = useMemo(() => getBaseSpectrums(language), [language]);
  const [state, dispatch] = useReducer(gameReducer, settings, (initial) =>
    createInitialState(initial, baseSpectrums),
  );

  useEffect(() => {
    const nextPool = buildSpectrumPool(baseSpectrums, settings.customSpectrums);
    dispatch({ type: 'SET_LOCALE_POOL', pool: nextPool });
  }, [baseSpectrums, settings.customSpectrums]);

  const startGame = useCallback(() => dispatch({ type: 'START_GAME', settings }), [settings]);
  const submitClue = useCallback(() => dispatch({ type: 'SUBMIT_CLUE' }), []);
  const submitGuess = useCallback(
    (guessAngle: number) => dispatch({ type: 'SUBMIT_GUESS', guessAngle }),
    [],
  );
  const dismissPass = useCallback(() => dispatch({ type: 'DISMISS_PASS' }), []);
  const nextRound = useCallback(() => dispatch({ type: 'NEXT_ROUND' }), []);
  const skipRound = useCallback(() => dispatch({ type: 'SKIP_ROUND' }), []);
  const rollRolesAction = useCallback(
    (cluer: number, guesser: number) => dispatch({ type: 'ROLL_ROLES', cluer, guesser }),
    [],
  );

  const clueGiverName = getClueGiverName(state);
  const guesserName = getGuesserName(state);

  const sideNames: string[] =
    state.gameMode === 'teams' ? [...state.teamNames] : state.playerNames;

  const sideColors: string[] =
    state.gameMode === 'teams' ? [...state.teamColors] : state.playerColors;

  const isMultiGuess =
    state.gameMode === 'individual' &&
    state.roundFlow === 'all-guess' &&
    state.playerNames.length >= 3;

  const guessSequence = isMultiGuess
    ? {
        current: state.roundGuesses.length + 1,
        total: state.playerNames.length - 1,
      }
    : null;

  const avgDiffs = useMemo(
    () => computeAvgDiffs(state.roundHistory, state.scores.length),
    [state.roundHistory, state.scores.length],
  );

  return {
    ...state,
    clueGiverName,
    clueGiverLabel: clueGiverName,
    guesserLabel: guesserName,
    sideNames,
    sideColors,
    isMultiGuess,
    guessSequence,
    avgDiffs,
    startGame,
    submitClue,
    submitGuess,
    dismissPass,
    nextRound,
    skipRound,
    rollRoles: rollRolesAction,
  };
}
