import { ConnectionStatusBanner } from '@/components/connection-status-banner';
import { QRCodeModal } from '@/components/qr-code-modal';
import { RoomSettingsModal } from '@/components/room-settings-modal';
import { HeaderIconButton, HeaderSpacer, HeaderTitle, ScreenHeader } from '@/components/screen-header';
import { StartCountdownOverlay } from '@/components/start-countdown-overlay';
import { Starfield } from '@/components/starfield';
import { GameColors } from '@/constants/theme';
import { useNetwork } from '@/contexts/network-context';
import { useSettings } from '@/contexts/settings-context';
import spectrumsEN from '@/data/spectrums.en.json';
import spectrumsES from '@/data/spectrums.es.json';
import spectrumsPtBR from '@/data/spectrums.pt-BR.json';
import { haptics } from '@/lib/haptics';
import { normalizeRoomCode } from '@/lib/room-codes';
import { buildSpectrumPool, type Spectrum } from '@sintonia/game-core';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

function getBaseSpectrums(language: string): Spectrum[] {
  if (language === 'en') return spectrumsEN;
  if (language === 'es') return spectrumsES;
  return spectrumsPtBR;
}

export default function LobbyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ code?: string; host?: string; voice?: string; name?: string; color?: string }>();
  const code = normalizeRoomCode(params.code ?? '');
  const voiceMode = params.voice === '1';
  const wantsHost = params.host === '1';

  const { settings, effectiveLanguage, updateSettings } = useSettings();
  const { status, state, lastError, connect, disconnect, send, playerId, roomClosure, clearRoomClosure } = useNetwork();

  const [copied, setCopied] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Defaults from settings: first configured player + matching color
  const myName = useMemo(
    () => params.name ?? settings.playerNames[0] ?? t('lobby.fallbackName'),
    [params.name, settings.playerNames, t],
  );
  const myColor = useMemo(
    () => params.color ?? settings.playerColors[0] ?? GameColors.primary,
    [params.color, settings.playerColors],
  );

  // Connect once on mount. We deliberately DON'T disconnect on unmount —
  // when this screen navigates to /online-game/[code] we want the same
  // WebSocket connection to stay alive (it's owned by NetworkProvider
  // at the layout root). Explicit "leave" (handleLeave) tears it down.
  // Also: if /online-config already opened the socket for this same room
  // (host create flow), don't re-open — that'd churn the WS unnecessarily.
  useEffect(() => {
    if (!code) {
      Alert.alert(t('lobby.alerts.codigoInvalido.title'), t('lobby.alerts.codigoInvalido.body'), [
        { text: t('lobby.alerts.codigoInvalido.ok'), onPress: () => router.back() },
      ]);
      return;
    }
    const alreadyConnected =
      status === 'connected' && state?.code === code;
    if (alreadyConnected) return;
    void connect({ code, name: myName, color: myColor, mode: wantsHost ? 'host' : 'guest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Terminal errors (sala não existe, etc.) get an explicit alert+back.
  // Transient errors (NOT_HOST, BAD_REQUEST) — the banner is enough.
  useEffect(() => {
    if (!lastError) return;
    const terminal = ['INVALID_CODE', 'ROOM_FULL', 'ALREADY_STARTED'];
    if (!terminal.includes(lastError.code)) return;
    Alert.alert(t('lobby.alerts.naoFoiPossivelEntrar.title'), lastError.message, [
      { text: t('lobby.alerts.naoFoiPossivelEntrar.ok'), onPress: () => router.back() },
    ]);
  }, [lastError, router, t]);

  const shareUrl = `https://sintonia.party/join/${code}`;

  async function handleShare() {
    haptics.play();
    try {
      await Share.share({
        message: t('lobby.inviteMessage', { url: shareUrl }),
        url: shareUrl,
        title: t('lobby.inviteTitle', { code }),
      });
    } catch {
      // user cancelled — silent
    }
  }

  async function handleCopyCode() {
    haptics.play();
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const me = state?.players.find((p) => p.id === playerId);
  // isHost is server-driven so it survives host migration (e.g. original host
  // disconnects → server promotes the next connected member → that client
  // suddenly sees the "INICIAR PARTIDA" button without a screen change).
  const isHost = !!me?.isHost;

  function handleLeave() {
    haptics.play();
    // No confirmation needed if you're alone — nothing to "encerrar" for others.
    const otherConnected = state?.players.filter((p) => p.connected && p.id !== playerId).length ?? 0;
    if (otherConnected === 0) {
      if (isHost) send({ type: 'CLOSE_ROOM' });
      // Disconnect synchronously — the message is already queued on the
      // socket and flushes before close. Avoids a flicker of the
      // auto-reconnect banner during the gap.
      disconnect();
      router.replace('/');
      return;
    }
    if (isHost) {
      Alert.alert(
        t('lobby.alerts.encerrar.title'),
        t('lobby.alerts.encerrar.body'),
        [
          { text: t('lobby.alerts.cancelar'), style: 'cancel' },
          {
            text: t('lobby.alerts.encerrar.confirm'),
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
      t('lobby.alerts.sair.title'),
      t('lobby.alerts.sair.body'),
      [
        { text: t('lobby.alerts.cancelar'), style: 'cancel' },
        {
          text: t('lobby.alerts.sair.confirm'),
          style: 'destructive',
          onPress: () => {
            disconnect();
            router.replace('/');
          },
        },
      ],
    );
  }

  // Room closure / kick notice. Three cases:
  // - reason='host' and I'm the host → I caused it, swallow silently
  // - reason='host' and I'm a guest → "host closed the room"
  // - reason='kicked' → "host removed you"
  useEffect(() => {
    if (!roomClosure) return;
    if (roomClosure.reason === 'host' && isHost) {
      clearRoomClosure();
      return;
    }
    const titleKey =
      roomClosure.reason === 'kicked'
        ? 'lobby.alerts.kicked.title'
        : 'lobby.alerts.salaEncerrada.title';
    const bodyKey =
      roomClosure.reason === 'kicked'
        ? 'lobby.alerts.kicked.body'
        : 'lobby.alerts.salaEncerrada.body';
    Alert.alert(
      t(titleKey),
      t(bodyKey),
      [{ text: t('lobby.alerts.codigoInvalido.ok'), onPress: () => { clearRoomClosure(); router.replace('/'); } }],
    );
  }, [roomClosure, isHost, clearRoomClosure, router, t]);
  // JOGAR enables as soon as there are ≥2 connected players. We dropped the
  // explicit "ready" toggle — being in the room is the signal.
  const connectedPlayers = state?.players.filter((p) => p.connected) ?? [];
  const canStart = connectedPlayers.length >= 2;

  function handleKick(targetPlayerId: string, targetName: string) {
    haptics.play();
    Alert.alert(
      t('lobby.alerts.kick.title', { name: targetName }),
      t('lobby.alerts.kick.body'),
      [
        { text: t('lobby.alerts.cancelar'), style: 'cancel' },
        {
          text: t('lobby.alerts.kick.confirm'),
          style: 'destructive',
          onPress: () => send({ type: 'KICK_PLAYER', targetPlayerId }),
        },
      ],
    );
  }

  function handleStart() {
    if (!state) return;
    if (state.players.length < 2) {
      Alert.alert(t('lobby.alerts.faltamJogadores.title'), t('lobby.alerts.faltamJogadores.body'));
      return;
    }
    haptics.play();
    // Server fires the pre-game countdown by setting state.gameStartingAt.
    // All clients render the overlay off that same timestamp → synced 3-2-1.
    const baseSpectrums = getBaseSpectrums(effectiveLanguage);
    const spectrumPool = buildSpectrumPool(baseSpectrums, settings.customSpectrums);
    send({
      type: 'START_GAME',
      settings: {
        gameMode: 'individual', // teams not supported online yet
        scoringTarget: settings.scoringTarget,
        roundFlow: settings.roundFlow,
        winningScore: settings.winningScore,
        skipsPerPlayer: settings.skipsPerPlayer,
        playerNames: settings.playerNames,
        playerColors: settings.playerColors,
        customSpectrums: settings.customSpectrums,
        teams: settings.teams,
        clueTimeLimit: settings.clueTimeLimit,
        guessTimeLimit: settings.guessTimeLimit,
      },
      voiceMode,
      spectrumPool,
    });
  }

  // Host pushes their current settings to the server as soon as they land in
  // the lobby, so guests' settings modal opens with the same values.
  useEffect(() => {
    if (!isHost || !state || state.phase !== 'lobby') return;
    if (state.roomConfig) return; // already published
    send({
      type: 'UPDATE_ROOM_SETTINGS',
      config: {
        voiceMode,
        winningScore: settings.winningScore,
        skipsPerPlayer: settings.skipsPerPlayer,
        clueTimeLimit: settings.clueTimeLimit,
        guessTimeLimit: settings.guessTimeLimit,
      },
    });
  }, [
    isHost,
    state?.phase,
    state?.roomConfig,
    voiceMode,
    settings.winningScore,
    settings.skipsPerPlayer,
    settings.clueTimeLimit,
    settings.guessTimeLimit,
    send,
    state,
  ]);

  // Auto-navigate to the game screen as soon as the server moves the room
  // past 'lobby'. Server controls the phase, lobby just observes.
  useEffect(() => {
    if (state && state.phase !== 'lobby') {
      router.replace({ pathname: '/online-game/[code]', params: { code } });
    }
  }, [state?.phase, code, router, state]);

  const connectingState = status === 'connecting' || (status === 'connected' && !state);

  // Hard timeout on the lobby's connecting state: if no STATE arrives within
  // this window, something is wrong (server gone, deeplinked into a stale
  // route, etc.). Bounce back with an alert.
  useEffect(() => {
    if (state) return;
    const id = setTimeout(() => {
      if (state) return;
      Alert.alert(
        t('lobby.alerts.timeout.title'),
        t('lobby.alerts.timeout.body'),
        [{ text: t('lobby.alerts.ok'), onPress: () => { disconnect(); router.replace('/'); } }],
      );
    }, 12_000);
    return () => clearTimeout(id);
  }, [state, disconnect, router, t]);

  return (
    <SafeAreaView style={styles.screen}>
      <Starfield count={80} />
      <QRCodeModal
        visible={qrVisible}
        code={code}
        url={shareUrl}
        onClose={() => setQrVisible(false)}
      />
      <StartCountdownOverlay startsAt={state?.gameStartingAt} />
      <RoomSettingsModal
        visible={settingsVisible}
        readOnly={!isHost}
        initial={{
          voiceMode: state?.roomConfig?.voiceMode ?? voiceMode,
          winningScore: state?.roomConfig?.winningScore ?? settings.winningScore,
          skipsPerPlayer: state?.roomConfig?.skipsPerPlayer ?? settings.skipsPerPlayer,
          clueTimeLimit: state?.roomConfig?.clueTimeLimit ?? settings.clueTimeLimit,
          guessTimeLimit: state?.roomConfig?.guessTimeLimit ?? settings.guessTimeLimit,
        }}
        onClose={() => setSettingsVisible(false)}
        onSave={(config) => {
          updateSettings({
            winningScore: config.winningScore,
            skipsPerPlayer: config.skipsPerPlayer,
            clueTimeLimit: config.clueTimeLimit,
            guessTimeLimit: config.guessTimeLimit,
          });
          send({ type: 'UPDATE_ROOM_SETTINGS', config });
        }}
      />
      <ScreenHeader>
        <HeaderIconButton icon="chevron-back" onPress={handleLeave} />
        <HeaderTitle>{t('lobby.title')}</HeaderTitle>
        <HeaderIconButton
          icon="settings-outline"
          onPress={() => { haptics.play(); setSettingsVisible(true); }}
        />
      </ScreenHeader>

      <ConnectionStatusBanner />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Code card with letter tiles */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.codeCard}>
          <Text style={styles.codeLabel}>{t('lobby.compartilhe')}</Text>
          <View style={styles.tilesRow}>
            {code.split('').map((ch, i) => (
              <View key={`${ch}-${i}`} style={styles.tile}>
                <Text style={styles.tileChar}>{ch}</Text>
              </View>
            ))}
          </View>
          <View style={styles.codeActions}>
            <Pressable
              onPress={handleCopyCode}
              style={({ pressed }) => [styles.copyButton, pressed && styles.copyButtonPressed]}
            >
              <Ionicons
                name={copied ? 'checkmark-circle' : 'copy-outline'}
                size={16}
                color={copied ? GameColors.mint : GameColors.textMuted}
              />
              <Text style={[styles.copyButtonText, copied && { color: GameColors.mint }]}>
                {copied ? t('lobby.codigoCopiado') : t('lobby.copiarCodigo')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { haptics.play(); setQrVisible(true); }}
              accessibilityLabel={t('lobby.qrButtonLabel')}
              style={({ pressed }) => [styles.qrButton, pressed && styles.copyButtonPressed]}
            >
              <Ionicons name="qr-code-outline" size={18} color={GameColors.textMuted} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Share button (kept from previous) */}
        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed]}
        >
          <Ionicons name="share-outline" size={18} color={GameColors.text} />
          <Text style={styles.shareText}>{t('lobby.compartilharConvite')}</Text>
        </Pressable>

        {/* Player list */}
        <View style={styles.playersBlock}>
          <Text style={styles.sectionTitle}>
            {t('lobby.jogadores', { n: state?.players?.length ?? 0 })}
          </Text>

          {connectingState && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('lobby.conectando')}</Text>
            </View>
          )}

          {state?.players?.map((p, idx) => {
            const canKick = isHost && p.id !== playerId;
            return (
              <Animated.View
                key={p.id}
                entering={FadeInDown.duration(400).delay(idx * 60)}
                style={[styles.playerRow, !p.connected && styles.playerRowDisconnected]}
              >
                <View style={[styles.avatar, { backgroundColor: p.color }]} />
                <Text style={styles.playerName} numberOfLines={1}>
                  {p.name}
                  {p.id === playerId ? <Text style={styles.playerNameSelf}>{t('lobby.self')}</Text> : ''}
                </Text>
                <View style={styles.playerBadges}>
                  {p.isHost && (
                    <View style={styles.hostBadge}>
                      <Ionicons name="flag" size={10} color={GameColors.primary} />
                      <Text style={styles.hostBadgeText}>{t('lobby.badges.host')}</Text>
                    </View>
                  )}
                  {!p.connected && (
                    <Text style={styles.offlineText}>{t('lobby.badges.offline')}</Text>
                  )}
                  {canKick && (
                    <Pressable
                      onPress={() => handleKick(p.id, p.name)}
                      hitSlop={14}
                      style={({ pressed }) => [styles.kickButton, pressed && { opacity: 0.4 }]}
                      accessibilityLabel={t('lobby.kickLabel', { name: p.name })}
                    >
                      <Ionicons name="close" size={20} color={GameColors.textMuted} />
                    </Pressable>
                  )}
                </View>
              </Animated.View>
            );
          })}

          {state?.players?.length === 1 && (
            <View style={styles.waitingHint}>
              <Ionicons name="time-outline" size={16} color={GameColors.textMuted} />
              <Text style={styles.waitingText}>{t('lobby.esperandoOutros')}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer actions — only the host has a CTA. Guests just wait. */}
      <View style={styles.footer}>
        {isHost ? (
          <Pressable
            onPress={handleStart}
            disabled={!canStart}
            style={({ pressed }) => [
              styles.cta,
              styles.ctaPrimary,
              !canStart && styles.ctaDisabled,
              pressed && canStart && styles.ctaPressed,
            ]}
          >
            <Text style={[styles.ctaText, !canStart && styles.ctaTextDisabled]}>
              {t('lobby.jogar')}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.guestWait}>
            <Ionicons name="time-outline" size={16} color={GameColors.textMuted} />
            <Text style={styles.guestWaitText}>{t('lobby.esperandoAnfitriao')}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GameColors.background,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 18,
  },
  // Code card with letter tiles
  codeCard: {
    backgroundColor: 'rgba(26, 39, 68, 0.6)',
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 14,
    marginTop: 4,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: GameColors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  tile: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 78,
    borderRadius: 14,
    backgroundColor: 'rgba(10, 23, 43, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileChar: {
    fontSize: 42,
    fontWeight: '900',
    color: GameColors.text,
    letterSpacing: 0,
  },
  codeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  qrButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButtonPressed: { opacity: 0.6 },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: GameColors.textMuted,
  },
  // Share button
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: GameColors.surfaceLight,
    alignSelf: 'center',
  },
  shareButtonPressed: { opacity: 0.7 },
  shareText: {
    fontSize: 14,
    fontWeight: '700',
    color: GameColors.text,
    letterSpacing: 0.5,
  },
  // Players list
  playersBlock: { gap: 10 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: GameColors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  emptyState: {
    backgroundColor: GameColors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: { color: GameColors.textMuted, fontSize: 14 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(26, 39, 68, 0.7)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  playerRowDisconnected: { opacity: 0.5 },
  avatar: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: GameColors.text,
  },
  playerNameSelf: {
    color: GameColors.textMuted,
    fontWeight: '600',
  },
  playerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GameColors.primary + '88',
    backgroundColor: GameColors.primary + '15',
  },
  hostBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    color: GameColors.primary,
  },
  readyText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: GameColors.mint,
  },
  offlineText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: GameColors.textMuted,
  },
  kickButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  waitingText: { color: GameColors.textMuted, fontSize: 13 },
  // Footer CTA
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  cta: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimary: { backgroundColor: GameColors.primary },
  ctaDisabled: { opacity: 0.4 },
  ctaPressed: { transform: [{ scale: 0.98 }] },
  ctaText: {
    fontSize: 17,
    fontWeight: '900',
    color: GameColors.text,
    letterSpacing: 1.5,
  },
  ctaTextDisabled: { color: 'rgba(255,255,255,0.7)' },
  guestWait: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  guestWaitText: {
    color: GameColors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
