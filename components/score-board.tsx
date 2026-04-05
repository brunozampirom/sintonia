import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AnimatedScore } from '@/components/animated-score';
import { GameColors } from '@/constants/theme';

interface ScoreBoardProps {
  scores: [number, number];
  activePlayer: 1 | 2;
  round: number;
  playerNames?: [string, string];
  winningScore?: number;
  compact?: boolean;
}

export function ScoreBoard({ scores, activePlayer, round, playerNames = ['Jogador 1', 'Jogador 2'], winningScore = 10, compact }: ScoreBoardProps) {
  return (
    <Animated.View entering={FadeIn} style={[styles.container, compact && styles.containerCompact]}>
      <View style={styles.scoreRow}>
        <View style={[styles.playerBox, compact && styles.playerBoxCompact, activePlayer === 1 && styles.activePlayerBox]}>
          <Text style={[styles.playerLabel, compact && styles.playerLabelCompact]} numberOfLines={1}>{playerNames[0]}</Text>
          <AnimatedScore value={scores[0]} style={[styles.scoreText, compact && styles.scoreTextCompact]} />
        </View>
        <View style={styles.centerInfo}>
          <Text style={[styles.roundText, compact && styles.roundTextCompact]}>R{round}</Text>
          <Text style={[styles.targetText, compact && styles.targetTextCompact]}>Meta: {winningScore}</Text>
        </View>
        <View style={[styles.playerBox, compact && styles.playerBoxCompact, activePlayer === 2 && styles.activePlayerBox]}>
          <Text style={[styles.playerLabel, compact && styles.playerLabelCompact]} numberOfLines={1}>{playerNames[1]}</Text>
          <AnimatedScore value={scores[1]} style={[styles.scoreText, compact && styles.scoreTextCompact]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  playerBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: GameColors.surface,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activePlayerBox: {
    borderColor: GameColors.accent,
  },
  playerLabel: {
    color: GameColors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreText: {
    color: GameColors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  centerInfo: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  roundText: {
    color: GameColors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  targetText: {
    color: GameColors.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  // Compact variants for landscape
  containerCompact: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  playerBoxCompact: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  playerLabelCompact: {
    fontSize: 9,
  },
  scoreTextCompact: {
    fontSize: 18,
  },
  roundTextCompact: {
    fontSize: 9,
  },
  targetTextCompact: {
    fontSize: 8,
  },
});
