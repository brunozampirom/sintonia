// Re-export from @sintonia/game-core. All scoring + dial constants
// live in the shared package so client and multiplayer server compute
// scores identically. Mobile code continues importing from
// '@/constants/game' for backwards compatibility.

export {
  calculateScore,
  DIAL_MAX_ANGLE,
  DIAL_MIN_ANGLE,
  SCORE_ZONES,
  WINNING_SCORE,
} from "@sintonia/game-core";
