import { GameColors } from '@/constants/theme';
import type { RoundRecord } from '@/hooks/use-game-state';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

function getScoreColor(score: number) {
  switch (score) {
    case 4: return GameColors.primary;
    case 3: return GameColors.accent;
    case 2: return GameColors.yellow;
    default: return GameColors.textMuted;
  }
}

function getScoreLabel(score: number) {
  switch (score) {
    case 4: return 'PERFEITO!';
    case 3: return 'QUASE LÁ!';
    case 2: return 'NA ÁREA!';
    default: return 'ERROU!';
  }
}

function RoundCard({ record, playerNames, index }: { record: RoundRecord; playerNames: [string, string]; index: number }) {
  const diff = Math.abs(record.targetAngle - record.guessAngle);

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400)} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.roundBadge}>
          <Text style={styles.roundBadgeText}>R{record.round}</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(record.score) }]}>
          <Text style={styles.scoreBadgeText}>+{record.score}</Text>
        </View>
      </View>

      <Text style={[styles.scoreLabel, { color: getScoreColor(record.score) }]}>
        {getScoreLabel(record.score)}
      </Text>

      <View style={styles.spectrumRow}>
        <Text style={styles.spectrumText} numberOfLines={1}>← {record.spectrum.left}</Text>
        <View style={styles.spectrumDivider} />
        <Text style={styles.spectrumText} numberOfLines={1}>{record.spectrum.right} →</Text>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Alvo</Text>
          <Text style={styles.detailValue}>{record.targetAngle.toFixed(0)}°</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Tentativa</Text>
          <Text style={styles.detailValue}>{record.guessAngle.toFixed(0)}°</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Diferença</Text>
          <Text style={[styles.detailValue, { color: getScoreColor(record.score) }]}>{diff.toFixed(0)}°</Text>
        </View>
      </View>

      <View style={styles.playersRow}>
        <Text style={styles.playerInfo}>
          <Ionicons name="chatbubble-outline" size={11} color={GameColors.textMuted} />{' '}
          {playerNames[record.clueGiver - 1]}
        </Text>
        <Text style={styles.playerInfo}>
          <Ionicons name="search-outline" size={11} color={GameColors.textMuted} />{' '}
          {playerNames[record.guesser - 1]}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ history: string; playerNames: string; scores: string }>();

  const history: RoundRecord[] = params.history ? JSON.parse(params.history) : [];
  const playerNames: [string, string] = params.playerNames ? JSON.parse(params.playerNames) : ['Jogador 1', 'Jogador 2'];
  const scores: [number, number] = params.scores ? JSON.parse(params.scores) : [0, 0];

  const totalPoints = [0, 0];
  for (const r of history) {
    totalPoints[r.guesser - 1] += r.score;
  }

  const perfectRounds = history.filter((r) => r.score === 4).length;
  const avgDiff = history.length > 0
    ? (history.reduce((sum, r) => sum + Math.abs(r.targetAngle - r.guessAngle), 0) / history.length)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={GameColors.textMuted} />
        </Pressable>
        <Text style={styles.headerTitle}>Histórico</Text>
        <View />
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{history.length}</Text>
          <Text style={styles.summaryLabel}>Rodadas</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: GameColors.primary }]}>{perfectRounds}</Text>
          <Text style={styles.summaryLabel}>Perfeitos</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{avgDiff.toFixed(0)}°</Text>
          <Text style={styles.summaryLabel}>Média Diff</Text>
        </View>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => String(item.round)}
        renderItem={({ item, index }) => (
          <RoundCard record={item} playerNames={playerNames} index={index} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GameColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: GameColors.text,
    letterSpacing: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: GameColors.surface,
    marginHorizontal: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '900',
    color: GameColors.text,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: GameColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: GameColors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roundBadge: {
    backgroundColor: GameColors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roundBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: GameColors.text,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: GameColors.text,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
  },
  spectrumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GameColors.surfaceLight,
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  spectrumText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: GameColors.text,
    textAlign: 'center',
  },
  spectrumDivider: {
    width: 1,
    height: 16,
    backgroundColor: GameColors.textMuted,
    opacity: 0.4,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: GameColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '800',
    color: GameColors.text,
    marginTop: 2,
  },
  playersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: GameColors.surfaceLight,
  },
  playerInfo: {
    fontSize: 11,
    color: GameColors.textMuted,
    fontWeight: '500',
  },
});
