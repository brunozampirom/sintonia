import { GameColors } from '@/constants/theme';
import { haptics } from '@/lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

interface GameOverPodiumProps {
  names: string[];
  colors: string[];
  scores: number[];
  avgDiffs?: number[];
  labels: {
    first: string;
    second: string;
    third: string;
    ranking: string;
  };
}

interface Ranked {
  index: number;
  name: string;
  color: string;
  score: number;
  avgDiff: number;
  rank: number;
}

function rankPlayers(
  names: string[],
  colors: string[],
  scores: number[],
  avgDiffs?: number[],
): Ranked[] {
  const sorted = names
    .map((name, index) => ({
      index,
      name,
      color: colors[index] ?? GameColors.textMuted,
      score: scores[index] ?? 0,
      avgDiff: avgDiffs?.[index] ?? Number.POSITIVE_INFINITY,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.avgDiff - b.avgDiff; // lower diff = more precise = ranks higher
    });

  const result: Ranked[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const prev = result[i - 1];
    const trueTie =
      prev && prev.score === sorted[i].score && prev.avgDiff === sorted[i].avgDiff;
    const rank = !prev || !trueTie ? i + 1 : prev.rank;
    result.push({ ...sorted[i], rank });
  }
  return result;
}

export function GameOverPodium({ names, colors, scores, avgDiffs, labels }: GameOverPodiumProps) {
  const ranked = useMemo(
    () => rankPlayers(names, colors, scores, avgDiffs),
    [names, colors, scores, avgDiffs],
  );
  const top = ranked.slice(0, 3);

  // Haptic reveal in the same visual order/stagger as FadeInDown.delay(180 * i):
  // pedestals render [silver(i=0), gold(i=1), bronze(i=2)].
  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    if (top[1]) timeouts.push(setTimeout(() => haptics.podiumSilver(), 0));
    if (top[0]) timeouts.push(setTimeout(() => haptics.podiumGold(), 180));
    if (top[2]) timeouts.push(setTimeout(() => haptics.podiumBronze(), 360));
    return () => timeouts.forEach(clearTimeout);
    // intentionally only on mount — podium doesn't change after game over
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const rest = ranked.slice(top.length);

  const podiumOrder: { player: Ranked | undefined; height: number; label: string }[] = [
    { player: top[1], height: 90, label: labels.second },
    { player: top[0], height: 130, label: labels.first },
    { player: top[2], height: 70, label: labels.third },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.podiumRow}>
        {podiumOrder.map((slot, i) => {
          if (!slot.player) return <View key={i} style={[styles.slot, { width: 80 }]} />;
          const isFirst = slot.player.rank === 1;
          return (
            <Animated.View
              key={slot.player.index}
              entering={FadeInDown.delay(180 * i).duration(420).springify()}
              style={styles.slot}
            >
              <Animated.View
                entering={ZoomIn.delay(180 * i + 120).duration(420).springify()}
                style={[
                  styles.avatar,
                  {
                    backgroundColor: slot.player.color,
                    width: isFirst ? 64 : 52,
                    height: isFirst ? 64 : 52,
                    borderRadius: isFirst ? 32 : 26,
                  },
                ]}
              >
                {isFirst ? (
                  <Ionicons name="trophy" size={28} color={GameColors.background} />
                ) : (
                  <Text style={[styles.medal, { color: GameColors.background }]}>
                    {slot.player.rank}
                  </Text>
                )}
              </Animated.View>
              <Text style={[styles.podiumName, isFirst && styles.podiumNameFirst]} numberOfLines={1}>
                {slot.player.name}
              </Text>
              <Text style={[styles.podiumScore, isFirst && styles.podiumScoreFirst]}>
                {slot.player.score}
              </Text>
              <View
                style={[
                  styles.pedestal,
                  {
                    height: slot.height,
                    backgroundColor: slot.player.color,
                    opacity: 0.85,
                  },
                ]}
              >
                <Text style={styles.podiumLabel}>{slot.label.toUpperCase()}</Text>
              </View>
            </Animated.View>
          );
        })}
      </View>

      {rest.length > 0 ? (
        <Animated.View entering={FadeIn.delay(500)} style={styles.rankingBlock}>
          <Text style={styles.rankingTitle}>{labels.ranking.toUpperCase()}</Text>
          {rest.map((p) => (
            <View key={p.index} style={styles.rankRow}>
              <Text style={styles.rankNumber}>{p.rank}º</Text>
              <View style={[styles.dot, { backgroundColor: p.color }]} />
              <Text style={styles.rankName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.rankScore}>{p.score}</Text>
            </View>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    gap: 16,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  slot: {
    alignItems: 'center',
    width: 92,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  medal: {
    fontSize: 22,
    fontWeight: '900',
  },
  podiumName: {
    fontSize: 13,
    fontWeight: '800',
    color: GameColors.text,
    marginBottom: 2,
    textAlign: 'center',
    maxWidth: 88,
  },
  podiumNameFirst: {
    fontSize: 15,
  },
  podiumScore: {
    fontSize: 22,
    fontWeight: '900',
    color: GameColors.text,
    marginBottom: 6,
  },
  podiumScoreFirst: {
    fontSize: 28,
    color: GameColors.accent,
  },
  pedestal: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 6,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  podiumLabel: {
    color: GameColors.background,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  rankingBlock: {
    width: '100%',
    backgroundColor: GameColors.surface,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  rankingTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: GameColors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  rankNumber: {
    width: 26,
    fontSize: 14,
    fontWeight: '800',
    color: GameColors.textMuted,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rankName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: GameColors.text,
  },
  rankScore: {
    fontSize: 16,
    fontWeight: '900',
    color: GameColors.text,
    minWidth: 30,
    textAlign: 'right',
  },
});
