import { GameColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface CountdownPillProps {
  remaining: number;
  total: number;
}

const WARNING_THRESHOLD = 5;

export function CountdownPill({ remaining, total }: CountdownPillProps) {
  const warning = remaining <= WARNING_THRESHOLD && remaining > 0;
  const color = warning ? GameColors.coral : GameColors.accent;
  const progress = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const scale = useSharedValue(1);

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

  return (
    <Animated.View style={[styles.pill, { borderColor: color }, animatedStyle]}>
      <View
        pointerEvents="none"
        style={[
          styles.progressFill,
          { width: `${progress * 100}%`, backgroundColor: `${color}33` },
        ]}
      />
      <Ionicons name="time-outline" size={14} color={color} />
      <Text style={[styles.text, { color }]}>{Math.ceil(remaining)}s</Text>
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
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  text: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
});
