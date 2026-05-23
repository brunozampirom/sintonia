import { AnimatedScore } from '@/components/animated-score';
import { PlayerChip } from '@/components/player-chip';
import { GameColors } from '@/constants/theme';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

interface ScoreBoardProps {
  scores: number[];
  activeSideIndex: number;
  round: number;
  sideNames: string[];
  sideColors: string[];
  winningScore?: number;
  compact?: boolean;
}

export function ScoreBoard({
  scores,
  activeSideIndex,
  round,
  sideNames,
  sideColors,
  winningScore = 10,
  compact,
}: ScoreBoardProps) {
  const { t } = useTranslation();
  const n = sideNames.length;

  if (n <= 2) {
    const fallback = [t('common.labels.player') + ' 1', t('common.labels.player') + ' 2'];
    const names = n === 2 ? sideNames : fallback;
    const colorsArr = [sideColors[0] ?? GameColors.accent, sideColors[1] ?? GameColors.accent];
    const safeScores = [scores[0] ?? 0, scores[1] ?? 0];

    return (
      <Animated.View entering={FadeIn} style={[styles.container, compact && styles.containerCompact]}>
        <View style={styles.scoreRow}>
          <View
            style={[
              styles.playerBox,
              compact && styles.playerBoxCompact,
              activeSideIndex === 0 && { borderColor: colorsArr[0] },
            ]}
          >
            <Text style={[styles.playerLabel, compact && styles.playerLabelCompact]} numberOfLines={1}>
              {names[0]}
            </Text>
            <AnimatedScore value={safeScores[0]} style={[styles.scoreText, compact && styles.scoreTextCompact]} />
          </View>
          <View style={styles.centerInfo}>
            <Text style={[styles.roundText, compact && styles.roundTextCompact]}>
              {t('scoreboard.round', { round })}
            </Text>
            <Text style={[styles.targetText, compact && styles.targetTextCompact]}>
              {t('scoreboard.target', { score: winningScore })}
            </Text>
          </View>
          <View
            style={[
              styles.playerBox,
              compact && styles.playerBoxCompact,
              activeSideIndex === 1 && { borderColor: colorsArr[1] },
            ]}
          >
            <Text style={[styles.playerLabel, compact && styles.playerLabelCompact]} numberOfLines={1}>
              {names[1]}
            </Text>
            <AnimatedScore value={safeScores[1]} style={[styles.scoreText, compact && styles.scoreTextCompact]} />
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <ScoreBoardPills
      scores={scores}
      activeSideIndex={activeSideIndex}
      round={round}
      sideNames={sideNames}
      sideColors={sideColors}
      winningScore={winningScore}
      compact={compact}
    />
  );
}

function ScoreBoardPills({
  scores,
  activeSideIndex,
  round,
  sideNames,
  sideColors,
  winningScore = 10,
  compact,
}: ScoreBoardProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const pillLayouts = useRef(new Map<number, { x: number; width: number }>());
  const [containerWidth, setContainerWidth] = useState(0);
  const hasAutoScrolledOnce = useRef(false);

  useEffect(() => {
    const layout = pillLayouts.current.get(activeSideIndex);
    if (!layout || !scrollRef.current || containerWidth === 0) return;
    const target = Math.max(0, layout.x + layout.width / 2 - containerWidth / 2);
    scrollRef.current.scrollTo({ x: target, animated: hasAutoScrolledOnce.current });
    hasAutoScrolledOnce.current = true;
  }, [activeSideIndex, containerWidth, sideNames.length]);

  return (
    <Animated.View entering={FadeIn} style={[styles.container, compact && styles.containerCompact]}>
      <View style={[styles.metaRow, compact && styles.metaRowCompact]}>
        <Text style={[styles.metaText, compact && styles.metaTextCompact]}>
          {t('scoreboard.round', { round })}
        </Text>
        <Text style={[styles.metaTextAccent, compact && styles.metaTextCompact]}>
          {t('scoreboard.target', { score: winningScore })}
        </Text>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
        style={styles.pillsScroll}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        {sideNames.map((name, idx) => (
          <View
            key={idx}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              pillLayouts.current.set(idx, { x, width });
              if (idx === activeSideIndex && scrollRef.current && containerWidth > 0 && !hasAutoScrolledOnce.current) {
                const target = Math.max(0, x + width / 2 - containerWidth / 2);
                scrollRef.current.scrollTo({ x: target, animated: false });
                hasAutoScrolledOnce.current = true;
              }
            }}
          >
            <PlayerChip
              name={name}
              color={sideColors[idx] ?? GameColors.accent}
              score={scores[idx] ?? 0}
              active={idx === activeSideIndex}
              compact={compact}
            />
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  containerCompact: {
    paddingVertical: 2,
    paddingHorizontal: 8,
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
  playerBoxCompact: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  playerLabel: {
    color: GameColors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playerLabelCompact: {
    fontSize: 9,
  },
  scoreText: {
    color: GameColors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  scoreTextCompact: {
    fontSize: 18,
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
  roundTextCompact: {
    fontSize: 9,
  },
  targetText: {
    color: GameColors.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  targetTextCompact: {
    fontSize: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  metaRowCompact: {
    marginBottom: 2,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
    color: GameColors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  metaTextAccent: {
    fontSize: 11,
    fontWeight: '800',
    color: GameColors.accent,
    letterSpacing: 0.6,
  },
  metaTextCompact: {
    fontSize: 9,
  },
  pillsScroll: {
    // Let the scroll area extend beyond the parent's horizontal padding so pills
    // can slide past the visible edge on small screens instead of being clipped.
    marginHorizontal: -16,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 2,
    alignItems: 'center',
  },
});
