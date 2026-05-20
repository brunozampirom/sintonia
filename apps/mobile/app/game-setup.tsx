import { GameButton } from '@/components/game-button';
import { HeaderIconButton, HeaderSpacer, HeaderTitle, ScreenHeader } from '@/components/screen-header';
import { haptics } from '@/lib/haptics';
import { MAX_PLAYERS, MIN_PLAYERS, PLAYER_COLOR_PALETTE, assignDefaultColors, reconcileColors } from '@/constants/player-colors';
import { GameColors } from '@/constants/theme';
import { useSettings, type GameMode, type RoundFlow, type ScoringTarget } from '@/contexts/settings-context';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const SCORE_OPTIONS = [5, 10, 15, 20, 30];
const SKIP_OPTIONS = [
  { value: 0, label: '0' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 5, label: '5' },
  { value: -1, label: '∞' },
];
const TIME_OPTIONS = [
  { value: -1, label: '∞' },
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 60, label: '60s' },
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
          onPress={() => {
            if (selected !== opt.value) haptics.selection();
            onSelect(opt.value);
          }}
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

  const pick = (m: GameMode) => {
    if (m !== mode) haptics.selection();
    onChange(m);
  };

  return (
    <View style={styles.toggleRow}>
      <Pressable
        style={[styles.toggleButton, mode === 'individual' && styles.toggleActive]}
        onPress={() => pick('individual')}
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
        onPress={() => pick('teams')}
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
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<GameMode>(settings.gameMode);
  const [scoringTarget, setScoringTarget] = useState<ScoringTarget>(settings.scoringTarget);
  const [winningScore, setWinningScore] = useState(settings.winningScore);
  const [skips, setSkips] = useState(settings.skipsPerPlayer);
  const [clueTimeLimit, setClueTimeLimit] = useState(settings.clueTimeLimit);
  const [guessTimeLimit, setGuessTimeLimit] = useState(settings.guessTimeLimit);
  const [playerNames, setPlayerNames] = useState<string[]>(() => [...settings.playerNames]);
  const [playerColors, setPlayerColors] = useState<string[]>(() =>
    reconcileColors(settings.playerNames.length, settings.playerColors ?? assignDefaultColors(settings.playerNames.length)),
  );
  const [roundFlow, setRoundFlow] = useState<RoundFlow>(settings.roundFlow);
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);
  const [teams, setTeams] = useState(() => [
    {
      name: settings.teams[0].name,
      players: [...settings.teams[0].players],
      color: settings.teams[0].color ?? GameColors.sky,
    },
    {
      name: settings.teams[1].name,
      players: [...settings.teams[1].players],
      color: settings.teams[1].color ?? GameColors.primary,
    },
  ]);

  const handlePlayerNameChange = (idx: number, name: string) => {
    setPlayerNames((prev) => {
      const next = [...prev];
      next[idx] = name;
      return next;
    });
  };

  const handlePlayerColorChange = (idx: number, color: string) => {
    haptics.colorPick();
    setPlayerColors((prev) => {
      const next = [...prev];
      next[idx] = color;
      return next;
    });
    setOpenColorPicker(null);
  };

  const handleTeamColorChange = (teamIdx: number, color: string) => {
    haptics.colorPick();
    setTeams((prev) => {
      const next = [...prev];
      next[teamIdx] = { ...next[teamIdx], color };
      return next;
    });
    setOpenColorPicker(null);
  };

  const handleAddIndividualPlayer = () => {
    if (playerNames.length >= MAX_PLAYERS) {
      Alert.alert(t('setup.individual.maxPlayersAlert'));
      return;
    }
    haptics.addRemovePlayer();
    setPlayerNames((prev) => [...prev, `${t('common.labels.player')} ${prev.length + 1}`]);
    setPlayerColors((prev) => {
      const nextLen = prev.length + 1;
      return reconcileColors(nextLen, prev);
    });
  };

  const handleRemoveIndividualPlayer = (idx: number) => {
    if (playerNames.length <= MIN_PLAYERS) {
      Alert.alert(t('setup.individual.minPlayersAlert'));
      return;
    }
    haptics.addRemovePlayer();
    setPlayerNames((prev) => prev.filter((_, i) => i !== idx));
    setPlayerColors((prev) => prev.filter((_, i) => i !== idx));
    setOpenColorPicker(null);
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

  const handleAddTeamPlayer = (teamIdx: number) => {
    haptics.addRemovePlayer();
    setTeams((prev) => {
      const next = [...prev];
      const players = [...next[teamIdx].players, `${t('common.labels.player')} ${next[teamIdx].players.length + 1}`];
      next[teamIdx] = { ...next[teamIdx], players };
      return next;
    });
  };

  const handleRemoveTeamPlayer = (teamIdx: number, playerIdx: number) => {
    let blocked = false;
    setTeams((prev) => {
      if (prev[teamIdx].players.length <= 2) {
        Alert.alert(t('setup.team.minPlayersAlert'));
        blocked = true;
        return prev;
      }
      const next = [...prev];
      const players = next[teamIdx].players.filter((_, i) => i !== playerIdx);
      next[teamIdx] = { ...next[teamIdx], players };
      return next;
    });
    if (!blocked) haptics.addRemovePlayer();
  };

  const handlePlay = () => {
    haptics.play();
    updateSettings({
      gameMode: mode,
      scoringTarget,
      winningScore,
      skipsPerPlayer: skips,
      clueTimeLimit,
      guessTimeLimit,
      playerNames,
      playerColors,
      roundFlow,
      teams: [
        { name: teams[0].name, players: teams[0].players, color: teams[0].color },
        { name: teams[1].name, players: teams[1].players, color: teams[1].color },
      ],
    });
    router.push('/game');
  };

  const responsiveContainer = isTablet ? {
    maxWidth: containerMaxWidth,
    alignSelf: 'center' as const,
    width: '100%' as const,
  } : undefined;

  const showRoundFlowSection = mode === 'individual' && playerNames.length >= 3;
  const showScoringToggle = mode === 'individual' && (playerNames.length === 2 || roundFlow === 'single-guess');
  const showAllGuessHint = mode === 'individual' && playerNames.length >= 3 && roundFlow === 'all-guess';

  const playersSection = mode === 'individual' ? (
    <View style={[styles.section, isLandscape && styles.sectionLandscape]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="people-outline" size={20} color={GameColors.secondary} />
        <Text style={styles.sectionTitle}>{t('setup.sections.players')}</Text>
      </View>
      {playerNames.map((name, idx) => {
        const color = playerColors[idx] ?? GameColors.accent;
        const pickerKey = `ind-${idx}`;
        const isOpen = openColorPicker === pickerKey;
        return (
          <View key={idx}>
            <View style={styles.individualRow}>
              <Pressable
                style={[styles.colorDot, { backgroundColor: color }, isOpen && styles.colorDotOpen]}
                onPress={() => setOpenColorPicker(isOpen ? null : pickerKey)}
              />
              <TextInput
                style={styles.individualNameInput}
                value={name}
                onChangeText={(t) => handlePlayerNameChange(idx, t)}
                placeholder={`${t('common.labels.player')} ${idx + 1}`}
                placeholderTextColor={GameColors.textMuted}
                maxLength={20}
              />
              {playerNames.length > MIN_PLAYERS && (
                <Pressable
                  style={styles.removePlayerButton}
                  onPress={() => handleRemoveIndividualPlayer(idx)}
                >
                  <Ionicons name="close-circle" size={22} color={GameColors.primary} />
                </Pressable>
              )}
            </View>
            {isOpen && (
              <View style={styles.colorPalette}>
                {PLAYER_COLOR_PALETTE.map((paletteColor) => {
                  const selected = paletteColor === color;
                  return (
                    <Pressable
                      key={paletteColor}
                      style={[
                        styles.paletteDot,
                        { backgroundColor: paletteColor },
                        selected && styles.paletteDotSelected,
                      ]}
                      onPress={() => handlePlayerColorChange(idx, paletteColor)}
                    />
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
      {playerNames.length < MAX_PLAYERS && (
        <Pressable style={styles.addPlayerButton} onPress={handleAddIndividualPlayer}>
          <Ionicons name="add-circle-outline" size={18} color={GameColors.accent} />
          <Text style={styles.addPlayerText}>{t('setup.individual.addPlayer')}</Text>
        </Pressable>
      )}
    </View>
  ) : (
    <>
      {teams.map((team, teamIdx) => {
        const pickerKey = `team-${teamIdx}`;
        const isPickerOpen = openColorPicker === pickerKey;
        return (
          <View key={teamIdx} style={[styles.section, isLandscape && styles.sectionLandscape]}>
            <View style={styles.sectionHeader}>
              <Pressable
                style={[styles.colorDot, { backgroundColor: team.color }, isPickerOpen && styles.colorDotOpen]}
                onPress={() => setOpenColorPicker(isPickerOpen ? null : pickerKey)}
              />
              <Text style={styles.sectionTitle}>{t('setup.team.title', { number: teamIdx + 1 })}</Text>
            </View>
            {isPickerOpen && (
              <View style={styles.colorPalette}>
                {PLAYER_COLOR_PALETTE.map((paletteColor) => {
                  const selected = paletteColor === team.color;
                  return (
                    <Pressable
                      key={paletteColor}
                      style={[
                        styles.paletteDot,
                        { backgroundColor: paletteColor },
                        selected && styles.paletteDotSelected,
                      ]}
                      onPress={() => handleTeamColorChange(teamIdx, paletteColor)}
                    />
                  );
                })}
              </View>
            )}
            {team.players.map((player, playerIdx) => (
              <View key={playerIdx} style={styles.individualRow}>
                <TextInput
                  style={styles.individualNameInput}
                  value={player}
                  onChangeText={(t) => handleTeamPlayerChange(teamIdx, playerIdx, t)}
                  placeholder={`${t('common.labels.player')} ${playerIdx + 1}`}
                  placeholderTextColor={GameColors.textMuted}
                  maxLength={20}
                />
                {team.players.length > 2 && (
                  <Pressable
                    style={styles.removePlayerButton}
                    onPress={() => handleRemoveTeamPlayer(teamIdx, playerIdx)}
                  >
                    <Ionicons name="close-circle" size={22} color={GameColors.primary} />
                  </Pressable>
                )}
              </View>
            ))}
            <Pressable style={styles.addPlayerButton} onPress={() => handleAddTeamPlayer(teamIdx)}>
              <Ionicons name="add-circle-outline" size={18} color={GameColors.accent} />
              <Text style={styles.addPlayerText}>{t('setup.team.addPlayer')}</Text>
            </Pressable>
          </View>
        );
      })}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader style={responsiveContainer}>
        <HeaderIconButton icon="chevron-back" onPress={() => { haptics.back(); router.back(); }} />
        <HeaderTitle>{t('setup.title')}</HeaderTitle>
        <HeaderSpacer />
      </ScreenHeader>

      <View style={responsiveContainer}>
        <ModeToggle mode={mode} onChange={setMode} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, responsiveContainer]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
      >
        <View style={isLandscape ? styles.grid : undefined}>
        {/* 1. Players (or Teams) */}
        {playersSection}

        {/* 2. Round flow — só individual com 3+ jogadores */}
        {showRoundFlowSection && (
          <View style={[styles.section, isLandscape && styles.sectionLandscape]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shuffle" size={20} color={GameColors.lavender} />
              <Text style={styles.sectionTitle}>{t('setup.roundFlow.title')}</Text>
            </View>
            <View style={styles.flowRow}>
              <Pressable
                style={[styles.flowCard, roundFlow === 'single-guess' && styles.flowCardActive]}
                onPress={() => {
                  if (roundFlow !== 'single-guess') haptics.selection();
                  setRoundFlow('single-guess');
                }}
              >
                <Ionicons
                  name="dice"
                  size={22}
                  color={roundFlow === 'single-guess' ? GameColors.accent : GameColors.textMuted}
                />
                <Text style={[styles.flowTitle, roundFlow === 'single-guess' && styles.flowTitleActive]}>
                  {t('setup.roundFlow.singleGuess')}
                </Text>
                <Text style={styles.flowDesc}>{t('setup.roundFlow.singleGuessDesc')}</Text>
              </Pressable>
              <Pressable
                style={[styles.flowCard, roundFlow === 'all-guess' && styles.flowCardActive]}
                onPress={() => {
                  if (roundFlow !== 'all-guess') haptics.selection();
                  setRoundFlow('all-guess');
                }}
              >
                <Ionicons
                  name="bulb"
                  size={22}
                  color={roundFlow === 'all-guess' ? GameColors.accent : GameColors.textMuted}
                />
                <Text style={[styles.flowTitle, roundFlow === 'all-guess' && styles.flowTitleActive]}>
                  {t('setup.roundFlow.allGuess')}
                </Text>
                <Text style={styles.flowDesc}>{t('setup.roundFlow.allGuessDesc')}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* 3. Scoring Target — only individual + (2 players OR single-guess) */}
        {showScoringToggle && (
          <View style={[styles.section, isLandscape && styles.sectionLandscape]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star-outline" size={20} color={GameColors.mint} />
              <Text style={styles.sectionTitle}>{t('setup.sections.scoringTarget')}</Text>
            </View>
            <View style={styles.scoringRow}>
              <Pressable
                style={[styles.scoringOption, scoringTarget === 'cluer' && styles.scoringOptionActive]}
                onPress={() => {
                  if (scoringTarget !== 'cluer') haptics.selection();
                  setScoringTarget('cluer');
                }}
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
                onPress={() => {
                  if (scoringTarget !== 'guesser') haptics.selection();
                  setScoringTarget('guesser');
                }}
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

        {/* All-guess scoring hint (replaces toggle) */}
        {showAllGuessHint && (
          <View style={[styles.section, styles.hintSection, isLandscape && styles.sectionLandscape]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle-outline" size={20} color={GameColors.mint} />
              <Text style={styles.sectionTitle}>{t('setup.sections.scoringTarget')}</Text>
            </View>
            <Text style={styles.hintText}>{t('setup.roundFlow.scoringHint')}</Text>
          </View>
        )}

        {/* 4. Winning Score */}
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

        {/* 5. Skips */}
        <View style={[styles.section, isLandscape && styles.sectionLandscape]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="play-skip-forward-outline" size={20} color={GameColors.sky} />
            <Text style={styles.sectionTitle}>
              {t('setup.sections.skipsPer', { target: mode === 'teams' ? t('common.labels.team') : t('common.labels.player') })}
            </Text>
          </View>
          <ChipSelector options={SKIP_OPTIONS} selected={skips} onSelect={setSkips} />
        </View>

        {/* 6. Time limits */}
        <View style={[styles.section, isLandscape && styles.sectionLandscape]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color={GameColors.coral} />
            <Text style={styles.sectionTitle}>{t('setup.sections.time')}</Text>
          </View>
          <Text style={styles.timeSubLabel}>{t('setup.time.clue')}</Text>
          <ChipSelector options={TIME_OPTIONS} selected={clueTimeLimit} onSelect={setClueTimeLimit} />
          <Text style={styles.timeSubLabel}>{t('setup.time.guess')}</Text>
          <ChipSelector options={TIME_OPTIONS} selected={guessTimeLimit} onSelect={setGuessTimeLimit} />
        </View>

        </View>

        {/* Bottom spacing for floating button and keyboard */}
        <View style={{ height: 140 + insets.bottom }} />
      </ScrollView>

      {/* Floating Play Button */}
      <View style={[styles.floatingButton, { paddingBottom: insets.bottom + 16 }]}>
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
  hintSection: {
    paddingVertical: 12,
  },
  hintText: {
    fontSize: 13,
    color: GameColors.textMuted,
    lineHeight: 18,
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
  flowRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flowCard: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: GameColors.surfaceLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  flowCardActive: {
    borderColor: GameColors.accent,
  },
  flowTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: GameColors.textMuted,
    letterSpacing: 0.4,
  },
  flowTitleActive: {
    color: GameColors.accent,
  },
  flowDesc: {
    fontSize: 11,
    color: GameColors.textMuted,
    lineHeight: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSubLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: GameColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
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
  individualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  individualNameInput: {
    flex: 1,
    backgroundColor: GameColors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: GameColors.text,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotOpen: {
    borderColor: GameColors.text,
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  paletteDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paletteDotSelected: {
    borderColor: GameColors.text,
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
    paddingTop: 12,
    backgroundColor: GameColors.background,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: GameColors.surface,
  },
});
