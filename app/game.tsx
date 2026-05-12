import { Confetti } from '@/components/confetti';
import { GameButton } from '@/components/game-button';
import { GameOverPodium } from '@/components/game-over-podium';
import { GuessSequenceBadge } from '@/components/guess-sequence-badge';
import { PassPhoneCard } from '@/components/pass-phone-card';
import { RoundResultsBreakdown } from '@/components/round-results-breakdown';
import { ScoreBoard } from '@/components/score-board';
import { SlotReel } from '@/components/slot-reel';
import { SpectrumCard } from '@/components/spectrum-card';
import { WavelengthDial, type PlayerMarker } from '@/components/wavelength-dial';
import { GameColors } from '@/constants/theme';
import { useSettings } from '@/contexts/settings-context';
import { rollRoles, useGameState } from '@/hooks/use-game-state';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  ZoomIn,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

function triggerHaptic(style: Haptics.ImpactFeedbackStyle) {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(style);
}

function triggerNotification(type: Haptics.NotificationFeedbackType) {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(type);
}

export default function GameScreen() {
  const router = useRouter();
  const { settings, effectiveLanguage } = useSettings();
  const { t } = useTranslation();
  const game = useGameState(settings, effectiveLanguage);
  const guessAngle = useSharedValue(90);
  const currentGuessRef = React.useRef(90);
  const { isLandscape, isTablet, scale, containerMaxWidth, dialSize } = useResponsiveLayout();

  const handleGuessChange = useCallback((angle: number) => {
    currentGuessRef.current = angle;
  }, []);

  const { submitGuess, nextRound, startGame, submitClue, skipRound, dismissPass, rollRoles: rollRolesAction } = game;

  const resetDial = useCallback(() => {
    guessAngle.value = 90;
    currentGuessRef.current = 90;
  }, [guessAngle]);

  const handleSubmitGuess = useCallback(() => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    submitGuess(currentGuessRef.current);
  }, [submitGuess]);

  const handleNextRound = useCallback(() => {
    resetDial();
    nextRound();
  }, [nextRound, resetDial]);

  const handleNewGame = useCallback(() => {
    resetDial();
    startGame();
  }, [startGame, resetDial]);

  const handleDismissPass = useCallback(() => {
    resetDial();
    dismissPass();
  }, [dismissPass, resetDial]);

  const getScoreMessage = (score: number) => {
    switch (score) {
      case 4:
        return { text: t('game.result.perfect'), color: GameColors.primary };
      case 3:
        return { text: t('game.result.close'), color: GameColors.accent };
      case 2:
        return { text: t('game.result.near'), color: GameColors.yellow };
      default:
        return { text: t('game.result.miss'), color: GameColors.textMuted };
    }
  };

  const cluerSkipIdx = game.activeSideIndex;
  const skipCount = game.skipsRemaining[cluerSkipIdx] ?? 0;
  const canSkip = settings.skipsPerPlayer === -1 || skipCount > 0;

  const handleSkip = useCallback(() => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    skipRound();
  }, [skipRound]);

  // Haptic feedback on result reveal
  useEffect(() => {
    if (game.phase === 'result') {
      if (game.lastRoundScore === 4) {
        triggerNotification(Haptics.NotificationFeedbackType.Success);
      } else if (game.lastRoundScore >= 2) {
        triggerNotification(Haptics.NotificationFeedbackType.Warning);
      } else {
        triggerNotification(Haptics.NotificationFeedbackType.Error);
      }
    } else if (game.phase === 'gameover') {
      triggerNotification(Haptics.NotificationFeedbackType.Success);
    }
  }, [game.phase, game.lastRoundScore]);

  // SELECTION: roll roles once per round entry — computed during render so SlotReel
  // gets the right targetIndex on the first frame.
  const rolled = React.useRef<{ cluer: number; guesser: number; key: number } | null>(null);
  const [reelsSettled, setReelsSettled] = React.useState({ cluer: false, guesser: false });

  if (game.phase === 'selection') {
    if (rolled.current?.key !== game.round) {
      rolled.current = { ...rollRoles(game.playCounts), key: game.round };
    }
  } else if (rolled.current !== null) {
    rolled.current = null;
  }

  useEffect(() => {
    setReelsSettled({ cluer: false, guesser: false });
  }, [game.phase, game.round]);

  const handleSelectionConfirm = useCallback(() => {
    if (!rolled.current) return;
    rollRolesAction(rolled.current.cluer, rolled.current.guesser);
  }, [rollRolesAction]);

  const onCluerReelSettled = useCallback(() => setReelsSettled((s) => ({ ...s, cluer: true })), []);
  const onGuesserReelSettled = useCallback(() => setReelsSettled((s) => ({ ...s, guesser: true })), []);

  // Multi-guess: build markers for the dial in result phase
  const resultMarkers: PlayerMarker[] = useMemo(() => {
    if (game.phase !== 'result') return [];
    if (game.roundGuesses.length <= 1) return [];
    return game.roundGuesses.map((g) => ({
      angle: g.angle,
      color: game.playerColors[g.playerIndex] ?? GameColors.accent,
      name: game.playerNames[g.playerIndex] ?? '',
    }));
  }, [game.phase, game.roundGuesses, game.playerColors, game.playerNames]);

  const isMultiGuessResult = resultMarkers.length > 0;
  const lastRoundRecord = game.roundHistory[game.roundHistory.length - 1];
  const cluerBonus = lastRoundRecord?.cluerBonus ?? 0;
  const cluerName = game.playerNames[game.activeSideIndex] ?? '';
  const cluerColor = game.playerColors[game.activeSideIndex] ?? GameColors.accent;

  // Winner detection — tiebreaker: lower avg diff (more precise)
  const winnerIndex = useMemo(() => {
    if (game.phase !== 'gameover') return -1;
    let best = -1;
    let bestScore = -1;
    let bestDiff = Number.POSITIVE_INFINITY;
    for (let i = 0; i < game.scores.length; i++) {
      const s = game.scores[i];
      const d = game.avgDiffs[i] ?? Number.POSITIVE_INFINITY;
      if (s > bestScore || (s === bestScore && d < bestDiff)) {
        bestScore = s;
        bestDiff = d;
        best = i;
      }
    }
    return best;
  }, [game.phase, game.scores, game.avgDiffs]);

  const usePodium = game.gameMode === 'individual' && game.playerNames.length >= 3;

  const scoreBoardProps = {
    scores: game.scores,
    activeSideIndex:
      game.phase === 'guess' || game.phase === 'pass'
        ? game.currentGuesserIndex ?? game.activeSideIndex
        : game.activeSideIndex,
    round: game.round,
    sideNames: game.sideNames,
    sideColors: game.sideColors,
    winningScore: settings.winningScore,
  } as const;

  const responsiveContainer = isTablet ? {
    maxWidth: containerMaxWidth,
    alignSelf: 'center' as const,
    width: '100%' as const,
  } : undefined;

  // SELECTION phase — full-screen, both layouts
  if (game.phase === 'selection') {
    const cluerTarget = rolled.current?.cluer ?? 0;
    const guesserTarget = rolled.current?.guesser ?? 0;
    const bothSettled = reelsSettled.cluer && reelsSettled.guesser;
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, responsiveContainer]}>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="close" size={20} color={GameColors.textMuted} />
          </Pressable>
        </View>
        <Animated.View entering={FadeIn.duration(300)} style={[styles.selectionContainer, responsiveContainer]}>
          <Text style={styles.selectionTitle}>{t('game.selection.title')}</Text>
          <View style={styles.selectionReels}>
            <SlotReel
              names={game.playerNames}
              colors={game.playerColors}
              targetIndex={cluerTarget}
              label={t('game.selection.cluerLabel')}
              duration={2200}
              onSettled={onCluerReelSettled}
            />
            <SlotReel
              names={game.playerNames}
              colors={game.playerColors}
              targetIndex={guesserTarget}
              label={t('game.selection.guesserLabel')}
              duration={2900}
              onSettled={onGuesserReelSettled}
            />
          </View>
          <View style={styles.selectionCtaSlot}>
            {bothSettled && (
              <Animated.View entering={FadeInDown.duration(280)}>
                <GameButton title={t('game.selection.letsGo')} onPress={handleSelectionConfirm} />
              </Animated.View>
            )}
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // PASS phone overlay (between guessers in multi-guess)
  const showPassOverlay = game.phase === 'pass' && game.currentGuesserIndex != null;

  return (
    <SafeAreaView style={styles.container}>
      <Confetti
        active={
          game.phase === 'result' &&
          (game.lastRoundScore === 4 || game.roundGuesses.some((g) => g.score === 4))
        }
      />

      {showPassOverlay && (
        <PassPhoneCard
          name={game.playerNames[game.currentGuesserIndex!] ?? ''}
          color={game.playerColors[game.currentGuesserIndex!] ?? GameColors.accent}
          ctaLabel={t('game.guess.imHere')}
          message={t('game.guess.passLabel')}
          onPress={handleDismissPass}
        />
      )}

      {/* Header — in landscape includes compact scoreboard */}
      <View style={[isLandscape ? styles.landscapeHeader : styles.header, responsiveContainer]}>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={20} color={GameColors.textMuted} />
        </Pressable>
        {isLandscape && game.phase !== 'gameover' && (
          <View style={styles.landscapeScoreWrap}>
            <ScoreBoard {...scoreBoardProps} compact />
          </View>
        )}
      </View>

      {isLandscape ? (
        /* ========== LANDSCAPE LAYOUT ========== */
        <View style={[styles.landscapeBody, responsiveContainer]}>
          {game.phase === 'clue' && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.landscapePhase}>
              <View style={styles.landscapeDialCol}>
                <WavelengthDial
                  targetAngle={game.targetAngle}
                  guessAngle={guessAngle}
                  showTarget
                  interactive={false}
                  showGuess={false}
                  size={dialSize}
                />
                <SpectrumCard left={game.currentSpectrum.left} right={game.currentSpectrum.right} />
              </View>
              <View style={styles.landscapeControlCol}>
                <Text style={[styles.landscapeTitle, { fontSize: 18 * scale }]}>
                  {t('game.turn.clue', { name: game.clueGiverLabel })}
                </Text>
                <Text style={styles.landscapeSubtitle}>{t('game.clue.subtitle')}</Text>
                <Text style={styles.landscapeInstruction}>
                  {t('game.clue.instruction', { name: game.guesserLabel })}
                </Text>
                <View style={styles.landscapeButtons}>
                  <GameButton title={t('common.actions.passPhone')} onPress={submitClue} />
                  {settings.skipsPerPlayer !== 0 && canSkip && (
                    <View style={{ marginTop: 8, alignItems: 'center' }}>
                      <GameButton title={t('common.actions.skip')} onPress={handleSkip} variant="secondary" />
                      <Text style={styles.skipCountText}>
                        {settings.skipsPerPlayer === -1
                          ? t('game.skip.unlimited')
                          : t('game.skip.remaining', { count: skipCount })}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>
          )}

          {game.phase === 'guess' && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.landscapePhase}>
              <View style={styles.landscapeDialCol}>
                <WavelengthDial
                  targetAngle={game.targetAngle}
                  guessAngle={guessAngle}
                  showTarget={false}
                  interactive
                  showGuess
                  onGuessChange={handleGuessChange}
                  size={dialSize}
                />
                <SpectrumCard left={game.currentSpectrum.left} right={game.currentSpectrum.right} />
              </View>
              <View style={styles.landscapeControlCol}>
                {game.guessSequence && (
                  <GuessSequenceBadge
                    current={game.guessSequence.current}
                    total={game.guessSequence.total}
                    color={game.playerColors[game.currentGuesserIndex ?? 0] ?? GameColors.accent}
                  />
                )}
                <Text style={[styles.landscapeTitle, { fontSize: 18 * scale }]}>
                  {t('game.turn.guess', { name: game.guesserLabel })}
                </Text>
                <Text style={styles.landscapeSubtitle}>{t('game.guess.subtitle')}</Text>
                <View style={styles.landscapeButtons}>
                  <GameButton title={t('common.actions.confirm')} onPress={handleSubmitGuess} color={GameColors.secondary} />
                </View>
              </View>
            </Animated.View>
          )}

          {game.phase === 'result' && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.landscapePhase}>
              <View style={styles.landscapeDialCol}>
                <WavelengthDial
                  targetAngle={game.targetAngle}
                  guessAngle={guessAngle}
                  showTarget
                  interactive={false}
                  showGuess={!isMultiGuessResult}
                  size={dialSize}
                  playerMarkers={resultMarkers}
                />
                <SpectrumCard left={game.currentSpectrum.left} right={game.currentSpectrum.right} />
              </View>
              <View style={styles.landscapeControlCol}>
                {isMultiGuessResult ? (
                  <ScrollView style={styles.breakdownScroll} contentContainerStyle={{ gap: 6 }}>
                    <RoundResultsBreakdown
                      guesses={game.roundGuesses}
                      playerNames={game.playerNames}
                      playerColors={game.playerColors}
                      cluerBonus={cluerBonus}
                      cluerName={cluerName}
                      cluerColor={cluerColor}
                      bonusLabel={cluerBonus > 0 ? t('game.result.cluerBonus', { count: cluerBonus }) : undefined}
                    />
                  </ScrollView>
                ) : (
                  <>
                    {(() => {
                      const msg = getScoreMessage(game.lastRoundScore);
                      return (
                        <Animated.Text
                          entering={ZoomIn.duration(500).springify()}
                          style={[styles.landscapeScoreAnnouncement, { color: msg.color, fontSize: 28 * scale }]}
                        >
                          {msg.text}
                        </Animated.Text>
                      );
                    })()}
                    <Text style={styles.resultDetail}>
                      {t('game.result.details', {
                        target: game.targetAngle.toFixed(0),
                        guess: game.guessAngle.toFixed(0),
                        difference: Math.abs(game.targetAngle - game.guessAngle).toFixed(0),
                      })}
                    </Text>
                  </>
                )}
                <View style={styles.landscapeButtons}>
                  <GameButton title={t('common.actions.nextRound')} onPress={handleNextRound} />
                </View>
              </View>
            </Animated.View>
          )}

          {game.phase === 'gameover' && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.landscapePhase}>
              <View style={styles.landscapeGameOverLeft}>
                <Animated.View entering={ZoomIn.duration(600).springify()} style={styles.gameOverHeader}>
                  <Ionicons name="sparkles" size={22} color={GameColors.accent} />
                  <Text style={styles.landscapeGameOverTitle}>
                    {winnerIndex >= 0 ? t('game.gameOver.won', { name: game.sideNames[winnerIndex]?.toUpperCase() ?? '' }) : ''}
                  </Text>
                  <Ionicons name="sparkles" size={22} color={GameColors.accent} />
                </Animated.View>
                {usePodium ? (
                  <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 6 }}>
                    <GameOverPodium
                      names={game.playerNames}
                      colors={game.playerColors}
                      scores={game.scores}
                      avgDiffs={game.avgDiffs}
                      labels={{
                        first: t('game.gameOver.podium.first'),
                        second: t('game.gameOver.podium.second'),
                        third: t('game.gameOver.podium.third'),
                        ranking: t('game.gameOver.podium.ranking'),
                      }}
                    />
                  </ScrollView>
                ) : (
                  <View style={styles.landscapeFinalScoreRow}>
                    <View style={styles.finalPlayerScore}>
                      <Text style={styles.finalPlayerName}>{game.sideNames[0]}</Text>
                      <Text style={[styles.landscapeFinalScore, winnerIndex === 0 && styles.winnerScore]}>{game.scores[0]}</Text>
                    </View>
                    <Text style={styles.finalVs}>×</Text>
                    <View style={styles.finalPlayerScore}>
                      <Text style={styles.finalPlayerName}>{game.sideNames[1]}</Text>
                      <Text style={[styles.landscapeFinalScore, winnerIndex === 1 && styles.winnerScore]}>{game.scores[1]}</Text>
                    </View>
                  </View>
                )}
                <Text style={styles.roundsPlayed}>{t('game.gameOver.roundsPlayed', { count: game.round })}</Text>
              </View>
              <View style={[styles.landscapeControlCol, styles.buttonStack]}>
                <GameButton fullWidth title={t('common.actions.playAgain')} onPress={handleNewGame} />
                <View style={{ height: 10 }} />
                <GameButton fullWidth title={t('common.actions.viewHistory')} onPress={() => router.push({
                  pathname: '/history',
                  params: {
                    history: JSON.stringify(game.roundHistory),
                    playerNames: JSON.stringify(game.sideNames),
                    scores: JSON.stringify(game.scores),
                  },
                })} variant="secondary" />
                <View style={{ height: 10 }} />
                <GameButton fullWidth title={t('common.actions.mainMenu')} onPress={() => router.back()} variant="secondary" />
              </View>
            </Animated.View>
          )}
        </View>
      ) : (
        /* ========== PORTRAIT LAYOUT ========== */
        <ScrollView
          contentContainerStyle={[styles.scrollContent, responsiveContainer]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {game.phase !== 'gameover' && <ScoreBoard {...scoreBoardProps} />}

          <View style={styles.content}>
            {game.phase === 'clue' && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.phaseContainer}>
                <Animated.Text entering={FadeInDown.delay(100)} style={[styles.phaseTitle, { fontSize: 22 * scale }]}>
                  {t('game.turn.clue', { name: game.clueGiverLabel })}
                </Animated.Text>
                <Animated.Text entering={FadeInDown.delay(200)} style={styles.phaseSubtitle}>
                  {t('game.clue.subtitle')}
                </Animated.Text>
                <View style={styles.dialSection}>
                  <WavelengthDial
                    targetAngle={game.targetAngle}
                    guessAngle={guessAngle}
                    showTarget
                    interactive={false}
                    showGuess={false}
                    size={dialSize}
                  />
                </View>
                <SpectrumCard left={game.currentSpectrum.left} right={game.currentSpectrum.right} />
                <Animated.Text entering={FadeInUp.delay(400)} style={styles.instructionText}>
                  {t('game.clue.instruction', { name: game.guesserLabel })}
                </Animated.Text>
                <View style={styles.buttonSection}>
                  <GameButton title={t('common.actions.passPhone')} onPress={submitClue} />
                  {settings.skipsPerPlayer !== 0 && canSkip && (
                    <View style={{ marginTop: 10, alignItems: 'center' }}>
                      <GameButton title={t('common.actions.skip')} onPress={handleSkip} variant="secondary" />
                      <Text style={styles.skipCountText}>
                        {settings.skipsPerPlayer === -1
                          ? t('game.skip.unlimited')
                          : t('game.skip.remaining', { count: skipCount })}
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            )}

            {game.phase === 'guess' && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.phaseContainer}>
                {game.guessSequence && (
                  <GuessSequenceBadge
                    current={game.guessSequence.current}
                    total={game.guessSequence.total}
                    color={game.playerColors[game.currentGuesserIndex ?? 0] ?? GameColors.accent}
                  />
                )}
                <Animated.Text entering={FadeInDown.delay(100)} style={[styles.phaseTitle, { fontSize: 22 * scale }]}>
                  {t('game.turn.guess', { name: game.guesserLabel })}
                </Animated.Text>
                <Animated.Text entering={FadeInDown.delay(200)} style={styles.phaseSubtitle}>
                  {t('game.guess.subtitle')}
                </Animated.Text>
                <View style={styles.dialSection}>
                  <WavelengthDial
                    targetAngle={game.targetAngle}
                    guessAngle={guessAngle}
                    showTarget={false}
                    interactive
                    showGuess
                    onGuessChange={handleGuessChange}
                    size={dialSize}
                  />
                </View>
                <SpectrumCard left={game.currentSpectrum.left} right={game.currentSpectrum.right} />
                <View style={styles.buttonSection}>
                  <GameButton title={t('common.actions.confirm')} onPress={handleSubmitGuess} color={GameColors.secondary} />
                </View>
              </Animated.View>
            )}

            {game.phase === 'result' && (
              <Animated.View entering={FadeIn.duration(400)} style={[styles.phaseContainer, styles.phaseContainerResult]}>
                {!isMultiGuessResult && (() => {
                  const msg = getScoreMessage(game.lastRoundScore);
                  return (
                    <Animated.Text
                      entering={ZoomIn.duration(500).springify()}
                      style={[styles.scoreAnnouncement, { color: msg.color, fontSize: 36 * scale }]}
                    >
                      {msg.text}
                    </Animated.Text>
                  );
                })()}
                <View style={styles.dialSection}>
                  <WavelengthDial
                    targetAngle={game.targetAngle}
                    guessAngle={guessAngle}
                    showTarget
                    interactive={false}
                    showGuess={!isMultiGuessResult}
                    size={dialSize}
                    playerMarkers={resultMarkers}
                  />
                </View>
                <SpectrumCard left={game.currentSpectrum.left} right={game.currentSpectrum.right} />
                {isMultiGuessResult ? (
                  <RoundResultsBreakdown
                    guesses={game.roundGuesses}
                    playerNames={game.playerNames}
                    playerColors={game.playerColors}
                    cluerBonus={cluerBonus}
                    cluerName={cluerName}
                    cluerColor={cluerColor}
                    bonusLabel={cluerBonus > 0 ? t('game.result.cluerBonus', { count: cluerBonus }) : undefined}
                  />
                ) : (
                  <Animated.Text entering={FadeInUp.delay(300)} style={styles.resultDetail}>
                    {t('game.result.details', {
                      target: game.targetAngle.toFixed(0),
                      guess: game.guessAngle.toFixed(0),
                      difference: Math.abs(game.targetAngle - game.guessAngle).toFixed(0),
                    })}
                  </Animated.Text>
                )}
                <View style={styles.buttonSection}>
                  <GameButton title={t('common.actions.nextRound')} onPress={handleNextRound} />
                </View>
              </Animated.View>
            )}

            {game.phase === 'gameover' && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.phaseContainer}>
                <Animated.View entering={ZoomIn.duration(600).springify()} style={styles.gameOverHeader}>
                  <Ionicons name="sparkles" size={28} color={GameColors.accent} />
                  <Text style={[styles.gameOverTitle, { fontSize: 28 * scale }]}>
                    {winnerIndex >= 0 ? t('game.gameOver.won', { name: game.sideNames[winnerIndex]?.toUpperCase() ?? '' }) : ''}
                  </Text>
                  <Ionicons name="sparkles" size={28} color={GameColors.accent} />
                </Animated.View>
                {usePodium ? (
                  <GameOverPodium
                    names={game.playerNames}
                    colors={game.playerColors}
                    scores={game.scores}
                    labels={{
                      first: t('game.gameOver.podium.first'),
                      second: t('game.gameOver.podium.second'),
                      third: t('game.gameOver.podium.third'),
                      ranking: t('game.gameOver.podium.ranking'),
                    }}
                  />
                ) : (
                  <View style={styles.finalScoreBlock}>
                    <Text style={styles.finalScoreLabel}>{t('game.gameOver.finalScore')}</Text>
                    <View style={styles.finalScoreRow}>
                      <View style={styles.finalPlayerScore}>
                        <Text style={styles.finalPlayerName}>{game.sideNames[0]}</Text>
                        <Text style={[styles.finalScore, winnerIndex === 0 && styles.winnerScore]}>{game.scores[0]}</Text>
                      </View>
                      <Text style={styles.finalVs}>×</Text>
                      <View style={styles.finalPlayerScore}>
                        <Text style={styles.finalPlayerName}>{game.sideNames[1]}</Text>
                        <Text style={[styles.finalScore, winnerIndex === 1 && styles.winnerScore]}>{game.scores[1]}</Text>
                      </View>
                    </View>
                  </View>
                )}
                <Text style={styles.roundsPlayed}>{t('game.gameOver.roundsPlayed', { count: game.round })}</Text>
                <View style={styles.buttonStack}>
                  <GameButton fullWidth title={t('common.actions.playAgain')} onPress={handleNewGame} />
                  <View style={{ height: 12 }} />
                  <GameButton fullWidth title={t('common.actions.viewHistory')} onPress={() => router.push({
                    pathname: '/history',
                    params: {
                      history: JSON.stringify(game.roundHistory),
                      playerNames: JSON.stringify(game.sideNames),
                      scores: JSON.stringify(game.scores),
                    },
                  })} variant="secondary" />
                  <View style={{ height: 12 }} />
                  <GameButton fullWidth title={t('common.actions.mainMenu')} onPress={() => router.back()} variant="secondary" />
                </View>
              </Animated.View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.background,
  },
  // ===== Portrait =====
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 14,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GameColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minHeight: 400,
  },
  scrollContent: {
    flexGrow: 1,
  },
  phaseContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 48,
    gap: 12,
  },
  phaseContainerResult: {
    paddingTop: 16,
  },
  phaseTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: GameColors.text,
    textAlign: 'center',
  },
  phaseSubtitle: {
    fontSize: 14,
    color: GameColors.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  dialSection: {
    marginVertical: 8,
  },
  instructionText: {
    fontSize: 13,
    color: GameColors.accent,
    textAlign: 'center',
    fontWeight: '600',
    fontStyle: 'italic',
    paddingHorizontal: 20,
    marginTop: 4,
  },
  buttonSection: {
    marginTop: 12,
    alignItems: 'center',
  },
  buttonStack: {
    marginTop: 12,
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  scoreAnnouncement: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2,
  },
  resultDetail: {
    fontSize: 12,
    color: GameColors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  gameOverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  gameOverTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: GameColors.accent,
    textAlign: 'center',
    letterSpacing: 1,
    flexShrink: 1,
  },
  finalScoreBlock: {
    backgroundColor: GameColors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    marginVertical: 16,
  },
  finalScoreLabel: {
    fontSize: 12,
    color: GameColors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  finalScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  finalPlayerScore: {
    alignItems: 'center',
  },
  finalPlayerName: {
    fontSize: 14,
    color: GameColors.textMuted,
    fontWeight: '600',
    marginBottom: 4,
  },
  finalScore: {
    fontSize: 48,
    fontWeight: '900',
    color: GameColors.text,
  },
  winnerScore: {
    color: GameColors.accent,
  },
  finalVs: {
    fontSize: 24,
    color: GameColors.textMuted,
    fontWeight: '700',
  },
  roundsPlayed: {
    fontSize: 13,
    color: GameColors.textMuted,
    marginTop: 12,
  },
  skipCountText: {
    fontSize: 11,
    color: GameColors.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  // ===== Landscape =====
  landscapeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 20,
    paddingBottom: 4,
    gap: 4,
  },
  landscapeScoreWrap: {
    flex: 1,
  },
  landscapeBody: {
    flex: 1,
  },
  landscapePhase: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 20,
  },
  landscapeDialCol: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  landscapeControlCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  landscapeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: GameColors.text,
    textAlign: 'center',
  },
  landscapeSubtitle: {
    fontSize: 12,
    color: GameColors.textMuted,
    textAlign: 'center',
  },
  landscapeInstruction: {
    fontSize: 12,
    color: GameColors.accent,
    textAlign: 'center',
    fontWeight: '600',
    fontStyle: 'italic',
    paddingHorizontal: 12,
  },
  landscapeButtons: {
    marginTop: 6,
    alignItems: 'center',
  },
  landscapeScoreAnnouncement: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2,
  },
  landscapeGameOverLeft: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  landscapeGameOverTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: GameColors.accent,
    textAlign: 'center',
    letterSpacing: 1,
  },
  landscapeFinalScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  landscapeFinalScore: {
    fontSize: 36,
    fontWeight: '900',
    color: GameColors.text,
  },
  breakdownScroll: {
    width: '100%',
    maxHeight: 200,
  },
  // ===== Selection =====
  selectionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    // Header above us is ~70px tall — pad the bottom by the same amount so the
    // visual center of this flex container lines up with the center of the screen.
    paddingBottom: 70,
  },
  selectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: GameColors.text,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 24,
  },
  selectionReels: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    width: '100%',
    maxWidth: 440,
  },
  selectionCtaSlot: {
    minHeight: 80,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
});
