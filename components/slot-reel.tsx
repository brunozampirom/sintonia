import { GameColors } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const ROW_HEIGHT = 64;
const CYCLES = 6;

interface SlotReelProps {
  names: string[];
  colors: string[];
  targetIndex: number;
  label: string;
  duration: number;
  onSettled?: () => void;
}

function settleHaptic() {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function SlotReel({ names, colors, targetIndex, label, duration, onSettled }: SlotReelProps) {
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

  useEffect(() => {
    translateY.value = 0;
    settled.value = 0;
    const final = -(CYCLES * n + safeTarget) * ROW_HEIGHT;
    translateY.value = withTiming(
      final,
      { duration, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          settled.value = 1;
          runOnJS(settleHaptic)();
          if (onSettled) runOnJS(onSettled)();
        }
      },
    );
    // we intentionally re-run animation only when target/duration changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeTarget, duration]);

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
