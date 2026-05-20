import { AnimatedScore } from '@/components/animated-score';
import { GameColors } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Layout } from 'react-native-reanimated';

interface PlayerChipProps {
  name: string;
  color: string;
  score: number;
  active?: boolean;
  compact?: boolean;
}

export function PlayerChip({ name, color, score, active, compact }: PlayerChipProps) {
  return (
    <Animated.View
      layout={Layout.springify()}
      style={[
        styles.pill,
        compact && styles.pillCompact,
        active && { borderColor: color, backgroundColor: `${color}1F` },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }, compact && styles.dotCompact]} />
      <Text
        style={[styles.name, compact && styles.nameCompact, active && styles.nameActive]}
        numberOfLines={1}
      >
        {name}
      </Text>
      <AnimatedScore
        value={score}
        style={[styles.score, compact && styles.scoreCompact, active && { color }]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: GameColors.surface,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pillCompact: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    gap: 5,
    borderRadius: 999,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotCompact: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  name: {
    color: GameColors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    maxWidth: 100,
  },
  nameCompact: {
    fontSize: 9,
    maxWidth: 70,
  },
  nameActive: {
    color: GameColors.text,
  },
  score: {
    color: GameColors.text,
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 2,
  },
  scoreCompact: {
    fontSize: 12,
  },
});
