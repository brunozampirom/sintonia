export const WINNING_SCORE = 10;

// Percentage thresholds from target angle (out of 180 degrees)
// Zone 4 (bullseye): within ~7% of target = ~12.6 degrees
// Zone 3: within ~14% = ~25.2 degrees
// Zone 2: within ~21% = ~37.8 degrees
export const SCORE_ZONES = {
  zone4: { threshold: 12, points: 4 },
  zone3: { threshold: 24, points: 3 },
  zone2: { threshold: 36, points: 2 },
};

export const DIAL_MIN_ANGLE = 0;
export const DIAL_MAX_ANGLE = 180;

export function calculateScore(targetAngle: number, guessAngle: number): number {
  const diff = Math.abs(targetAngle - guessAngle);
  if (diff <= SCORE_ZONES.zone4.threshold) return SCORE_ZONES.zone4.points;
  if (diff <= SCORE_ZONES.zone3.threshold) return SCORE_ZONES.zone3.points;
  if (diff <= SCORE_ZONES.zone2.threshold) return SCORE_ZONES.zone2.points;
  return 0;
}
