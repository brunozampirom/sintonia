import { GameColors } from '@/constants/theme';
import type { RoundGuess, RoundRecord } from '@/hooks/use-game-state';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { haptics } from '@/lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

function getScoreColor(score: number) {
  switch (score) {
    case 4: return GameColors.primary;
    case 3: return GameColors.accent;
    case 2: return GameColors.yellow;
    default: return GameColors.textMuted;
  }
}

function getScoreLabel(score: number, t: (key: string) => string) {
  switch (score) {
    case 4: return t('history.score.perfect');
    case 3: return t('history.score.close');
    case 2: return t('history.score.near');
    default: return t('history.score.miss');
  }
}

function indexName(playerNames: string[], idx: number, fallback: string): string {
  return playerNames[idx] ?? fallback;
}

function RoundCard({
  record,
  playerNames,
  index,
}: {
  record: RoundRecord;
  playerNames: string[];
  index: number;
}) {
  const { t } = useTranslation();
  const fallbackPlayer = t('common.labels.player');
  const isMulti = Array.isArray(record.guesses) && record.guesses.length > 1;
  const displayScore = isMulti
    ? Math.max(...record.guesses!.map((g) => g.score))
    : record.score;
  const headerScore = isMulti && typeof record.cluerBonus === 'number'
    ? record.cluerBonus
    : record.score;
  const diff = Math.abs(record.targetAngle - record.guessAngle);
  const cluerName = record.clueGiverName ?? indexName(playerNames, record.clueGiver, fallbackPlayer);

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400)} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.roundBadge}>
          <Text style={styles.roundBadgeText}>R{record.round}</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(displayScore) }]}>
          <Text style={styles.scoreBadgeText}>
            {isMulti ? `+${headerScore}` : `+${record.score}`}
          </Text>
        </View>
      </View>

      <Text style={[styles.scoreLabel, { color: getScoreColor(displayScore) }]}>
        {getScoreLabel(displayScore, t)}
      </Text>

      <View style={styles.spectrumRow}>
        <Text style={styles.spectrumText} numberOfLines={1}>← {record.spectrum.left}</Text>
        <View style={styles.spectrumDivider} />
        <Text style={styles.spectrumText} numberOfLines={1}>{record.spectrum.right} →</Text>
      </View>

      {isMulti ? (
        <View style={styles.guessesList}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('common.labels.target')}</Text>
            <Text style={styles.detailValue}>{record.targetAngle.toFixed(0)}°</Text>
          </View>
          {record.guesses!.map((g: RoundGuess, gi: number) => (
            <View key={gi} style={styles.guessRow}>
              <Text style={styles.guessName} numberOfLines={1}>
                {indexName(playerNames, g.playerIndex, fallbackPlayer)}
              </Text>
              <Text style={styles.guessAngle}>{g.angle.toFixed(0)}°</Text>
              <Text style={[styles.guessScore, { color: getScoreColor(g.score) }]}>+{g.score}</Text>
            </View>
          ))}
          {typeof record.cluerBonus === 'number' && record.cluerBonus > 0 && (
            <View style={[styles.guessRow, styles.bonusRow]}>
              <Text style={styles.guessName} numberOfLines={1}>{cluerName}</Text>
              <Text style={styles.guessAngle}>
                <Ionicons name="chatbubble-outline" size={11} color={GameColors.textMuted} />
              </Text>
              <Text style={[styles.guessScore, { color: GameColors.accent }]}>
                +{record.cluerBonus}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('common.labels.target')}</Text>
            <Text style={styles.detailValue}>{record.targetAngle.toFixed(0)}°</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('common.labels.guess')}</Text>
            <Text style={styles.detailValue}>{record.guessAngle.toFixed(0)}°</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('common.labels.difference')}</Text>
            <Text style={[styles.detailValue, { color: getScoreColor(record.score) }]}>{diff.toFixed(0)}°</Text>
          </View>
        </View>
      )}

      <View style={styles.playersRow}>
        <Text style={styles.playerInfo}>
          <Ionicons name="chatbubble-outline" size={11} color={GameColors.textMuted} />{' '}
          {cluerName}
          {record.teamName ? ` (${record.teamName})` : ''}
        </Text>
        {!isMulti && (
          <Text style={styles.playerInfo}>
            <Ionicons name="search-outline" size={11} color={GameColors.textMuted} />{' '}
            {record.guesserName ?? indexName(playerNames, record.guesser, fallbackPlayer)}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isTablet, containerMaxWidth } = useResponsiveLayout();
  const params = useLocalSearchParams<{ history: string; playerNames: string; scores: string }>();

  const history: RoundRecord[] = params.history ? JSON.parse(params.history) : [];
  const playerNames: string[] = params.playerNames
    ? JSON.parse(params.playerNames)
    : [`${t('common.labels.player')} 1`, `${t('common.labels.player')} 2`];

  const perfectRounds = history.filter((r) => {
    if (Array.isArray(r.guesses)) return r.guesses.some((g) => g.score === 4);
    return r.score === 4;
  }).length;

  const avgDiff = history.length > 0
    ? (history.reduce((sum, r) => {
        if (Array.isArray(r.guesses) && r.guesses.length > 0) {
          const diffs = r.guesses.map((g) => Math.abs(r.targetAngle - g.angle));
          return sum + diffs.reduce((a, b) => a + b, 0) / diffs.length;
        }
        return sum + Math.abs(r.targetAngle - r.guessAngle);
      }, 0) / history.length)
    : 0;

  const responsiveContainer = isTablet ? {
    maxWidth: containerMaxWidth,
    alignSelf: 'center' as const,
    width: '100%' as const,
  } : undefined;

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, responsiveContainer]}>
        <Pressable style={styles.backButton} onPress={() => { haptics.back(); router.back(); }}>
          <Ionicons name="arrow-back" size={20} color={GameColors.textMuted} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('history.title')}</Text>
        <View />
      </View>

      <View style={[styles.summaryRow, responsiveContainer]}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{history.length}</Text>
          <Text style={styles.summaryLabel}>{t('history.summary.rounds')}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: GameColors.primary }]}>{perfectRounds}</Text>
          <Text style={styles.summaryLabel}>{t('history.summary.perfect')}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{avgDiff.toFixed(0)}°</Text>
          <Text style={styles.summaryLabel}>{t('history.summary.avgDiff')}</Text>
        </View>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => String(item.round)}
        renderItem={({ item, index }) => (
          <RoundCard record={item} playerNames={playerNames} index={index} />
        )}
        contentContainerStyle={[styles.listContent, responsiveContainer]}
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
  guessesList: {
    gap: 6,
  },
  guessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GameColors.surfaceLight,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 10,
  },
  bonusRow: {
    borderWidth: 1,
    borderColor: GameColors.accent,
    backgroundColor: 'transparent',
  },
  guessName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: GameColors.text,
  },
  guessAngle: {
    fontSize: 12,
    color: GameColors.textMuted,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
  guessScore: {
    fontSize: 14,
    fontWeight: '900',
    minWidth: 30,
    textAlign: 'right',
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
