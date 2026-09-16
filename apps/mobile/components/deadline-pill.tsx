// Server-driven countdown pill. The server tells us a `deadlineAt` (epoch ms)
// for the current phase; this component ticks locally to render the remaining
// seconds. Same haptic/visual language as the offline `CountdownPill`:
//   - amber while idle, coral pulsing in the final 5s
//   - "drone" haptic when entering the warning band
//   - "tick" haptic on every second change inside the warning band
// Server enforces expiration — we just stop counting at 0 and wait for STATE.

import { GameColors } from '@/constants/theme';
import { haptics } from '@/lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface DeadlinePillProps {
  deadlineAt: number | undefined;
  /** Reset haptic/animation when key changes (new round/phase). */
  resetKey?: string | number;
}

const WARNING_THRESHOLD = 5;

export function DeadlinePill({ deadlineAt, resetKey }: DeadlinePillProps) {
  const [now, setNow] = useState(() => Date.now());
  const lastSecondRef = useRef<number | null>(null);
  const scale = useSharedValue(1);

  // Local tick. 200ms is enough for a smooth seconds counter.
  useEffect(() => {
    if (!deadlineAt) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [deadlineAt]);

  // Reset the per-second haptic memory when the phase changes.
  useEffect(() => {
    lastSecondRef.current = null;
  }, [resetKey]);

  const remainingMs = deadlineAt ? Math.max(0, deadlineAt - now) : 0;
  const remainingSec = remainingMs / 1000;
  const sec = Math.ceil(remainingSec);
  const warning = deadlineAt != null && sec <= WARNING_THRESHOLD && sec > 0;

  // Haptic — drone enters at 5s boundary, tick on every second change in band.
  useEffect(() => {
    if (!deadlineAt) {
      lastSecondRef.current = null;
      return;
    }
    const prev = lastSecondRef.current;
    if (prev === null) {
      lastSecondRef.current = sec;
      return;
    }
    if (sec !== prev) {
      if (prev > WARNING_THRESHOLD && sec === WARNING_THRESHOLD) haptics.timerDrone();
      if (sec > 0 && sec <= WARNING_THRESHOLD) haptics.timerTick();
      lastSecondRef.current = sec;
    }
  }, [deadlineAt, sec]);

  // Pulse during warning.
  useEffect(() => {
    if (warning) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 320, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 320, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(scale);
      scale.value = withTiming(1, { duration: 160 });
    }
    return () => {
      cancelAnimation(scale);
    };
  }, [warning, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!deadlineAt) return null;

  const color = warning ? GameColors.coral : GameColors.accent;

  return (
    <Animated.View style={[styles.pill, { borderColor: color }, animatedStyle]}>
      <Ionicons name="time-outline" size={14} color={color} />
      <Text style={[styles.text, { color }]}>{sec}s</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 2,
    backgroundColor: GameColors.surface,
    alignSelf: 'center',
    overflow: 'hidden',
    minWidth: 72,
    justifyContent: 'center',
  },
  text: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
});
