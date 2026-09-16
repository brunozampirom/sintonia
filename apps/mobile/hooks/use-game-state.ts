import type { GameSettings } from '@/contexts/settings-context';
import spectrumsEN from '@/data/spectrums.en.json';
import spectrumsES from '@/data/spectrums.es.json';
import spectrumsPtBR from '@/data/spectrums.pt-BR.json';
import type { SupportedLanguage } from '@/i18n';
import {
  buildSpectrumPool,
  computeAvgDiffs,
  createInitialState,
  gameReducer,
  getClueGiverName,
  getGuesserName,
  rollRoles,
  weightedPick,
  type GameAction,
  type GamePhase,
  type GameState,
  type RoundGuess,
  type RoundRecord,
  type Spectrum,
} from '@sintonia/game-core';
import { useCallback, useEffect, useMemo, useReducer } from 'react';

// Re-export reducer types so existing mobile imports keep working.
export type { GameAction, GamePhase, GameState, RoundGuess, RoundRecord };
export { rollRoles, weightedPick, computeAvgDiffs };

function getBaseSpectrums(language: SupportedLanguage): Spectrum[] {
  if (language === 'en') return spectrumsEN;
  if (language === 'es') return spectrumsES;
  return spectrumsPtBR;
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
