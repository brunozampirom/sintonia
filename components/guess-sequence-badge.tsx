import { GameColors } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface GuessSequenceBadgeProps {
  current: number;
  total: number;
  color?: string;
}

export function GuessSequenceBadge({ current, total, color = GameColors.accent }: GuessSequenceBadgeProps) {
  return (
    <Animated.View entering={FadeIn} style={[styles.container, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.text}>
        <Text style={[styles.number, { color }]}>{current}</Text>
        <Text style={styles.separator}> / </Text>
        <Text style={styles.total}>{total}</Text>
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: GameColors.surface,
    alignSelf: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  number: {
    fontWeight: '900',
  },
  separator: {
    color: GameColors.textMuted,
  },
  total: {
    color: GameColors.textMuted,
  },
});
