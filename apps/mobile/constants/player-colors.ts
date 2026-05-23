// Re-export from @sintonia/game-core. Player color palette + helpers
// live in the shared package so reducer logic (which runs on both
// client and server) doesn't reach into mobile theme.

export {
  assignDefaultColors,
  assignTeamDefaultColors,
  MAX_PLAYERS,
  MIN_PLAYERS,
  PLAYER_COLOR_PALETTE,
  reconcileColors,
} from "@sintonia/game-core";
