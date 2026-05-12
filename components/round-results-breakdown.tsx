import { GameColors } from '@/constants/theme';
import type { RoundGuess } from '@/hooks/use-game-state';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface RoundResultsBreakdownProps {
  guesses: RoundGuess[];
  playerNames: string[];
  playerColors: string[];
  cluerBonus?: number;
  cluerName?: string;
  cluerColor?: string;
  bonusLabel?: string;
}

export function RoundResultsBreakdown({
  guesses,
  playerNames,
  playerColors,
  cluerBonus,
  cluerName,
  cluerColor,
  bonusLabel,
}: RoundResultsBreakdownProps) {
  const sortedGuesses = useMemo(
    () => [...guesses].sort((a, b) => b.score - a.score),
    [guesses],
  );
  return (
    <View style={styles.container}>
      {sortedGuesses.map((g, idx) => {
        const name = playerNames[g.playerIndex] ?? '';
        const color = playerColors[g.playerIndex] ?? GameColors.textMuted;
        return (
          <Animated.View
            key={`${g.playerIndex}-${idx}`}
            entering={FadeInDown.delay(60 * idx).duration(280)}
            style={styles.row}
          >
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={[styles.score, g.score === 0 && styles.scoreZero]}>
              +{g.score}
            </Text>
          </Animated.View>
        );
      })}
      {typeof cluerBonus === 'number' && cluerBonus > 0 && bonusLabel ? (
        <Animated.View
          entering={FadeInDown.delay(60 * guesses.length + 80).duration(320)}
          style={[styles.bonusRow, { borderColor: cluerColor ?? GameColors.accent }]}
        >
          <View style={[styles.dot, { backgroundColor: cluerColor ?? GameColors.accent }]} />
          <Text style={styles.bonusName} numberOfLines={1}>{cluerName ?? ''}</Text>
          <Text style={styles.bonusText}>{bonusLabel}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    paddingHorizontal: 8,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: GameColors.surface,
    borderRadius: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: GameColors.text,
  },
  score: {
    fontSize: 16,
    fontWeight: '900',
    color: GameColors.accent,
    minWidth: 36,
    textAlign: 'right',
  },
  scoreZero: {
    color: GameColors.textMuted,
  },
  bonusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: GameColors.surfaceLight,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 4,
  },
  bonusName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: GameColors.text,
  },
  bonusText: {
    fontSize: 13,
    fontWeight: '900',
    color: GameColors.accent,
    letterSpacing: 0.4,
  },
});
