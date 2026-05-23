// Scoring logic — degree thresholds map distance from target to points.
// Lifted from apps/mobile/constants/game.ts. Pure functions, runs the
// same on client and server.

export const SCORE_ZONES = {
  zone4: { threshold: 12, points: 4 }, // bullseye
  zone3: { threshold: 24, points: 3 }, // close
  zone2: { threshold: 36, points: 2 }, // near
} as const;

export const DIAL_MIN_ANGLE = 0;
export const DIAL_MAX_ANGLE = 180;

export const WINNING_SCORE = 10;

export function calculateScore(targetAngle: number, guessAngle: number): number {
  const diff = Math.abs(targetAngle - guessAngle);
  if (diff <= SCORE_ZONES.zone4.threshold) return SCORE_ZONES.zone4.points;
  if (diff <= SCORE_ZONES.zone3.threshold) return SCORE_ZONES.zone3.points;
  if (diff <= SCORE_ZONES.zone2.threshold) return SCORE_ZONES.zone2.points;
  return 0;
}
