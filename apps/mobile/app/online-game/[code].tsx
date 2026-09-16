// Online multiplayer game screen. Renders state owned by the PartyKit
// server (via NetworkContext) instead of a local reducer. Each client
// shows a different view depending on whether it's the cluer or a
// guesser for the current round.
//
// Flow per phase:
//   clue   — cluer: see target on dial + clue input/button; others: waiting card
//   guess  — cluer: see "X/Y guesses in" status; guessers: dial + submit
//   result — everyone: dial w/ all guesses + target revealed + READY_NEXT button
//   gameover — winner reveal + back to menu
//
// `pass` and `selection` phases never reach this screen — the server
// collapses them before broadcasting.

import spectrumsEN from '@/data/spectrums.en.json';
import spectrumsES from '@/data/spectrums.es.json';
import spectrumsPtBR from '@/data/spectrums.pt-BR.json';
import { useSettings } from '@/contexts/settings-context';
import { buildSpectrumPool, type Spectrum } from '@sintonia/game-core';
import { AloneRoomModal } from '@/components/alone-room-modal';
import { ConnectionStatusBanner } from '@/components/connection-status-banner';
import { DeadlinePill } from '@/components/deadline-pill';
import { GameButton } from '@/components/game-button';
import { GameOverPodium } from '@/components/game-over-podium';
import { HeaderIconButton, HeaderTitle, ScreenHeader } from '@/components/screen-header';
import { ScoreBoard } from '@/components/score-board';
import { SpectrumCard } from '@/components/spectrum-card';
import { WavelengthDial, type PlayerMarker } from '@/components/wavelength-dial';
import { GameColors } from '@/constants/theme';
import { useNetwork } from '@/contexts/network-context';
import { haptics } from '@/lib/haptics';
import { normalizeRoomCode } from '@/lib/room-codes';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useSharedValue, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

function getBaseSpectrums(language: string): Spectrum[] {
  if (language === 'en') return spectrumsEN;
  if (language === 'es') return spectrumsES;
  return spectrumsPtBR;
}

export default function OnlineGameScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ code?: string }>();
  const code = normalizeRoomCode(params.code ?? '');

  const { state, privateTargetAngle, playerId, send, lastError, disconnect, roomClosure, clearRoomClosure } = useNetwork();
  const { settings, effectiveLanguage } = useSettings();
  const guessAngle = useSharedValue(90);
  const currentGuessRef = useRef(90);
  const [clueDraft, setClueDraft] = useState('');

  // Sync the dial's shared value to the right angle for the current phase:
  // - guess phase: reset to center so the guesser starts at 90°
  // - result/gameover with a single guess: snap to the actual submitted angle
  //   so the cluer's view shows where the guesser landed (vs. stuck at center).
  const roundKey = `${state?.roundNumber ?? 0}-${state?.phase ?? ''}`;
  useLayoutEffect(() => {
    if (state?.phase === 'guess') {
      guessAngle.value = 90;
      currentGuessRef.current = 90;
    } else if (
      (state?.phase === 'result' || state?.phase === 'gameover') &&
      state.round?.guesses?.length === 1
    ) {
      const single = state.round.guesses[0].angle;
      guessAngle.value = single;
      currentGuessRef.current = single;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey]);

  // Clear draft when round changes
  useEffect(() => {
    setClueDraft('');
  }, [state?.roundNumber]);

  // If room state vanishes (disconnect, etc.) bounce back.
  useEffect(() => {
    if (!state) return;
    if (state.phase === 'lobby') {
      // Server reset back to lobby for some reason — let lobby screen handle it.
      router.replace({ pathname: '/lobby/[code]', params: { code } });
    }
  }, [state?.phase, code, router, state]);

  // Transient command-validation errors (NOT_YOUR_TURN, BAD_REQUEST) — the
  // ConnectionStatusBanner handles connection-level errors; we surface only
  // truly fatal ones via Alert here.
  useEffect(() => {
    if (!lastError) return;
    const fatal = ['NOT_IN_GAME', 'INTERNAL'];
    if (!fatal.includes(lastError.code)) return;
    Alert.alert(t('onlineGame.alerts.erro'), lastError.message);
  }, [lastError, t]);

  const handleGuessChange = useCallback((angle: number) => {
    currentGuessRef.current = angle;
  }, []);

  const meForLeave = state?.players.find((p) => p.id === playerId);
  const isHostForLeave = !!meForLeave?.isHost;

  const handleLeave = useCallback(() => {
    haptics.back();
    if (isHostForLeave) {
      Alert.alert(
        t('onlineGame.alerts.encerrarPartida.title'),
        t('onlineGame.alerts.encerrarPartida.body'),
        [
          { text: t('onlineGame.alerts.cancelar'), style: 'cancel' },
          {
            text: t('onlineGame.alerts.encerrarPartida.confirm'),
            style: 'destructive',
            onPress: () => {
              send({ type: 'CLOSE_ROOM' });
              disconnect();
              router.replace('/');
            },
          },
        ],
      );
      return;
    }
    Alert.alert(
      t('onlineGame.alerts.sairPartida.title'),
      t('onlineGame.alerts.sairPartida.body'),
      [
        { text: t('onlineGame.alerts.cancelar'), style: 'cancel' },
        {
          text: t('onlineGame.alerts.sairPartida.confirm'),
          style: 'destructive',
          onPress: () => {
            disconnect();
            router.replace('/');
          },
        },
      ],
    );
  }, [isHostForLeave, send, disconnect, router, t]);

  // Room closure / kick notice. Host caused-closure → swallow silently.
  // Kicked → "host removed you". Guest seeing host close → "room closed".
  useEffect(() => {
    if (!roomClosure) return;
    if (roomClosure.reason === 'host' && isHostForLeave) {
      clearRoomClosure();
      return;
    }
    const titleKey =
      roomClosure.reason === 'kicked'
        ? 'onlineGame.alerts.kicked.title'
        : 'onlineGame.alerts.salaEncerrada.title';
    const bodyKey =
      roomClosure.reason === 'kicked'
        ? 'onlineGame.alerts.kicked.body'
        : 'onlineGame.alerts.salaEncerrada.body';
    Alert.alert(
      t(titleKey),
      t(bodyKey),
      [{ text: t('onlineGame.alerts.ok'), onPress: () => { clearRoomClosure(); router.replace('/'); } }],
    );
  }, [roomClosure, isHostForLeave, clearRoomClosure, router, t]);

  // Hard timeout on the "Conectando..." screen. If `state` doesn't arrive
  // within this window, the room is probably dead (server lost it after a
  // deploy, app cold-started directly into this route, etc.). Bounce home
  // with an alert instead of leaving the player staring at a frozen screen.
  useEffect(() => {
    if (state) return;
    const id = setTimeout(() => {
      if (state) return;
      Alert.alert(
        t('onlineGame.alerts.timeout.title'),
        t('onlineGame.alerts.timeout.body'),
        [{ text: t('onlineGame.alerts.ok'), onPress: () => { disconnect(); router.replace('/'); } }],
      );
    }, 12_000);
    return () => clearTimeout(id);
  }, [state, disconnect, router, t]);

  const handleClueSaid = useCallback(() => {
    haptics.submitClue();
    send({ type: 'CLUE_SAID' });
  }, [send]);

  const handleSkipCard = useCallback(() => {
    haptics.skip();
    send({ type: 'SKIP_CARD' });
  }, [send]);

  const handleSubmitClueText = useCallback(() => {
    const text = clueDraft.trim();
    if (!text) return;
    haptics.submitClue();
    send({ type: 'SUBMIT_CLUE_TEXT', text });
  }, [send, clueDraft]);

  const handleSubmitGuess = useCallback(() => {
    haptics.submitGuess();
    send({ type: 'SUBMIT_GUESS', angle: currentGuessRef.current });
  }, [send]);

  const handleReadyNext = useCallback(() => {
    haptics.nextRound();
    send({ type: 'READY_NEXT_ROUND' });
  }, [send]);

  // Host sends RETURN_TO_LOBBY from gameover — server drops the finished
  // game and broadcasts lobby phase. Our existing useEffect picks that up
  // and navigates everyone back to /lobby/[code]. Host can then press JOGAR
  // again to start a new match.
  const handleReturnToLobby = useCallback(() => {
    haptics.play();
    send({ type: 'RETURN_TO_LOBBY' });
  }, [send]);

  // "Alone in the room" — host is the only connected player. We watch this
  // (with a small delay so the modal doesn't flash during the brief solo
  // moment right after creating a fresh room) and surface a blocking modal
  // so the host isn't stuck staring at a stalled board.
  const isAlone = !!state && state.players.filter((p) => p.id !== playerId && p.connected).length === 0;
  const [aloneStuck, setAloneStuck] = useState(false);
  useEffect(() => {
    if (!isAlone) {
      setAloneStuck(false);
      return;
    }
    const id = setTimeout(() => setAloneStuck(true), 2500);
    return () => clearTimeout(id);
  }, [isAlone]);

  // Build markers for the result dial — one per guess, colored by the guesser.
  // MUST be declared before any conditional return to keep hook order stable
  // across renders where `state` flips between null and non-null (e.g., during
  // a reconnect blip).
  const resultMarkers: PlayerMarker[] = useMemo(() => {
    if (!state || (state.phase !== 'result' && state.phase !== 'gameover')) return [];
    if (!state.round?.guesses) return [];
    return state.round.guesses.map((g) => {
      const p = state.players.find((pl) => pl.id === g.playerId);
      return {
        angle: g.angle,
        color: p?.color ?? GameColors.accent,
        name: p?.name ?? '',
      };
    });
  }, [state]);

  if (!state || !playerId) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>{t('onlineGame.conectando')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const round = state.round;
  const me = state.players.find((p) => p.id === playerId);
  const isCluer = round?.cluerId === playerId;
  const cluer = state.players.find((p) => p.id === round?.cluerId);

  const sideNames = state.players.map((p) => p.name);
  const sideColors = state.players.map((p) => p.color);
  const scores = state.players.map((p) => p.score);
  const activeSideIndex = state.players.findIndex((p) => p.id === round?.cluerId);

  const winner = state.winnerId
    ? state.players.find((p) => p.id === state.winnerId)
    : undefined;

  // Cluer in clue phase needs the private target. Until it arrives we
  // show a quick "preparando" — the server sends it right after START_GAME
  // / READY_NEXT_ROUND so this should flash by.
  const targetForDial =
    state.phase === 'result' || state.phase === 'gameover'
      ? round?.targetAngle ?? 0
      : isCluer
        ? privateTargetAngle ?? 0
        : 0;

  const showDeadline = (state.phase === 'clue' || state.phase === 'guess') && round?.deadlineAt;

  function handleStrandedDisconnect() {
    send({ type: 'CLOSE_ROOM' });
    disconnect();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AloneRoomModal
        visible={isHostForLeave && aloneStuck && state.phase !== 'gameover'}
        onDisconnect={handleStrandedDisconnect}
      />
      <ScreenHeader>
        <HeaderIconButton icon="close" size={20} color={GameColors.textMuted} onPress={handleLeave} />
        {/* Center timer pill — absolutely positioned so the room pill on the
            right doesn't shift it. Mirrors the offline header layout. */}
        {showDeadline && (
          <View style={styles.headerTimerWrap} pointerEvents="box-none">
            <DeadlinePill
              deadlineAt={round?.deadlineAt}
              resetKey={`${state.roundNumber}-${state.phase}`}
            />
          </View>
        )}
        <View style={styles.roomPill}>
          <Text style={styles.roomPillEyebrow}>{t('onlineGame.roomPillLabel')}</Text>
          <Text style={styles.roomPillCode}>{code}</Text>
        </View>
      </ScreenHeader>

      <ConnectionStatusBanner />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {state.phase !== 'gameover' && (
            // Wrap with negative horizontal margins so the scoreboard's
            // internal scroll extends fully to the screen edges, instead of
            // being inset by the outer ScrollView's paddingHorizontal.
            <View style={styles.scoreBoardWrap}>
              <ScoreBoard
                scores={scores}
                activeSideIndex={activeSideIndex >= 0 ? activeSideIndex : 0}
                round={state.roundNumber}
                sideNames={sideNames}
                sideColors={sideColors}
                winningScore={10}
              />
            </View>
          )}

          {/* ============== CLUE PHASE ============== */}
          {state.phase === 'clue' && round && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.phaseContainer}>
              {isCluer ? (
                <>
                  <Text style={styles.phaseTitle}>{t('onlineGame.clue.suaVez')}</Text>
                  <Text style={styles.phaseSubtitle}>{t('onlineGame.clue.suaVezSubtitle')}</Text>
                  <View style={styles.dialWrap}>
                    {privateTargetAngle != null ? (
                      <WavelengthDial
                        targetAngle={privateTargetAngle}
                        guessAngle={guessAngle}
                        showTarget
                        interactive={false}
                        showGuess={false}
                        size={280}
                      />
                    ) : (
                      <Text style={styles.loadingText}>{t('onlineGame.preparando')}</Text>
                    )}
                  </View>
                  <SpectrumCard left={round.spectrum.left} right={round.spectrum.right} />

                  {(() => {
                    // When the skip button is also visible we have two CTAs
                    // stacked. Make both stretch to the same (full) width so
                    // they align cleanly. Alone, the primary keeps its natural
                    // hug-content width.
                    const showSkip = round.cluerSkipsRemaining !== undefined && round.cluerSkipsRemaining !== 0;
                    return (
                      <>
                        {state.voiceMode ? (
                          <View style={[styles.actions, showSkip && styles.actionsStretch]}>
                            <Text style={styles.helperText}>{t('onlineGame.clue.voiceHelper')}</Text>
                            <GameButton title={t('onlineGame.clue.voiceCta')} onPress={handleClueSaid} fullWidth={showSkip} />
                          </View>
                        ) : (
                          <View style={[styles.actions, showSkip && styles.actionsStretch]}>
                            <Text style={styles.helperText}>{t('onlineGame.clue.textHelper')}</Text>
                            <TextInput
                              value={clueDraft}
                              onChangeText={setClueDraft}
                              placeholder={t('onlineGame.clue.textPlaceholder')}
                              placeholderTextColor={GameColors.textMuted}
                              style={styles.clueInput}
                              maxLength={80}
                              autoFocus
                              autoCorrect={false}
                              autoCapitalize="none"
                              returnKeyType="send"
                              onSubmitEditing={handleSubmitClueText}
                            />
                            <GameButton title={t('onlineGame.clue.textCta')} onPress={handleSubmitClueText} fullWidth={showSkip} />
                          </View>
                        )}

                        {showSkip && (
                          <View style={styles.skipWrap}>
                            <GameButton
                              title={t('onlineGame.clue.pularCarta')}
                              onPress={handleSkipCard}
                              variant="secondary"
                              fullWidth
                            />
                            <Text style={styles.skipHint}>
                              {round.cluerSkipsRemaining === -1
                                ? t('onlineGame.clue.skipsUnlimited')
                                : t('onlineGame.clue.skipsRestantes', { count: round.cluerSkipsRemaining })}
                            </Text>
                          </View>
                        )}
                      </>
                    );
                  })()}
                </>
              ) : (
                <>
                  {/* Big avatar of the cluer with a glowing ring in their color.
                      Replaces the small badge — gives guessers something to
                      look at while they wait for the clue. */}
                  <Animated.View
                    entering={ZoomIn.duration(450).springify()}
                    style={[
                      styles.cluerAvatarRing,
                      {
                        borderColor: cluer?.color ?? GameColors.accent,
                        shadowColor: cluer?.color ?? GameColors.accent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cluerAvatarInitial,
                        { color: cluer?.color ?? GameColors.accent },
                      ]}
                    >
                      {(cluer?.name ?? '?').trim().charAt(0).toUpperCase()}
                    </Text>
                  </Animated.View>

                  <Text style={styles.cluerThinkingTitle}>
                    {t('onlineGame.clue.cluerThinkingTitle', {
                      name: cluer?.name ?? t('onlineGame.clue.fallbackCluer'),
                    })}
                  </Text>
                  <Text style={styles.cluerWaitHint}>
                    {state.voiceMode
                      ? t('onlineGame.clue.waitHintVoice')
                      : t('onlineGame.clue.waitHintText')}
                  </Text>

                  <Text style={styles.spectrumEyebrow}>
                    {t('onlineGame.clue.spectrumLabel')}
                  </Text>
                  <SpectrumCard left={round.spectrum.left} right={round.spectrum.right} />
                </>
              )}
            </Animated.View>
          )}

          {/* ============== GUESS PHASE ============== */}
          {state.phase === 'guess' && round && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.phaseContainer}>
              {!state.voiceMode && round.clueText && (
                <Animated.View entering={FadeInDown.duration(300)} style={styles.clueBubble}>
                  <Text style={styles.clueBubbleLabel}>{t('onlineGame.guess.dicaLabel')}</Text>
                  <Text style={styles.clueBubbleText}>“{round.clueText}”</Text>
                </Animated.View>
              )}

              {isCluer ? (
                <>
                  <Text style={styles.phaseTitle}>{t('onlineGame.guess.aguardando')}</Text>
                  <Text style={styles.phaseSubtitle}>
                    {t('onlineGame.guess.aguardandoCount', {
                      submitted: round.submittedGuessIds.length,
                      total: round.submittedGuessIds.length + round.expectedGuessIds.length,
                    })}
                  </Text>
                  <View style={styles.dialWrap}>
                    <WavelengthDial
                      targetAngle={targetForDial}
                      guessAngle={guessAngle}
                      showTarget
                      interactive={false}
                      showGuess={false}
                      size={280}
                    />
                  </View>
                  <SpectrumCard left={round.spectrum.left} right={round.spectrum.right} />
                  {/* Show who has ALREADY guessed (not who's missing). The
                      cluer's own name is excluded — they don't guess. */}
                  {round.submittedGuessIds.filter((id) => id !== playerId).length > 0 && (
                    <View style={styles.waitList}>
                      {round.submittedGuessIds
                        .filter((id) => id !== playerId)
                        .map((id) => {
                          const p = state.players.find((pl) => pl.id === id);
                          return (
                            <View key={id} style={[styles.waitChip, styles.waitChipDone]}>
                              <Ionicons name="checkmark-circle" size={12} color={p?.color ?? GameColors.mint} />
                              <Text style={[styles.waitName, { color: GameColors.text }]}>
                                {p?.name ?? t('onlineGame.fallbackName')}
                              </Text>
                            </View>
                          );
                        })}
                    </View>
                  )}
                </>
              ) : me && round.submittedGuessIds.includes(playerId) ? (
                <>
                  <Text style={styles.phaseSubtitle}>
                    {t('onlineGame.guess.esperandoOutros', { count: round.expectedGuessIds.length })}
                  </Text>
                  {/* Dial stays visible with the player's submitted needle —
                      `interactive={false}` so they can't move it anymore. */}
                  <View style={styles.dialWrap}>
                    <WavelengthDial
                      targetAngle={0}
                      guessAngle={guessAngle}
                      showTarget={false}
                      interactive={false}
                      showGuess
                      size={280}
                    />
                  </View>
                  <SpectrumCard left={round.spectrum.left} right={round.spectrum.right} />
                  {/* Submitted "button" — visually like a button but inert.
                      Above the pills so as new players check in the layout
                      doesn't push it around. */}
                  <View style={styles.actions}>
                    <View style={styles.submittedPill}>
                      <Ionicons name="checkmark-circle" size={18} color={GameColors.mint} />
                      <Text style={styles.submittedPillText}>{t('onlineGame.guess.enviado')}</Text>
                    </View>
                  </View>
                  {/* Same "who's done" pills the cluer sees — gives the
                      waiting guesser visual feedback on progress. */}
                  {round.submittedGuessIds.filter((id) => id !== playerId).length > 0 && (
                    <View style={styles.waitList}>
                      {round.submittedGuessIds
                        .filter((id) => id !== playerId)
                        .map((id) => {
                          const p = state.players.find((pl) => pl.id === id);
                          return (
                            <View key={id} style={[styles.waitChip, styles.waitChipDone]}>
                              <Ionicons name="checkmark-circle" size={12} color={p?.color ?? GameColors.mint} />
                              <Text style={[styles.waitName, { color: GameColors.text }]}>
                                {p?.name ?? t('onlineGame.fallbackName')}
                              </Text>
                            </View>
                          );
                        })}
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.phaseTitle}>{t('onlineGame.guess.suaVez')}</Text>
                  <Text style={styles.phaseSubtitle}>{t('onlineGame.guess.suaVezSubtitle')}</Text>
                  <View style={styles.dialWrap}>
                    <WavelengthDial
                      targetAngle={0}
                      guessAngle={guessAngle}
                      showTarget={false}
                      interactive
                      showGuess
                      onGuessChange={handleGuessChange}
                      size={280}
                    />
                  </View>
                  <SpectrumCard left={round.spectrum.left} right={round.spectrum.right} />
                  <View style={styles.actions}>
                    <GameButton title={t('onlineGame.guess.confirmar')} onPress={handleSubmitGuess} color={GameColors.secondary} />
                  </View>
                </>
              )}
            </Animated.View>
          )}

          {/* ============== RESULT PHASE ============== */}
          {state.phase === 'result' && round && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.phaseContainer}>
              <Text style={styles.phaseTitle}>{t('onlineGame.result.title')}</Text>
              <View style={styles.dialWrap}>
                <WavelengthDial
                  targetAngle={targetForDial}
                  guessAngle={guessAngle}
                  showTarget
                  interactive={false}
                  showGuess={resultMarkers.length === 1}
                  size={280}
                  playerMarkers={resultMarkers.length > 1 ? resultMarkers : undefined}
                />
              </View>
              <SpectrumCard left={round.spectrum.left} right={round.spectrum.right} />

              {round.guesses && (
                <View style={styles.guessList}>
                  {round.guesses.map((g, i) => {
                    const p = state.players.find((pl) => pl.id === g.playerId);
                    return (
                      <Animated.View
                        key={`${g.playerId}-${i}`}
                        entering={FadeInDown.duration(300).delay(i * 80)}
                        style={styles.guessRow}
                      >
                        <View style={[styles.guessDot, { backgroundColor: p?.color ?? GameColors.accent }]} />
                        <Text style={styles.guessName}>{p?.name ?? t('onlineGame.fallbackName')}</Text>
                        <Text style={styles.guessScore}>+{g.score}</Text>
                      </Animated.View>
                    );
                  })}
                  {typeof round.cluerBonus === 'number' && round.cluerBonus > 0 && (
                    <Animated.View entering={FadeInDown.duration(300).delay(300)} style={styles.guessRow}>
                      <View style={[styles.guessDot, { backgroundColor: cluer?.color ?? GameColors.accent }]} />
                      <Text style={styles.guessName}>{(cluer?.name ?? t('onlineGame.fallbackName')) + t('onlineGame.result.cluerLabel')}</Text>
                      <Text style={styles.guessScore}>+{round.cluerBonus}</Text>
                    </Animated.View>
                  )}
                </View>
              )}

              {(() => {
                const nextCluerId = state.nextCluerId;
                const meIsNext = !!nextCluerId && nextCluerId === playerId;
                const nextCluer = nextCluerId
                  ? state.players.find((p) => p.id === nextCluerId)
                  : null;
                if (meIsNext) {
                  return (
                    <View style={styles.actions}>
                      <Text style={styles.nextHint}>
                        {t('onlineGame.result.youAreNextCluer')}
                      </Text>
                      <GameButton
                        title={t('onlineGame.result.proximo')}
                        onPress={handleReadyNext}
                      />
                    </View>
                  );
                }
                if (nextCluer) {
                  return (
                    <View style={styles.waitNextWrap}>
                      <Text style={styles.waitNextText}>
                        {t('onlineGame.result.waitingNextCluer', { name: nextCluer.name })}
                      </Text>
                    </View>
                  );
                }
                // Fallback: selection mode — every player can advance.
                return (
                  <View style={styles.actions}>
                    <GameButton
                      title={me?.isReady ? t('onlineGame.result.pronto') : t('onlineGame.result.estouPronto')}
                      onPress={handleReadyNext}
                    />
                  </View>
                );
              })()}
            </Animated.View>
          )}

          {/* ============== GAME OVER ============== */}
          {state.phase === 'gameover' && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.phaseContainer}>
              <Animated.View entering={ZoomIn.duration(600).springify()} style={styles.gameOverHeader}>
                <Ionicons name="sparkles" size={28} color={GameColors.accent} />
                <Text style={styles.gameOverTitle}>
                  {winner ? t('onlineGame.gameover.won', { name: winner.name.toUpperCase() }) : t('onlineGame.gameover.fim')}
                </Text>
                <Ionicons name="sparkles" size={28} color={GameColors.accent} />
              </Animated.View>

              {state.players.length >= 3 ? (
                <GameOverPodium
                  names={state.players.map((p) => p.name)}
                  colors={state.players.map((p) => p.color)}
                  scores={state.players.map((p) => p.score)}
                  labels={{
                    first: t('game.gameOver.podium.first'),
                    second: t('game.gameOver.podium.second'),
                    third: t('game.gameOver.podium.third'),
                    ranking: t('game.gameOver.podium.ranking'),
                  }}
                />
              ) : (
                <View style={styles.finalScores}>
                  {state.players
                    .slice()
                    .sort((a, b) => b.score - a.score)
                    .map((p, i) => (
                      <View key={p.id} style={[styles.finalRow, i === 0 && styles.finalRowWinner]}>
                        <Text style={styles.finalRank}>{i + 1}º</Text>
                        <View style={[styles.guessDot, { backgroundColor: p.color }]} />
                        <Text style={styles.finalName}>{p.name}</Text>
                        <Text style={[styles.finalScore, i === 0 && styles.finalScoreWinner]}>{p.score}</Text>
                      </View>
                    ))}
                </View>
              )}

              <Text style={styles.roundsPlayed}>{t('onlineGame.gameover.rodadasJogadas', { count: state.roundNumber })}</Text>
              <View style={[styles.actions, styles.gameoverButtons]}>
                {isHostForLeave && (
                  <GameButton
                    fullWidth
                    title={t('onlineGame.gameover.voltarLobby')}
                    onPress={handleReturnToLobby}
                  />
                )}
                <GameButton
                  fullWidth
                  variant="secondary"
                  title={t('common.actions.viewHistory')}
                  onPress={() => router.push({
                    pathname: '/history',
                    params: {
                      history: JSON.stringify(state.history),
                      playerNames: JSON.stringify(state.players.map((p) => p.name)),
                      scores: JSON.stringify(state.players.map((p) => p.score)),
                    },
                  })}
                />
                <GameButton fullWidth variant="secondary" title={t('onlineGame.gameover.voltarMenu')} onPress={handleLeave} />
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: GameColors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 32, paddingHorizontal: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 40 },
  loadingText: { color: GameColors.textMuted, fontSize: 14 },
  deadlineWrap: {
    alignItems: 'center',
    marginTop: 6,
  },
  scoreBoardWrap: {
    marginHorizontal: -16,
  },
  gameoverButtons: {
    width: '100%',
    alignItems: 'stretch',
    gap: 12,
    marginTop: 12,
  },
  headerTimerWrap: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  roomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: GameColors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginLeft: 'auto',
  },
  roomPillEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: GameColors.textMuted,
    letterSpacing: 1.5,
  },
  roomPillCode: {
    fontSize: 14,
    fontWeight: '900',
    color: GameColors.text,
    letterSpacing: 2,
  },
  phaseContainer: {
    alignItems: 'center',
    gap: 14,
    paddingTop: 12,
  },
  phaseTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: GameColors.text,
    textAlign: 'center',
  },
  phaseSubtitle: {
    fontSize: 13,
    color: GameColors.textMuted,
    textAlign: 'center',
  },
  helperText: {
    fontSize: 13,
    color: GameColors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  dialWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  actionsStretch: {
    alignItems: 'stretch',
  },
  clueInput: {
    width: '100%',
    backgroundColor: GameColors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: GameColors.text,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    borderWidth: 1.5,
    borderColor: GameColors.surfaceLight,
  },
  clueBubble: {
    backgroundColor: GameColors.surface,
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GameColors.accent + '55',
  },
  clueBubbleLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: GameColors.accent,
    marginBottom: 4,
  },
  clueBubbleText: {
    fontSize: 18,
    fontWeight: '700',
    fontStyle: 'italic',
    color: GameColors.text,
  },
  cluerAvatarRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
    shadowOpacity: 0.55,
    elevation: 18,
    marginTop: 24,
    marginBottom: 8,
  },
  cluerAvatarInitial: {
    fontSize: 60,
    fontWeight: '900',
  },
  cluerThinkingTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: GameColors.text,
    textAlign: 'center',
    letterSpacing: 0.2,
    marginTop: 8,
  },
  cluerWaitHint: {
    fontSize: 14,
    color: GameColors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  nextHint: {
    fontSize: 14,
    color: GameColors.textMuted,
    textAlign: 'center',
    marginBottom: 4,
    paddingHorizontal: 16,
    lineHeight: 19,
  },
  waitNextWrap: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  waitNextText: {
    fontSize: 14,
    color: GameColors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  spectrumEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: GameColors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 26,
    marginBottom: 2,
  },
  cluerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  cluerDot: { width: 12, height: 12, borderRadius: 6 },
  cluerName: { fontSize: 14, fontWeight: '800', color: GameColors.text },
  waitList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  waitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: GameColors.surface,
  },
  waitChipDone: {
    backgroundColor: GameColors.mint + '18',
    borderWidth: 1,
    borderColor: GameColors.mint + '55',
  },
  submittedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    backgroundColor: GameColors.mint + '1F',
    borderWidth: 1.5,
    borderColor: GameColors.mint + '88',
    alignSelf: 'center',
    minWidth: 200,
  },
  submittedPillText: {
    fontSize: 16,
    fontWeight: '900',
    color: GameColors.mint,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  waitDot: { width: 8, height: 8, borderRadius: 4 },
  waitName: { fontSize: 12, color: GameColors.textMuted, fontWeight: '600' },
  guessList: {
    width: '100%',
    gap: 8,
    marginTop: 6,
  },
  guessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: GameColors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  guessDot: { width: 12, height: 12, borderRadius: 6 },
  guessName: { flex: 1, fontSize: 14, color: GameColors.text, fontWeight: '700' },
  guessScore: { fontSize: 18, fontWeight: '900', color: GameColors.accent },
  gameOverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  gameOverTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: GameColors.accent,
    letterSpacing: 1,
    textAlign: 'center',
    flexShrink: 1,
  },
  finalScores: {
    width: '100%',
    gap: 8,
    marginTop: 6,
  },
  finalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: GameColors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  finalRowWinner: {
    borderWidth: 1.5,
    borderColor: GameColors.accent,
  },
  finalRank: { fontSize: 14, fontWeight: '900', color: GameColors.textMuted, width: 26 },
  finalName: { flex: 1, fontSize: 15, color: GameColors.text, fontWeight: '700' },
  finalScore: { fontSize: 24, fontWeight: '900', color: GameColors.text },
  finalScoreWinner: { color: GameColors.accent },
  roundsPlayed: { color: GameColors.textMuted, fontSize: 13, marginTop: 6 },
  skipWrap: {
    width: '100%',
    alignItems: 'stretch',
    marginTop: 4,
    gap: 4,
    paddingHorizontal: 0,
  },
  skipHint: {
    fontSize: 11,
    color: GameColors.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },
});
