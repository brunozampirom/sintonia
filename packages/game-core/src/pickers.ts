// Pure helpers for round setup and tiebreaking. Lifted from
// apps/mobile/hooks/use-game-state.ts. Both the mobile reducer and
// the multiplayer server import these so behavior matches.

import type { RoundRecord, Spectrum } from "./types";

export function pickRandomSpectrum(
  pool: Spectrum[],
  usedIndices: number[],
): { spectrum: Spectrum; index: number } {
  let available = pool
    .map((s, i) => ({ s, i }))
    .filter(({ i }) => !usedIndices.includes(i));

  if (available.length === 0) {
    available = pool.map((s, i) => ({ s, i }));
  }

  const pick = available[Math.floor(Math.random() * available.length)];
  return { spectrum: pick.s, index: pick.i };
}

export function randomTargetAngle(): number {
  // Avoids the 0 and 180 extremes — clue givers need wiggle room.
  return Math.floor(Math.random() * 150) + 15;
}

export function buildSpectrumPool(
  baseSpectrums: Spectrum[],
  customSpectrums: Spectrum[],
): Spectrum[] {
  return [...baseSpectrums, ...customSpectrums];
}

export function buildAllGuessQueue(activeIndex: number, n: number): number[] {
  return Array.from({ length: n - 1 }, (_, i) => (activeIndex + 1 + i) % n);
}

/**
 * Weighted random pick. Indices with lower weights show up less often.
 * Used to bias role rolls (clue giver / guesser) toward players who
 * haven't taken those roles much yet.
 */
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
 * Per-side average guess diff (in degrees) across the history.
 * Tiebreaker for tied scores at game over — lower is better. Sides
 * that never guessed return +Infinity (always lose tiebreaks).
 */
export function computeAvgDiffs(
  roundHistory: RoundRecord[],
  numSides: number,
): number[] {
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
