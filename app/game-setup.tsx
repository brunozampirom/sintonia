import { GameButton } from '@/components/game-button';
import { GameColors } from '@/constants/theme';
import { useSettings, type GameMode, type ScoringTarget } from '@/contexts/settings-context';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const SCORE_OPTIONS = [5, 10, 15, 20];
const SKIP_OPTIONS = [
  { value: 0, label: '0' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 5, label: '5' },
  { value: -1, label: '∞' },
];

function ChipSelector({
  options,
  selected,
  onSelect,
}: {
  options: { value: number; label: string }[];
  selected: number;
  onSelect: (value: number) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          style={[styles.chip, selected === opt.value && styles.chipSelected]}
          onPress={() => onSelect(opt.value)}
        >
          <Text style={[styles.chipText, selected === opt.value && styles.chipTextSelected]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function ModeToggle({ mode, onChange }: { mode: GameMode; onChange: (m: GameMode) => void }) {
  const { t } = useTranslation();

  return (
    <View style={styles.toggleRow}>
      <Pressable
        style={[styles.toggleButton, mode === 'individual' && styles.toggleActive]}
        onPress={() => onChange('individual')}
      >
        <Ionicons
          name="person"
          size={16}
          color={mode === 'individual' ? GameColors.text : GameColors.textMuted}
        />
        <Text style={[styles.toggleText, mode === 'individual' && styles.toggleTextActive]}>
          {t('setup.mode.individual')}
        </Text>
      </Pressable>
      <Pressable
        style={[styles.toggleButton, mode === 'teams' && styles.toggleActive]}
        onPress={() => onChange('teams')}
      >
        <Ionicons
          name="people"
          size={16}
          color={mode === 'teams' ? GameColors.text : GameColors.textMuted}
        />
        <Text style={[styles.toggleText, mode === 'teams' && styles.toggleTextActive]}>
          {t('setup.mode.teams')}
        </Text>
      </Pressable>
    </View>
  );
}

export default function GameSetupScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useSettings();
  const { t } = useTranslation();
  const { isLandscape, isTablet, containerMaxWidth } = useResponsiveLayout();

  const [mode, setMode] = useState<GameMode>(settings.gameMode);
  const [scoringTarget, setScoringTarget] = useState<ScoringTarget>(settings.scoringTarget);
  const [winningScore, setWinningScore] = useState(settings.winningScore);
  const [skips, setSkips] = useState(settings.skipsPerPlayer);
  const [playerNames, setPlayerNames] = useState<[string, string]>([...settings.playerNames]);
  const [teams, setTeams] = useState(() => [
    { name: settings.teams[0].name, players: [...settings.teams[0].players] },
    { name: settings.teams[1].name, players: [...settings.teams[1].players] },
  ]);

  const handlePlayerNameChange = (idx: 0 | 1, name: string) => {
    const next: [string, string] = [...playerNames];
    next[idx] = name;
    setPlayerNames(next);
  };

  const handleTeamNameChange = (teamIdx: number, name: string) => {
    setTeams((prev) => {
      const next = [...prev];
      next[teamIdx] = { ...next[teamIdx], name };
      return next;
    });
  };

  const handleTeamPlayerChange = (teamIdx: number, playerIdx: number, name: string) => {
    setTeams((prev) => {
      const next = [...prev];
      const players = [...next[teamIdx].players];
      players[playerIdx] = name;
      next[teamIdx] = { ...next[teamIdx], players };
      return next;
    });
  };

  const handleAddPlayer = (teamIdx: number) => {
    setTeams((prev) => {
      const next = [...prev];
      const players = [...next[teamIdx].players, `${t('common.labels.player')} ${next[teamIdx].players.length + 1}`];
      next[teamIdx] = { ...next[teamIdx], players };
      return next;
    });
  };

  const handleRemovePlayer = (teamIdx: number, playerIdx: number) => {
    setTeams((prev) => {
      if (prev[teamIdx].players.length <= 2) {
        Alert.alert(t('setup.team.minPlayersAlert'));
        return prev;
      }
      const next = [...prev];
      const players = next[teamIdx].players.filter((_, i) => i !== playerIdx);
      next[teamIdx] = { ...next[teamIdx], players };
      return next;
    });
  };

  const handlePlay = () => {
    updateSettings({
      gameMode: mode,
      scoringTarget,
      winningScore,
      skipsPerPlayer: skips,
      playerNames,
      teams: [
        { name: teams[0].name, players: teams[0].players },
        { name: teams[1].name, players: teams[1].players },
      ],
    });
    router.push('/game');
  };

  const responsiveContainer = isTablet ? {
    maxWidth: containerMaxWidth,
    alignSelf: 'center' as const,
    width: '100%' as const,
  } : undefined;

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, responsiveContainer]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={GameColors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('setup.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={responsiveContainer}>
        <ModeToggle mode={mode} onChange={setMode} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, responsiveContainer]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={isLandscape ? styles.grid : undefined}>
        {/* Winning Score */}
        <View style={[styles.section, isLandscape && styles.sectionLandscape]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy-outline" size={20} color={GameColors.accent} />
            <Text style={styles.sectionTitle}>{t('setup.sections.winningScore')}</Text>
          </View>
          <ChipSelector
            options={SCORE_OPTIONS.map((v) => ({ value: v, label: String(v) }))}
            selected={winningScore}
            onSelect={setWinningScore}
          />
        </View>

        {/* Skips */}
        <View style={[styles.section, isLandscape && styles.sectionLandscape]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="play-skip-forward-outline" size={20} color={GameColors.sky} />
            <Text style={styles.sectionTitle}>
              {t('setup.sections.skipsPer', { target: mode === 'teams' ? t('common.labels.team') : t('common.labels.player') })}
            </Text>
          </View>
          <ChipSelector options={SKIP_OPTIONS} selected={skips} onSelect={setSkips} />
        </View>

        {/* Scoring Target — only for individual mode */}
        {mode === 'individual' && (
          <View style={[styles.section, isLandscape && styles.sectionLandscape]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star-outline" size={20} color={GameColors.mint} />
              <Text style={styles.sectionTitle}>{t('setup.sections.scoringTarget')}</Text>
            </View>
            <View style={styles.scoringRow}>
              <Pressable
                style={[styles.scoringOption, scoringTarget === 'cluer' && styles.scoringOptionActive]}
                onPress={() => setScoringTarget('cluer')}
              >
                <View style={[styles.scoringIconWrap, scoringTarget === 'cluer' && styles.scoringIconWrapActive]}>
                  <Ionicons name="chatbubble" size={18} color={scoringTarget === 'cluer' ? GameColors.background : GameColors.textMuted} />
                </View>
                <Text style={[styles.scoringLabel, scoringTarget === 'cluer' && styles.scoringLabelActive]}>
                  {t('setup.scoring.cluer')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.scoringOption, scoringTarget === 'guesser' && styles.scoringOptionActive]}
                onPress={() => setScoringTarget('guesser')}
              >
                <View style={[styles.scoringIconWrap, scoringTarget === 'guesser' && styles.scoringIconWrapActive]}>
                  <Ionicons name="search" size={18} color={scoringTarget === 'guesser' ? GameColors.background : GameColors.textMuted} />
                </View>
                <Text style={[styles.scoringLabel, scoringTarget === 'guesser' && styles.scoringLabelActive]}>
                  {t('setup.scoring.guesser')}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {mode === 'individual' ? (
          /* ===== INDIVIDUAL ===== */
          <View style={[styles.section, isLandscape && styles.sectionLandscape]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people-outline" size={20} color={GameColors.secondary} />
              <Text style={styles.sectionTitle}>{t('setup.sections.players')}</Text>
            </View>
            <TextInput
              style={styles.nameInput}
              value={playerNames[0]}
              onChangeText={(t) => handlePlayerNameChange(0, t)}
              placeholder={`${t('common.labels.player')} 1`}
              placeholderTextColor={GameColors.textMuted}
              maxLength={20}
            />
            <TextInput
              style={styles.nameInput}
              value={playerNames[1]}
              onChangeText={(t) => handlePlayerNameChange(1, t)}
              placeholder={`${t('common.labels.player')} 2`}
              placeholderTextColor={GameColors.textMuted}
              maxLength={20}
            />
          </View>
        ) : (
          /* ===== TEAMS ===== */
          <>
            {teams.map((team, teamIdx) => (
              <View key={teamIdx} style={[styles.section, isLandscape && styles.sectionLandscape]}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name={teamIdx === 0 ? 'flag-outline' : 'flag'}
                    size={20}
                    color={teamIdx === 0 ? GameColors.sky : GameColors.primary}
                  />
                  <Text style={styles.sectionTitle}>{t('setup.team.title', { number: teamIdx + 1 })}</Text>
                </View>
                <TextInput
                  style={styles.teamNameInput}
                  value={team.name}
                  onChangeText={(t) => handleTeamNameChange(teamIdx, t)}
                  placeholder={t('setup.team.namePlaceholder', { number: teamIdx + 1 })}
                  placeholderTextColor={GameColors.textMuted}
                  maxLength={20}
                />
                {team.players.map((player, playerIdx) => (
                  <View key={playerIdx} style={styles.teamPlayerRow}>
                    <TextInput
                      style={styles.teamPlayerInput}
                      value={player}
                      onChangeText={(t) => handleTeamPlayerChange(teamIdx, playerIdx, t)}
                      placeholder={`${t('common.labels.player')} ${playerIdx + 1}`}
                      placeholderTextColor={GameColors.textMuted}
                      maxLength={20}
                    />
                    <Pressable
                      style={styles.removePlayerButton}
                      onPress={() => handleRemovePlayer(teamIdx, playerIdx)}
                    >
                      <Ionicons name="close-circle" size={22} color={GameColors.primary} />
                    </Pressable>
                  </View>
                ))}
                <Pressable style={styles.addPlayerButton} onPress={() => handleAddPlayer(teamIdx)}>
                  <Ionicons name="add-circle-outline" size={18} color={GameColors.accent} />
                  <Text style={styles.addPlayerText}>{t('setup.team.addPlayer')}</Text>
                </Pressable>
              </View>
            ))}
          </>
        )}
        </View>

        {/* Bottom spacing for floating button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Play Button */}
      <View style={styles.floatingButton}>
        <GameButton title={t('common.actions.play')} onPress={handlePlay} />
      </View>
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
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: GameColors.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: GameColors.surface,
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleActive: {
    backgroundColor: GameColors.surfaceLight,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: GameColors.textMuted,
  },
  toggleTextActive: {
    color: GameColors.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: GameColors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sectionLandscape: {
    width: '48.5%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GameColors.text,
  },
  scoringRow: {
    flexDirection: 'row',
    gap: 10,
  },
  scoringOption: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: GameColors.surfaceLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  scoringOptionActive: {
    borderColor: GameColors.accent,
    backgroundColor: GameColors.surfaceLight,
  },
  scoringIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GameColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoringIconWrapActive: {
    backgroundColor: GameColors.accent,
  },
  scoringLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: GameColors.textMuted,
    textAlign: 'center',
  },
  scoringLabelActive: {
    color: GameColors.accent,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: GameColors.surfaceLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipSelected: {
    borderColor: GameColors.accent,
    backgroundColor: GameColors.surfaceLight,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '700',
    color: GameColors.textMuted,
  },
  chipTextSelected: {
    color: GameColors.accent,
  },
  nameInput: {
    backgroundColor: GameColors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: GameColors.text,
  },
  teamNameInput: {
    backgroundColor: GameColors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '800',
    color: GameColors.accent,
    letterSpacing: 0.5,
  },
  teamPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamPlayerInput: {
    flex: 1,
    backgroundColor: GameColors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    color: GameColors.text,
  },
  removePlayerButton: {
    padding: 4,
  },
  addPlayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GameColors.surfaceLight,
    borderStyle: 'dashed',
  },
  addPlayerText: {
    fontSize: 13,
    fontWeight: '600',
    color: GameColors.accent,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
    backgroundColor: GameColors.background,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: GameColors.surface,
  },
});
