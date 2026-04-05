import { calculateScore } from '@/constants/game';
import type { GameMode, GameSettings, ScoringTarget } from '@/contexts/settings-context';
import spectrums from '@/data/spectrums.json';
import { useCallback, useReducer } from 'react';

export type GamePhase = 'clue' | 'guess' | 'result' | 'gameover';

export interface RoundRecord {
  round: number;
  spectrum: Spectrum;
  targetAngle: number;
  guessAngle: number;
  score: number;
  clueGiver: 1 | 2;
  guesser: 1 | 2;
  // Teams mode extra info
  clueGiverName?: string;
  teamName?: string;
}

interface Spectrum {
  left: string;
  right: string;
}

interface GameState {
  gameMode: GameMode;
  scoringTarget: ScoringTarget;
  phase: GamePhase;
  round: number;
  activeClueGiver: 1 | 2; // which side (player or team index+1)
  scores: [number, number];
  targetAngle: number;
  guessAngle: number;
  currentSpectrum: Spectrum;
  usedIndices: number[];
  lastRoundScore: number;
  skipsRemaining: [number, number];
  winningScore: number;
  allSpectrums: Spectrum[];
  roundHistory: RoundRecord[];
  // Individual mode
  playerNames: [string, string];
  // Teams mode
  teamNames: [string, string];
  teamPlayers: [string[], string[]];
  clueGiverIndices: [number, number]; // current clue giver index within each team
}

type GameAction =
  | { type: 'START_GAME'; settings: GameSettings }
  | { type: 'SUBMIT_CLUE' }
  | { type: 'SUBMIT_GUESS'; guessAngle: number }
  | { type: 'NEXT_ROUND' }
  | { type: 'SKIP_ROUND' };

function buildSpectrumPool(customSpectrums: Spectrum[]): Spectrum[] {
  return [...spectrums, ...customSpectrums];
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

function createInitialState(settings: GameSettings): GameState {
  const pool = buildSpectrumPool(settings.customSpectrums);
  const { spectrum, index } = pickRandomSpectrum(pool, []);
  const skips = settings.skipsPerPlayer;
  return {
    gameMode: settings.gameMode,
    scoringTarget: settings.scoringTarget,
    phase: 'clue',
    round: 1,
    activeClueGiver: 1,
    scores: [0, 0],
    targetAngle: randomTargetAngle(),
    guessAngle: 90,
    currentSpectrum: spectrum,
    usedIndices: [index],
    lastRoundScore: 0,
    skipsRemaining: [skips, skips],
    winningScore: settings.winningScore,
    allSpectrums: pool,
    roundHistory: [],
    playerNames: settings.playerNames,
    teamNames: [settings.teams[0].name, settings.teams[1].name],
    teamPlayers: [settings.teams[0].players, settings.teams[1].players],
    clueGiverIndices: [0, 0],
  };
}

/** Get the name of the current clue giver */
function getClueGiverName(state: GameState): string {
  if (state.gameMode === 'individual') {
    return state.playerNames[state.activeClueGiver - 1];
  }
  const teamIdx = state.activeClueGiver - 1;
  const playerIdx = state.clueGiverIndices[teamIdx];
  return state.teamPlayers[teamIdx][playerIdx] ?? '';
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return createInitialState(action.settings);

    case 'SUBMIT_CLUE':
      return { ...state, phase: 'guess' };

    case 'SUBMIT_GUESS': {
      const score = calculateScore(state.targetAngle, action.guessAngle);
      // Points go to the configured scoring target
      const scorerIdx = state.scoringTarget === 'cluer'
        ? state.activeClueGiver - 1
        : (state.activeClueGiver === 1 ? 1 : 0);
      const newScores: [number, number] = [...state.scores];
      newScores[scorerIdx] += score;

      const isGameOver =
        newScores[0] >= state.winningScore || newScores[1] >= state.winningScore;

      const record: RoundRecord = {
        round: state.round,
        spectrum: state.currentSpectrum,
        targetAngle: state.targetAngle,
        guessAngle: action.guessAngle,
        score,
        clueGiver: state.activeClueGiver,
        guesser: (state.activeClueGiver === 1 ? 2 : 1) as 1 | 2,
        clueGiverName: getClueGiverName(state),
        teamName: state.gameMode === 'teams'
          ? state.teamNames[state.activeClueGiver - 1]
          : undefined,
      };

      return {
        ...state,
        phase: isGameOver ? 'gameover' : 'result',
        guessAngle: action.guessAngle,
        scores: newScores,
        lastRoundScore: score,
        roundHistory: [...state.roundHistory, record],
      };
    }

    case 'NEXT_ROUND': {
      const { spectrum, index } = pickRandomSpectrum(state.allSpectrums, state.usedIndices);
      const nextClueGiver: 1 | 2 = state.activeClueGiver === 1 ? 2 : 1;

      // Rotate clue giver within team
      const newClueGiverIndices: [number, number] = [...state.clueGiverIndices];
      if (state.gameMode === 'teams') {
        const prevTeamIdx = state.activeClueGiver - 1;
        const teamSize = state.teamPlayers[prevTeamIdx].length;
        if (teamSize > 0) {
          newClueGiverIndices[prevTeamIdx] =
            (state.clueGiverIndices[prevTeamIdx] + 1) % teamSize;
        }
      }

      return {
        ...state,
        phase: 'clue',
        round: state.round + 1,
        activeClueGiver: nextClueGiver,
        targetAngle: randomTargetAngle(),
        guessAngle: 90,
        currentSpectrum: spectrum,
        usedIndices: [...state.usedIndices, index],
        lastRoundScore: 0,
        clueGiverIndices: newClueGiverIndices,
      };
    }

    case 'SKIP_ROUND': {
      const playerIdx = state.activeClueGiver === 1 ? 0 : 1;
      const remaining = state.skipsRemaining[playerIdx];
      if (remaining === 0) return state;

      const newSkips: [number, number] = [...state.skipsRemaining];
      if (remaining > 0) newSkips[playerIdx] = remaining - 1;

      const { spectrum, index } = pickRandomSpectrum(state.allSpectrums, state.usedIndices);
      return {
        ...state,
        targetAngle: randomTargetAngle(),
        currentSpectrum: spectrum,
        usedIndices: [...state.usedIndices, index],
        skipsRemaining: newSkips,
      };
    }

    default:
      return state;
  }
}

export function useGameState(settings: GameSettings) {
  const [state, dispatch] = useReducer(gameReducer, settings, createInitialState);

  const startGame = useCallback(() => dispatch({ type: 'START_GAME', settings }), [settings]);
  const submitClue = useCallback(() => dispatch({ type: 'SUBMIT_CLUE' }), []);
  const submitGuess = useCallback(
    (guessAngle: number) => dispatch({ type: 'SUBMIT_GUESS', guessAngle }),
    [],
  );
  const nextRound = useCallback(() => dispatch({ type: 'NEXT_ROUND' }), []);
  const skipRound = useCallback(() => dispatch({ type: 'SKIP_ROUND' }), []);

  const guesser = state.activeClueGiver === 1 ? 2 : 1;
  const clueGiverName = getClueGiverName(state);

  // In teams mode, the "guesser" label is the other team
  const guesserLabel = state.gameMode === 'teams'
    ? state.teamNames[guesser - 1]
    : state.playerNames[guesser - 1];

  const clueGiverLabel = state.gameMode === 'teams'
    ? clueGiverName
    : state.playerNames[state.activeClueGiver - 1];

  // Side labels for scoreboard
  const sideNames: [string, string] = state.gameMode === 'teams'
    ? state.teamNames
    : state.playerNames;

  return {
    ...state,
    guesser,
    clueGiverName,
    clueGiverLabel,
    guesserLabel,
    sideNames,
    startGame,
    submitClue,
    submitGuess,
    nextRound,
    skipRound,
  };
}
