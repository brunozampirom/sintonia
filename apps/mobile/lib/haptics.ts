import { Platform } from 'react-native';
import { Presets, Settings } from 'react-native-pulsar';

// Android haptic motors (especially budget ones) produce coarse, "buzzy"
// vibrations that feel inferior to iOS' Taptic Engine. We route feedback
// through Pulsar's bundled audio previews on Android instead, while iOS
// keeps the native haptic patterns.
const useSoundInsteadOfHaptics = Platform.OS === 'android';

try {
  Settings.enableSound(useSoundInsteadOfHaptics);
  Settings.enableHaptics(!useSoundInsteadOfHaptics);
} catch {}

/**
 * Centralized haptic service backed by react-native-pulsar.
 *
 * Each game event maps to the preset that best fits its emotional/physical
 * character (e.g. `submitGuess` = a heavy "pound", `perfect` = a short
 * "triumph", `dialTick` = a light knob-like "peck"). When two events share a
 * family of feeling we still pick presets that differ in scale or duration so
 * each moment feels distinct in context.
 *
 * Enabled state is owned by the user via Settings (`hapticsEnabled`). A bridge
 * component watches that setting and pushes it here via `setHapticsEnabled`,
 * so call sites can keep using the static `haptics.x()` API without threading
 * settings through props.
 */
let enabled = true;

export function setHapticsEnabled(value: boolean) {
  enabled = value;
  try {
    if (useSoundInsteadOfHaptics) {
      Settings.enableSound(value);
    } else {
      Settings.enableHaptics(value);
    }
  } catch {}
}

export function isHapticsEnabled(): boolean {
  return enabled;
}

function play(fn: () => void) {
  if (!enabled) return;
  try {
    fn();
  } catch {
    // swallow: haptics are best-effort, never block the UI
  }
}

export const haptics = {
  // === UI primitives ===
  buttonPress: () => play(Presets.strike),
  selection: () => play(Presets.ping),
  colorPick: () => play(Presets.peck),
  addRemovePlayer: () => play(Presets.snap),
  iAmHere: () => play(Presets.chirp),

  // === Game flow ===
  passPhone: () => play(Presets.chime),     // quick single attention chime
  submitGuess: () => play(Presets.pound),
  submitClue: () => play(Presets.nudge),    // single gentle "pass it forward"
  nextRound: () => play(Presets.ping),      // same quick tic as new game / play
  skip: () => play(Presets.flick),

  // === Header / navigation ===
  back: () => play(Presets.bassDrop),
  play: () => play(Presets.ping),           // same feel as a selection — a clear "go!"

  // === Dial drag (real-time tick) ===
  dialTick: () => play(Presets.peck),

  // === Round outcomes ===
  perfect: () => play(Presets.triumph),
  close: () => play(Presets.flourish),
  near: () => play(Presets.swell),
  miss: () => play(Presets.wobble),

  // === Timer ===
  timerDrone: () => play(Presets.drone),    // continuous hum in the final 5s
  timerTick: () => play(Presets.thud),      // discrete "tun" per second
  timerExpire: () => play(Presets.knell),

  // === Slot reel ===
  // (spin ticks come from useRealtimeComposer.playDiscrete with custom
  // amplitude/frequency that decay with the reel's deceleration — see SlotReel)
  reelLand: () => play(Presets.latch),      // single "tuck" — name locks in, border lights up

  // === End game ===
  gameOver: () => play(Presets.fanfare),
  podiumGold: () => play(Presets.applause),
  podiumSilver: () => play(Presets.herald),
  podiumBronze: () => play(Presets.pip),
};
