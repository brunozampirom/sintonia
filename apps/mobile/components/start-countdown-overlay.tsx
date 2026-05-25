// Server-synced pre-game countdown. Every client renders the same 3-2-1
// derived from `startsAt` (epoch ms) — kept in step with the server's own
// timer. Subtle animation: small scale + fade, no bouncy spring.
// Haptic per tick. Solid dark scrim (no native blur) so it works even on
// dev clients that haven't been rebuilt with expo-blur.

import { GameColors } from '@/constants/theme';
import { haptics } from '@/lib/haptics';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface StartCountdownOverlayProps {
  /** Epoch ms when the game actually starts. `undefined` hides the overlay. */
  startsAt: number | undefined;
}

export function StartCountdownOverlay({ startsAt }: StartCountdownOverlayProps) {
  const [now, setNow] = useState(() => Date.now());
  const lastTickRef = useRef<string | null>(null);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  // ALL hooks run on every render — early-return below the hook block keeps
  // React's hook order stable when `startsAt` flips between defined/undefined.
  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Tick — drives both the visible number and the haptic.
  useEffect(() => {
    if (!startsAt) {
      lastTickRef.current = null;
      return;
    }
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [startsAt]);

  if (!startsAt) return null;

  const remainingMs = Math.max(0, startsAt - now);
  // Seconds-to-go, rounded UP: 2001ms → "3", 1500ms → "2", 0 → "JÁ!".
  const secs = Math.ceil(remainingMs / 1000);
  const label = secs <= 0 ? 'JÁ!' : String(Math.min(secs, 3));

  // Trigger a soft tick when the label flips.
  if (lastTickRef.current !== label) {
    lastTickRef.current = label;
    // First mount fires too — fine, gives a starting cue.
    if (label === 'JÁ!') haptics.play();
    else haptics.selection();
    // Subtle scale-in: 0.94 → 1, fade-in fast.
    scale.value = 0.94;
    opacity.value = 0.5;
    scale.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(1, { duration: 220 });
  }

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(220)}
      style={styles.overlay}
      pointerEvents="auto"
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.scrim]} pointerEvents="none" />
      <Animated.Text style={[styles.number, numberStyle]}>{label}</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  scrim: {
    // Solid dark wash — opaque enough to hide the room behind without needing
    // a native BlurView. Cool tint to keep the mood "ready, set, go" rather
    // than warm/orange (which can read as warning).
    backgroundColor: 'rgba(10, 20, 38, 0.92)',
  },
  number: {
    fontSize: 120,
    fontWeight: '800',
    color: GameColors.mint,
    letterSpacing: -1,
    textShadowColor: GameColors.mint + '88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
});
