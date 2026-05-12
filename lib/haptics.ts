import { Presets, Settings } from 'react-native-pulsar';

// In dev builds, also play the audio preview of each pattern so haptics are
// "audible" in the iOS Simulator / Android Emulator where the real motor
// isn't available. Physical devices will still vibrate normally; the audio
// is a development aid only.
if (__DEV__) {
  try {
    Settings.enableSound(true);
  } catch {}
}

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
  // Propagate to Pulsar's native flags so anything that bypasses our `play()`
  // wrapper (pattern composer, realtime composer, etc.) is also muted.
  // In simulator/dev the audible feedback comes from the AudioSimulator which
  // has its own `playSound` flag — without disabling it here, audio preview
  // would still play even with haptics "off".
  try {
    Settings.enableHaptics(value);
    if (__DEV__) Settings.enableSound(value);
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
