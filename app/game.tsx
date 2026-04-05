import { Confetti } from '@/components/confetti';
import { GameButton } from '@/components/game-button';
import { ScoreBoard } from '@/components/score-board';
import { SpectrumCard } from '@/components/spectrum-card';
import { WavelengthDial } from '@/components/wavelength-dial';
import { GameColors } from '@/constants/theme';
import { useSettings } from '@/contexts/settings-context';
import { useGameState } from '@/hooks/use-game-state';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useSharedValue,
    ZoomIn,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GameScreen() {
  const router = useRouter();
  const { settings } = useSettings();
  const game = useGameState(settings);
  const guessAngle = useSharedValue(90);
  const currentGuessRef = React.useRef(90);

  const handleGuessChange = useCallback((angle: number) => {
    currentGuessRef.current = angle;
  }, []);

  const { submitGuess, nextRound, startGame, submitClue, skipRound } = game;

  const handleSubmitGuess = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    submitGuess(currentGuessRef.current);
  }, [submitGuess]);

  const handleNextRound = useCallback(() => {
    guessAngle.value = 90;
    currentGuessRef.current = 90;
    nextRound();
  }, [nextRound, guessAngle]);

  const handleNewGame = useCallback(() => {
    guessAngle.value = 90;
    currentGuessRef.current = 90;
    startGame();
  }, [startGame, guessAngle]);

  const getScoreMessage = (score: number) => {
    switch (score) {
      case 4:
        return { text: 'PERFEITO! +4', color: GameColors.primary };
      case 3:
        return { text: 'QUASE LÁ! +3', color: GameColors.accent };
      case 2:
        return { text: 'NA ÁREA! +2', color: GameColors.yellow };
      default:
        return { text: 'ERROU! +0', color: GameColors.textMuted };
    }
  };

  const canSkip = settings.skipsPerPlayer === -1 ||
    (game.skipsRemaining[game.activeClueGiver === 1 ? 0 : 1] > 0);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    skipRound();
  }, [skipRound]);

  // Haptic feedback on result reveal
  useEffect(() => {
    if (game.phase === 'result') {
      if (game.lastRoundScore === 4) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (game.lastRoundScore >= 2) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } else if (game.phase === 'gameover') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [game.phase, game.lastRoundScore]);

  const winner =
    game.scores[0] >= settings.winningScore ? 1 : game.scores[1] >= settings.winningScore ? 2 : null;

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Shared score board props
  const scoreBoardProps = {
    scores: game.scores,
    activePlayer: (game.phase === 'guess' ? game.guesser : game.activeClueGiver) as 1 | 2,
    round: game.round,
    playerNames: game.sideNames,
    winningScore: settings.winningScore,
  } as const;

  return (
    <SafeAreaView style={styles.container}>
      <Confetti active={game.phase === 'result' && game.lastRoundScore === 4} />
      {/* Header — in landscape includes compact scoreboard */}
      <View style={isLandscape ? styles.landscapeHeader : styles.header}>
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
        <View style={styles.landscapeBody}>
          {/* CLUE */}
          {game.phase === 'clue' && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.landscapePhase}>
              <View style={styles.landscapeDialCol}>
                <WavelengthDial
                  targetAngle={game.targetAngle}
                  guessAngle={guessAngle}
                  showTarget={true}
                  interactive={false}
                  showGuess={false}
                />
                <SpectrumCard left={game.currentSpectrum.left} right={game.currentSpectrum.right} />
              </View>
              <View style={styles.landscapeControlCol}>
                <Text style={styles.landscapeTitle}>
                  {game.clueGiverLabel}, é sua vez!
                </Text>
                <Text style={styles.landscapeSubtitle}>Veja o alvo e pense em uma dica</Text>
                <Text style={styles.landscapeInstruction}>
                  Diga a dica em voz alta e passe o celular para {game.guesserLabel}
                </Text>
                <View style={styles.landscapeButtons}>
                  <GameButton title="PASSAR CELULAR" onPress={submitClue} />
                  {settings.skipsPerPlayer !== 0 && canSkip && (
                    <View style={{ marginTop: 8, alignItems: 'center' }}>
                      <GameButton title="PULAR" onPress={handleSkip} variant="secondary" />
                      <Text style={styles.skipCountText}>
                        {settings.skipsPerPlayer === -1
                          ? 'Pulos ilimitados'
                          : `${game.skipsRemaining[game.activeClueGiver === 1 ? 0 : 1]} pulo${game.skipsRemaining[game.activeClueGiver === 1 ? 0 : 1] !== 1 ? 's' : ''} restante${game.skipsRemaining[game.activeClueGiver === 1 ? 0 : 1] !== 1 ? 's' : ''}`}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>
          )}

          {/* GUESS */}
          {game.phase === 'guess' && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.landscapePhase}>
              <View style={styles.landscapeDialCol}>
                <WavelengthDial
                  targetAngle={game.targetAngle}
                  guessAngle={guessAngle}
                  showTarget={false}
                  interactive={true}
                  showGuess={true}
                  onGuessChange={handleGuessChange}
                />
                <SpectrumCard left={game.currentSpectrum.left} right={game.currentSpectrum.right} />
              </View>
              <View style={styles.landscapeControlCol}>
                <Text style={styles.landscapeTitle}>
                  {game.guesserLabel}, sua vez!
                </Text>
                <Text style={styles.landscapeSubtitle}>Arraste a agulha para onde acha que está a dica</Text>
                <View style={styles.landscapeButtons}>
                  <GameButton title="CONFIRMAR" onPress={handleSubmitGuess} color={GameColors.secondary} />
                </View>
              </View>
            </Animated.View>
          )}

          {/* RESULT */}
          {game.phase === 'result' && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.landscapePhase}>
              <View style={styles.landscapeDialCol}>
                <WavelengthDial
                  targetAngle={game.targetAngle}
                  guessAngle={guessAngle}
                  showTarget={true}
                  interactive={false}
                  showGuess={true}
                />
                <SpectrumCard left={game.currentSpectrum.left} right={game.currentSpectrum.right} />
              </View>
              <View style={styles.landscapeControlCol}>
                {(() => {
                  const msg = getScoreMessage(game.lastRoundScore);
                  return (
                    <Animated.Text
                      entering={ZoomIn.duration(500).springify()}
                      style={[styles.landscapeScoreAnnouncement, { color: msg.color }]}
                    >
                      {msg.text}
                    </Animated.Text>
                  );
                })()}
                <Text style={styles.resultDetail}>
                  Alvo: {game.targetAngle.toFixed(0)}° | Tentativa: {game.guessAngle.toFixed(0)}° | Diferença: {Math.abs(game.targetAngle - game.guessAngle).toFixed(0)}°
                </Text>
                <View style={styles.landscapeButtons}>
                  <GameButton title="PRÓXIMA RODADA" onPress={handleNextRound} />
                </View>
              </View>
            </Animated.View>
          )}

          {/* GAMEOVER */}
          {game.phase === 'gameover' && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.landscapePhase}>
              <View style={styles.landscapeGameOverLeft}>
                <Animated.View entering={ZoomIn.duration(600).springify()} style={styles.gameOverHeader}>
                  <Ionicons name="sparkles" size={22} color={GameColors.accent} />
                  <Text style={styles.landscapeGameOverTitle}>{winner ? game.sideNames[winner - 1].toUpperCase() : ''} VENCEU!</Text>
                  <Ionicons name="sparkles" size={22} color={GameColors.accent} />
                </Animated.View>
                <View style={styles.landscapeFinalScoreRow}>
                  <View style={styles.finalPlayerScore}>
                    <Text style={styles.finalPlayerName}>{game.sideNames[0]}</Text>
                    <Text style={[styles.landscapeFinalScore, winner === 1 && styles.winnerScore]}>{game.scores[0]}</Text>
                  </View>
                  <Text style={styles.finalVs}>×</Text>
                  <View style={styles.finalPlayerScore}>
                    <Text style={styles.finalPlayerName}>{game.sideNames[1]}</Text>
                    <Text style={[styles.landscapeFinalScore, winner === 2 && styles.winnerScore]}>{game.scores[1]}</Text>
                  </View>
                </View>
                <Text style={styles.roundsPlayed}>{game.round} rodadas jogadas</Text>
              </View>
              <View style={styles.landscapeControlCol}>
                <GameButton title="JOGAR NOVAMENTE" onPress={handleNewGame} />
                <View style={{ height: 10 }} />
                <GameButton title="VER HISTÓRICO" onPress={() => router.push({
                  pathname: '/history',
                  params: {
                    history: JSON.stringify(game.roundHistory),
                    playerNames: JSON.stringify(game.sideNames),
                    scores: JSON.stringify(game.scores),
                  },
                })} variant="secondary" />
                <View style={{ height: 10 }} />
                <GameButton title="MENU PRINCIPAL" onPress={() => router.back()} variant="secondary" />
              </View>
            </Animated.View>
          )}
        </View>
      ) : (
        /* ========== PORTRAIT LAYOUT (unchanged) ========== */
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {game.phase !== 'gameover' && <ScoreBoard {...scoreBoardProps} />}

          <View style={styles.content}>
            {game.phase === 'clue' && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.phaseContainer}>
                <Animated.Text entering={FadeInDown.delay(100)} style={styles.phaseTitle}>
                  {game.clueGiverLabel}, é sua vez!
                </Animated.Text>
                <Animated.Text entering={FadeInDown.delay(200)} style={styles.phaseSubtitle}>
                  Veja o alvo e pense em uma dica
                </Animated.Text>
                <View style={styles.dialSection}>
                  <WavelengthDial
                    targetAngle={game.targetAngle}
                    guessAngle={guessAngle}
                    showTarget={true}
                    interactive={false}
                    showGuess={false}
                  />
                </View>
                <SpectrumCard left={game.currentSpectrum.left} right={game.currentSpectrum.right} />
                <Animated.Text entering={FadeInUp.delay(400)} style={styles.instructionText}>
                  Diga a dica em voz alta e passe o celular para {game.guesserLabel}
                </Animated.Text>
                <View style={styles.buttonSection}>
                  <GameButton title="PASSAR CELULAR" onPress={submitClue} />
                  {settings.skipsPerPlayer !== 0 && canSkip && (
                    <View style={{ marginTop: 10, alignItems: 'center' }}>
                      <GameButton title="PULAR" onPress={handleSkip} variant="secondary" />
                      <Text style={styles.skipCountText}>
                        {settings.skipsPerPlayer === -1
                          ? 'Pulos ilimitados'
                          : `${game.skipsRemaining[game.activeClueGiver === 1 ? 0 : 1]} pulo${game.skipsRemaining[game.activeClueGiver === 1 ? 0 : 1] !== 1 ? 's' : ''} restante${game.skipsRemaining[game.activeClueGiver === 1 ? 0 : 1] !== 1 ? 's' : ''}`}
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            )}

            {game.phase === 'guess' && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.phaseContainer}>
                <Animated.Text entering={FadeInDown.delay(100)} style={styles.phaseTitle}>
                  {game.guesserLabel}, sua vez!
                </Animated.Text>
                <Animated.Text entering={FadeInDown.delay(200)} style={styles.phaseSubtitle}>
                  Arraste a agulha para onde acha que está a dica
                </Animated.Text>
                <View style={styles.dialSection}>
                  <WavelengthDial
                    targetAngle={game.targetAngle}
                    guessAngle={guessAngle}
                    showTarget={false}
                    interactive={true}
                    showGuess={true}
                    onGuessChange={handleGuessChange}
                  />
                </View>
                <SpectrumCard left={game.currentSpectrum.left} right={game.currentSpectrum.right} />
                <View style={styles.buttonSection}>
                  <GameButton title="CONFIRMAR" onPress={handleSubmitGuess} color={GameColors.secondary} />
                </View>
              </Animated.View>
            )}

            {game.phase === 'result' && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.phaseContainer}>
                {(() => {
                  const msg = getScoreMessage(game.lastRoundScore);
                  return (
                    <Animated.Text
                      entering={ZoomIn.duration(500).springify()}
                      style={[styles.scoreAnnouncement, { color: msg.color }]}
                    >
                      {msg.text}
                    </Animated.Text>
                  );
                })()}
                <View style={styles.dialSection}>
                  <WavelengthDial
                    targetAngle={game.targetAngle}
                    guessAngle={guessAngle}
                    showTarget={true}
                    interactive={false}
                    showGuess={true}
                  />
                </View>
                <SpectrumCard left={game.currentSpectrum.left} right={game.currentSpectrum.right} />
                <Animated.Text entering={FadeInUp.delay(300)} style={styles.resultDetail}>
                  Alvo: {game.targetAngle.toFixed(0)}° | Tentativa: {game.guessAngle.toFixed(0)}° | Diferença: {Math.abs(game.targetAngle - game.guessAngle).toFixed(0)}°
                </Animated.Text>
                <View style={styles.buttonSection}>
                  <GameButton title="PRÓXIMA RODADA" onPress={handleNextRound} />
                </View>
              </Animated.View>
            )}

            {game.phase === 'gameover' && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.phaseContainer}>
                <Animated.View entering={ZoomIn.duration(600).springify()} style={styles.gameOverHeader}>
                  <Ionicons name="sparkles" size={28} color={GameColors.accent} />
                  <Text style={styles.gameOverTitle}>{winner ? game.sideNames[winner - 1].toUpperCase() : ''} VENCEU!</Text>
                  <Ionicons name="sparkles" size={28} color={GameColors.accent} />
                </Animated.View>
                <View style={styles.finalScoreBlock}>
                  <Text style={styles.finalScoreLabel}>Placar Final</Text>
                  <View style={styles.finalScoreRow}>
                    <View style={styles.finalPlayerScore}>
                      <Text style={styles.finalPlayerName}>{game.sideNames[0]}</Text>
                      <Text style={[styles.finalScore, winner === 1 && styles.winnerScore]}>{game.scores[0]}</Text>
                    </View>
                    <Text style={styles.finalVs}>×</Text>
                    <View style={styles.finalPlayerScore}>
                      <Text style={styles.finalPlayerName}>{game.sideNames[1]}</Text>
                      <Text style={[styles.finalScore, winner === 2 && styles.winnerScore]}>{game.scores[1]}</Text>
                    </View>
                  </View>
                  <Text style={styles.roundsPlayed}>{game.round} rodadas jogadas</Text>
                </View>
                <View style={styles.buttonSection}>
                  <GameButton title="JOGAR NOVAMENTE" onPress={handleNewGame} />
                  <View style={{ height: 12 }} />
                  <GameButton title="VER HISTÓRICO" onPress={() => router.push({
                    pathname: '/history',
                    params: {
                      history: JSON.stringify(game.roundHistory),
                      playerNames: JSON.stringify(game.sideNames),
                      scores: JSON.stringify(game.scores),
                    },
                  })} variant="secondary" />
                  <View style={{ height: 12 }} />
                  <GameButton title="MENU PRINCIPAL" onPress={() => router.back()} variant="secondary" />
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
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 16,
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
    width: '55%',
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
});
