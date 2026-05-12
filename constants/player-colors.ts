import { GameColors } from './theme';

export const PLAYER_COLOR_PALETTE: string[] = [
  GameColors.primary,
  GameColors.sky,
  GameColors.secondary,
  GameColors.lavender,
  GameColors.coral,
  GameColors.mint,
  GameColors.yellow,
  GameColors.pink,
];

export const MAX_PLAYERS = 8;
export const MIN_PLAYERS = 2;

export function assignDefaultColors(playerCount: number, offset: number = 0): string[] {
  const count = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, playerCount));
  return Array.from(
    { length: count },
    (_, i) => PLAYER_COLOR_PALETTE[(offset + i) % PLAYER_COLOR_PALETTE.length],
  );
}

/**
 * Teams default colors: team 0 starts at palette offset 0, team 1 at offset 4.
 * Keeps a fresh 4-color band per team so colors don't repeat across teams
 * for the typical case (≤4 players per team).
 */
export function assignTeamDefaultColors(teamIdx: number, playerCount: number): string[] {
  return assignDefaultColors(playerCount, teamIdx * 4);
}

export function reconcileColors(playerCount: number, existing?: string[], offset: number = 0): string[] {
  const defaults = assignDefaultColors(playerCount, offset);
  if (!existing) return defaults;
  const result: string[] = [];
  for (let i = 0; i < playerCount; i++) {
    const color = existing[i];
    result.push(color && PLAYER_COLOR_PALETTE.includes(color) ? color : defaults[i]);
  }
  return result;
}
