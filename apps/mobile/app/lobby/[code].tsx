import { HeaderIconButton, HeaderSpacer, HeaderTitle, ScreenHeader } from '@/components/screen-header';
import { GameColors } from '@/constants/theme';
import { useNetwork } from '@/contexts/network-context';
import { useSettings } from '@/contexts/settings-context';
import { haptics } from '@/lib/haptics';
import { normalizeRoomCode } from '@/lib/room-codes';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LobbyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; host?: string; voice?: string; name?: string; color?: string }>();
  const code = normalizeRoomCode(params.code ?? '');
  const isHost = params.host === '1';
  const voiceMode = params.voice === '1';

  const { settings } = useSettings();
  const { status, state, lastError, connect, disconnect, send, playerId } = useNetwork();

  const [copied, setCopied] = useState(false);

  // Defaults from settings: first configured player + matching color
  const myName = useMemo(
    () => params.name ?? settings.playerNames[0] ?? 'Jogador',
    [params.name, settings.playerNames],
  );
  const myColor = useMemo(
    () => params.color ?? settings.playerColors[0] ?? GameColors.primary,
    [params.color, settings.playerColors],
  );

  // Connect once on mount, disconnect on unmount.
  useEffect(() => {
    if (!code) {
      Alert.alert('Código inválido', 'Não consegui ler o código da sala.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      return;
    }
    void connect({ code, name: myName, color: myColor });
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Show server errors as native alerts (only when they actually change)
  useEffect(() => {
    if (!lastError) return;
    Alert.alert('Erro', lastError.message, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }, [lastError, router]);

  const shareUrl = `https://sintonia.party/join/${code}`;

  async function handleShare() {
    haptics.play();
    try {
      await Share.share({
        message: `Te chamei pra uma sala no Sintonia. Cola aí: ${shareUrl}`,
        url: shareUrl,
        title: `Sintonia · sala ${code}`,
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

  function handleLeave() {
    haptics.play();
    disconnect();
    router.back();
  }

  const me = state?.players.find((p) => p.id === playerId);
  const everyoneReady =
    state?.players && state.players.length >= 2 && state.players.every((p) => p.isReady || p.isHost);

  function handleToggleReady() {
    if (!me) return;
    haptics.play();
    send({ type: 'READY', isReady: !me.isReady });
  }

  function handleStart() {
    haptics.play();
    Alert.alert(
      'Em breve',
      'O game loop é a próxima fase (Phase 2). Por enquanto o lobby tá só pra você ver a galera entrando.',
    );
  }

  const connectingState = status === 'connecting' || (status === 'connected' && !state);

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader>
        <HeaderIconButton icon="chevron-back" onPress={handleLeave} />
        <HeaderTitle>Sala {code}</HeaderTitle>
        <HeaderSpacer />
      </ScreenHeader>

      <View style={styles.content}>
        {/* Code card */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.codeCard}>
          <Text style={styles.codeLabel}>código da sala</Text>
          <Pressable onPress={handleCopyCode} hitSlop={12} style={styles.codePressable}>
            <Text style={styles.codeValue}>{code}</Text>
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy-outline'}
              size={20}
              color={copied ? GameColors.mint : GameColors.textMuted}
            />
          </Pressable>
          <Text style={styles.codeHint}>
            {voiceMode ? 'Em voz alta · Discord ou presencial' : 'Por texto · sem áudio'}
          </Text>
        </Animated.View>

        {/* Share button */}
        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed]}
        >
          <Ionicons name="share-outline" size={20} color={GameColors.text} />
          <Text style={styles.shareText}>Compartilhar convite</Text>
        </Pressable>

        {/* Player list */}
        <View style={styles.playersBlock}>
          <Text style={styles.sectionTitle}>
            Jogadores {state?.players?.length ? `(${state.players.length})` : ''}
          </Text>

          {connectingState && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Conectando…</Text>
            </View>
          )}

          {state?.players?.map((p, idx) => (
            <Animated.View
              key={p.id}
              entering={FadeInDown.duration(400).delay(idx * 60)}
              style={[styles.playerRow, !p.connected && styles.playerRowDisconnected]}
            >
              <View style={[styles.avatar, { backgroundColor: p.color }]} />
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>
                  {p.name}
                  {p.id === playerId ? ' (você)' : ''}
                </Text>
                <View style={styles.playerMeta}>
                  {p.isHost && (
                    <View style={[styles.badge, { backgroundColor: GameColors.primary + '33' }]}>
                      <Text style={[styles.badgeText, { color: GameColors.primary }]}>HOST</Text>
                    </View>
                  )}
                  {!p.connected && (
                    <View style={[styles.badge, { backgroundColor: GameColors.surfaceLight }]}>
                      <Text style={[styles.badgeText, { color: GameColors.textMuted }]}>OFFLINE</Text>
                    </View>
                  )}
                  {p.connected && p.isReady && !p.isHost && (
                    <View style={[styles.badge, { backgroundColor: GameColors.mint + '33' }]}>
                      <Text style={[styles.badgeText, { color: GameColors.mint }]}>PRONTO</Text>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>
          ))}

          {state?.players?.length === 1 && (
            <View style={styles.waitingHint}>
              <Ionicons name="time-outline" size={16} color={GameColors.textMuted} />
              <Text style={styles.waitingText}>Esperando alguém entrar…</Text>
            </View>
          )}
        </View>

        {/* Footer actions */}
        <View style={styles.footer}>
          {!isHost && me && (
            <Pressable
              onPress={handleToggleReady}
              style={({ pressed }) => [
                styles.actionButton,
                me.isReady ? styles.actionButtonReady : styles.actionButtonSecondary,
                pressed && styles.actionButtonPressed,
              ]}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  me.isReady && { color: GameColors.background },
                ]}
              >
                {me.isReady ? 'PRONTO ✓' : 'ESTOU PRONTO'}
              </Text>
            </Pressable>
          )}

          {isHost && (
            <Pressable
              onPress={handleStart}
              disabled={!everyoneReady}
              style={({ pressed }) => [
                styles.actionButton,
                everyoneReady ? styles.actionButtonPrimary : styles.actionButtonDisabled,
                pressed && everyoneReady && styles.actionButtonPressed,
              ]}
            >
              <Text style={styles.actionButtonText}>
                {everyoneReady ? 'INICIAR PARTIDA' : 'AGUARDANDO JOGADORES'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GameColors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  codeCard: {
    backgroundColor: GameColors.surface,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GameColors.primary + '33',
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: GameColors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  codePressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  codeValue: {
    fontSize: 56,
    fontWeight: '900',
    color: GameColors.text,
    letterSpacing: 10,
    textShadowColor: GameColors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
    paddingLeft: 10, // letter-spacing visual offset
  },
  codeHint: {
    color: GameColors.textMuted,
    fontSize: 12,
    marginTop: 10,
  },
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
  shareButtonPressed: {
    opacity: 0.7,
  },
  shareText: {
    fontSize: 14,
    fontWeight: '700',
    color: GameColors.text,
    letterSpacing: 0.5,
  },
  playersBlock: {
    flex: 1,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: GameColors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  emptyState: {
    backgroundColor: GameColors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: GameColors.textMuted,
    fontSize: 14,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: GameColors.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  playerRowDisconnected: {
    opacity: 0.5,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  playerInfo: {
    flex: 1,
    gap: 4,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700',
    color: GameColors.text,
  },
  playerMeta: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  waitingHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  waitingText: {
    color: GameColors.textMuted,
    fontSize: 13,
  },
  footer: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: GameColors.primary,
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: GameColors.textMuted,
  },
  actionButtonReady: {
    backgroundColor: GameColors.mint,
  },
  actionButtonDisabled: {
    backgroundColor: GameColors.surface,
  },
  actionButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: GameColors.text,
    letterSpacing: 1.5,
  },
});
