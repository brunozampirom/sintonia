// Brand color palette used for player chips, team accents, and the
// default player colors. Mirrors the relevant subset of
// apps/mobile/constants/theme.ts GameColors. Kept here so the game
// reducer (which lives in this package) doesn't reach into a mobile
// module for colors.

export const PLAYER_COLOR_PALETTE: string[] = [
  "#D3773F", // primary (rust orange)
  "#74B9FF", // sky
  "#AAC573", // secondary (olive)
  "#A29BFE", // lavender
  "#FF6B6B", // coral
  "#55EFC4", // mint
  "#F8E71C", // yellow
  "#E84393", // pink
];

export const FALLBACK_TEAM_COLORS: readonly [string, string] = [
  "#74B9FF", // sky — team 1
  "#D3773F", // primary — team 2
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
