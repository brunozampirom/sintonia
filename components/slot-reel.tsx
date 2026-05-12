import { GameColors } from '@/constants/theme';
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { usePatternComposer, type Pattern } from 'react-native-pulsar';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const ROW_HEIGHT = 64;
const CYCLES = 6;
// Minimum spacing between consecutive haptic ticks (ms). Tick density does NOT
// dominate `parsePattern` cost — that's driven by the buffer length (pattern
// total duration × 22050Hz sample rate). Tweaking this affects feel more than
// FPS. Production builds disable the audio simulator entirely so this is
// effectively free outside DEV.
const MIN_TICK_INTERVAL_MS = 55;

interface SlotReelProps {
  names: string[];
  colors: string[];
  targetIndex: number;
  label: string;
  duration: number;
  onSettled?: () => void;
  /** When true, this reel emits the decelerating spin pattern (heavy pre-baked
   *  haptic with audio synthesis). Pass it only to one reel — typically the one
   *  that finishes last — so the two reels don't fight for the audio engine. */
  emitHaptics?: boolean;
  /** Optional peer-reel settle time (ms) to bake into the spin pattern as an
   *  extra "tuck" so both reels' name reveals get a haptic without the audio
   *  engine race that happens when two separate play() calls overlap. */
  peerSettleTime?: number;
}

export function SlotReel({
  names,
  colors,
  targetIndex,
  label,
  duration,
  onSettled,
  emitHaptics = false,
  peerSettleTime,
}: SlotReelProps) {
  const translateY = useSharedValue(0);
  const settled = useSharedValue(0);

  const n = names.length;
  const safeTarget = Math.max(0, Math.min(n - 1, targetIndex));

  const rows = React.useMemo(() => {
    const result: { name: string; color: string; key: string }[] = [];
    for (let cycle = 0; cycle <= CYCLES; cycle++) {
      for (let i = 0; i < n; i++) {
        result.push({
          name: names[i],
          color: colors[i] ?? GameColors.textMuted,
          key: `${cycle}-${i}`,
        });
      }
    }
    return result;
  }, [names, colors, n]);

  // Pattern parsing is deferred until AFTER the first paint of the reels.
  // Pulsar's AudioSimulator synthesizes the full audio buffer (22050Hz × pattern
  // duration) inside a synchronous TurboModule call — for a ~3s spin that's
  // ~500ms of JS-thread freeze. By gating spinPattern behind this flag we
  // ensure the reels render at row 0 and the cubic-out animation actually
  // starts before the heavy parse blocks JS. (Production builds disable the
  // audio simulator entirely so this gate is a dev-only ergonomic.)
  const [patternReady, setPatternReady] = useState(false);
  useEffect(() => {
    if (!emitHaptics) return;
    const id = setTimeout(() => setPatternReady(true), 0);
    return () => clearTimeout(id);
  }, [emitHaptics]);

  // Build a discrete haptic pattern that mirrors the reel's cubic-out
  // deceleration: ticks start dense + bright + strong and gradually space
  // out + dim + lower-pitch as the reel slows, until just before the name
  // locks in (reelLand fires on settle). Audio preview works in simulator
  // because PatternComposer also feeds the AudioSimulator.
  const spinPattern = useMemo<Pattern | null>(() => {
    if (!emitHaptics || !patternReady) return null;
    const totalRows = CYCLES * n + safeTarget;
    const points: { time: number; amplitude: number; frequency: number }[] = [];
    let lastTime = -Infinity;
    for (let r = 1; r <= totalRows; r++) {
      const t = 1 - Math.pow(1 - r / totalRows, 1 / 3); // inverse of out-cubic
      const timeMs = t * (duration - 0);
      if (timeMs - lastTime < MIN_TICK_INTERVAL_MS) continue;
      const progress = r / totalRows;
      points.push({
        time: timeMs,                       // Pulsar expects ms
        amplitude: 1.0 - progress * 0.65,   // 1.0 → 0.35
        frequency: 0.85 - progress * 0.5,   // 0.85 → 0.35
      });
      lastTime = timeMs;
    }

    // Bake a "tuck" burst into the same pattern at each reel's settle time —
    // shape mirrors LatchPreset's discrete points. Doing it inside the spin
    // pattern (one play() call, one buffer) avoids the AudioSimulator race
    // that occurs when two separate latches overlap.
    const tuck = (t: number) => {
      points.push({ time: t, amplitude: 0.75, frequency: 0.68 });
      points.push({ time: t + 100, amplitude: 0.4, frequency: 0.45 });
    };
    if (peerSettleTime !== undefined) tuck(peerSettleTime);
    tuck(duration); // this reel's own settle

    // Pattern points must be sorted by time
    points.sort((a, b) => a.time - b.time);

    return {
      discretePattern: points,
      continuousPattern: { amplitude: [], frequency: [] },
    };
  }, [emitHaptics, patternReady, n, safeTarget, duration, peerSettleTime]);

  const composer = usePatternComposer(spinPattern ?? undefined);

  // useLayoutEffect (commit phase) — runs BEFORE the passive useEffect that
  // parsePattern lives in, so withTiming kicks off the cubic-out animation on
  // the UI thread first. Even when JS subsequently blocks for the parse, the
  // reels keep animating because Reanimated runs entirely on the UI thread.
  useLayoutEffect(() => {
    translateY.value = 0;
    settled.value = 0;
    const final = -(CYCLES * n + safeTarget) * ROW_HEIGHT;
    translateY.value = withTiming(
      final,
      { duration, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          settled.value = 1;
          // The "tuck" haptic for both reels is baked into the spin pattern
          // (see spinPattern useMemo) so a single play() call covers everything
          // without the AudioSimulator race that splits play()s would cause.
          if (onSettled) runOnJS(onSettled)();
        }
      },
    );
    // we intentionally re-run animation only when target/duration changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeTarget, duration]);

  // Fire the spin haptic as soon as the composer finishes parsing. The parse
  // happens in usePatternComposer's own useEffect (passive phase, ~500ms in
  // dev); this effect runs immediately after, by which point isParsed() is
  // true. We depend on composer.play (stable useCallback) rather than the
  // composer object literal (fresh on every render) to avoid re-firing play().
  useEffect(() => {
    if (!emitHaptics || !spinPattern) return;
    if (!composer.isParsed()) return;
    composer.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emitHaptics, spinPattern, composer.play]);

  const stripStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const highlightStyle = useAnimatedStyle(() => ({
    borderColor: settled.value > 0 ? (colors[safeTarget] ?? GameColors.accent) : GameColors.dialBorder,
    transform: [{ scale: settled.value > 0 ? 1.04 : 1 }],
  }));

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={[styles.window, highlightStyle]}>
        <Animated.View style={[styles.strip, stripStyle]}>
          {rows.map((row) => (
            <View key={row.key} style={styles.row}>
              <View style={[styles.colorBar, { backgroundColor: row.color }]} />
              <Text style={styles.name} numberOfLines={1}>{row.name}</Text>
            </View>
          ))}
        </Animated.View>
        <View pointerEvents="none" style={styles.topFade} />
        <View pointerEvents="none" style={styles.bottomFade} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: GameColors.textMuted,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  window: {
    width: '100%',
    height: ROW_HEIGHT,
    overflow: 'hidden',
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: GameColors.surface,
    position: 'relative',
  },
  strip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  row: {
    height: ROW_HEIGHT,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorBar: {
    width: 6,
    alignSelf: 'stretch',
    borderRadius: 3,
  },
  name: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: GameColors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: GameColors.surface,
    opacity: 0.5,
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: GameColors.surface,
    opacity: 0.5,
  },
});
