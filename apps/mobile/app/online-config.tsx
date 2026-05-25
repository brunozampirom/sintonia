// Pré-sala: host configura partida online + sua identidade antes de criar
// a sala. Após CRIAR SALA o lobby gera código e conecta, e quando o host
// aperta INICIAR PARTIDA o START_GAME leva esses settings ao server.

import { HeaderIconButton, HeaderSpacer, HeaderTitle, ScreenHeader } from '@/components/screen-header';
import { GameColors } from '@/constants/theme';
import { useNetwork } from '@/contexts/network-context';
import { useSettings } from '@/contexts/settings-context';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { generateRoomCode } from '@/lib/room-codes';
import { haptics } from '@/lib/haptics';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { PLAYER_COLOR_PALETTE } from '@sintonia/game-core';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

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

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        if (!selected) haptics.selection();
        onPress();
      }}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

interface SectionProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  title: string;
  children: React.ReactNode;
  delay?: number;
  landscape?: boolean;
}

function Section({ icon, iconColor, title, children, delay = 0, landscape }: SectionProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay)}
      style={[styles.section, landscape && styles.sectionLandscape]}
    >
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color={iconColor} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </Animated.View>
  );
}

export default function OnlineConfigScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const { isLandscape } = useResponsiveLayout();
  const { connect, disconnect, state, status, lastError } = useNetwork();

  const [name, setName] = useState(settings.onlinePlayerName);
  const [color, setColor] = useState(
    settings.onlinePlayerColor || settings.playerColors[0] || PLAYER_COLOR_PALETTE[0],
  );
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState(true);
  const [winningScore, setWinningScore] = useState(settings.winningScore);
  const [skips, setSkips] = useState(settings.skipsPerPlayer);
  const [clueTimeLimit, setClueTimeLimit] = useState(settings.clueTimeLimit);
  const [guessTimeLimit, setGuessTimeLimit] = useState(settings.guessTimeLimit);

  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearPendingTimeout() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function abortCreate(message: string) {
    clearPendingTimeout();
    disconnect();
    setPendingCode(null);
    setLocalError(message);
  }

  // Watch the network state — when the server confirms the room with the
  // matching code in 'lobby' phase, we've successfully created and can navigate.
  useEffect(() => {
    if (!pendingCode) return;
    if (status === 'connected' && state?.code === pendingCode && state.phase === 'lobby') {
      clearPendingTimeout();
      setPendingCode(null);
      setLocalError(null);
      router.replace({
        pathname: '/lobby/[code]',
        params: {
          code: pendingCode,
          host: '1',
          voice: voiceMode ? '1' : '0',
          name: name.trim(),
          color,
        },
      });
    }
  }, [pendingCode, status, state, router, voiceMode, name, color]);

  // Watch for connection errors / final retries-exhausted state.
  useEffect(() => {
    if (!pendingCode) return;
    if (status === 'error') {
      abortCreate(t('onlineConfig.errors.connect'));
    }
    if (lastError) {
      abortCreate(lastError.message || t('onlineConfig.errors.refused'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, lastError, pendingCode]);

  // Cleanup on unmount: don't leak a half-connected socket.
  useEffect(() => {
    return () => {
      clearPendingTimeout();
      if (pendingCode) disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCreate() {
    if (!name.trim() || pendingCode) return;
    haptics.play();
    setLocalError(null);
    // Persist defaults for next time.
    updateSettings({
      winningScore,
      skipsPerPlayer: skips,
      clueTimeLimit,
      guessTimeLimit,
      // Online is always all-guess — single-guess only makes sense when you're
      // passing the same phone around offline.
      roundFlow: 'all-guess',
      onlinePlayerName: name.trim(),
      onlinePlayerColor: color,
    });
    const code = generateRoomCode();
    setPendingCode(code);
    void connect({ code, name: name.trim(), color, mode: 'host' });

    // Timeout — if no STATE arrives in 6s, treat as failure and bounce back.
    clearPendingTimeout();
    timeoutRef.current = setTimeout(() => {
      abortCreate(t('onlineConfig.errors.timeout'));
    }, 6000);
  }

  const creating = !!pendingCode;

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader>
        <HeaderIconButton icon="chevron-back" onPress={() => router.back()} />
        <HeaderTitle>{t('onlineConfig.title')}</HeaderTitle>
        <HeaderSpacer />
      </ScreenHeader>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* VOCÊ — nome + cor (sempre full-width) */}
        <Section icon="person-circle-outline" iconColor={GameColors.secondary} title={t('onlineConfig.voce')} delay={0}>
          <View style={styles.playerRow}>
            <Pressable
              style={[styles.colorDot, { backgroundColor: color }, colorPickerOpen && styles.colorDotOpen]}
              onPress={() => {
                haptics.play();
                setColorPickerOpen((open) => !open);
              }}
            />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('onlineConfig.namePlaceholder')}
              placeholderTextColor={GameColors.textMuted}
              maxLength={20}
              style={styles.nameInput}
              autoCorrect={false}
            />
          </View>
          {colorPickerOpen && (
            <View style={styles.colorPalette}>
              {PLAYER_COLOR_PALETTE.map((c) => {
                const selected = c === color;
                return (
                  <Pressable
                    key={c}
                    style={[styles.paletteDot, { backgroundColor: c }, selected && styles.paletteDotSelected]}
                    onPress={() => {
                      haptics.colorPick();
                      setColor(c);
                      setColorPickerOpen(false);
                    }}
                  />
                );
              })}
            </View>
          )}
        </Section>

        <View style={isLandscape ? styles.grid : undefined}>
        {/* DICA */}
        <Section icon="chatbubble-ellipses" iconColor={GameColors.mint} title={t('onlineConfig.dica.title')} delay={60} landscape={isLandscape}>
          <View style={styles.dicaRow}>
            <Pressable
              onPress={() => {
                if (!voiceMode) haptics.selection();
                setVoiceMode(true);
              }}
              style={[styles.dicaCard, voiceMode && styles.dicaCardActive]}
            >
              <MaterialIcons name="record-voice-over" size={22} color={voiceMode ? GameColors.accent : GameColors.textMuted} />
              <Text style={[styles.dicaTitle, voiceMode && styles.dicaTitleActive]}>{t('onlineConfig.dica.voz.title')}</Text>
              <Text style={styles.dicaHint}>{t('onlineConfig.dica.voz.hint')}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (voiceMode) haptics.selection();
                setVoiceMode(false);
              }}
              style={[styles.dicaCard, !voiceMode && styles.dicaCardActive]}
            >
              <Ionicons name="chatbubble" size={22} color={!voiceMode ? GameColors.accent : GameColors.textMuted} />
              <Text style={[styles.dicaTitle, !voiceMode && styles.dicaTitleActive]}>{t('onlineConfig.dica.texto.title')}</Text>
              <Text style={styles.dicaHint}>{t('onlineConfig.dica.texto.hint')}</Text>
            </Pressable>
          </View>
        </Section>

        {/* TEMPO */}
        <Section icon="time-outline" iconColor={GameColors.coral} title={t('onlineConfig.tempo.title')} delay={120} landscape={isLandscape}>
          <Text style={styles.timeSubLabel}>{t('onlineConfig.tempo.dar')}</Text>
          <View style={styles.chipRow}>
            {TIME_OPTIONS.map((opt) => (
              <Chip
                key={`clue-${opt.value}`}
                label={opt.label}
                selected={clueTimeLimit === opt.value}
                onPress={() => setClueTimeLimit(opt.value)}
              />
            ))}
          </View>
          <View style={{ height: 12 }} />
          <Text style={styles.timeSubLabel}>{t('onlineConfig.tempo.adivinhar')}</Text>
          <View style={styles.chipRow}>
            {TIME_OPTIONS.map((opt) => (
              <Chip
                key={`guess-${opt.value}`}
                label={opt.label}
                selected={guessTimeLimit === opt.value}
                onPress={() => setGuessTimeLimit(opt.value)}
              />
            ))}
          </View>
        </Section>

        {/* PONTOS PARA VENCER */}
        <Section icon="trophy-outline" iconColor={GameColors.accent} title={t('onlineConfig.pontos.title')} delay={180} landscape={isLandscape}>
          <View style={styles.chipRow}>
            {SCORE_OPTIONS.map((s) => (
              <Chip key={s} label={String(s)} selected={winningScore === s} onPress={() => setWinningScore(s)} />
            ))}
          </View>
        </Section>

        {/* SKIPS */}
        <Section icon="play-skip-forward-outline" iconColor={GameColors.sky} title={t('onlineConfig.skips.title')} delay={240} landscape={isLandscape}>
          <View style={styles.chipRow}>
            {SKIP_OPTIONS.map((opt) => (
              <Chip key={opt.value} label={opt.label} selected={skips === opt.value} onPress={() => setSkips(opt.value)} />
            ))}
          </View>
        </Section>

        </View>
        <View style={{ height: 16 }} />
      </ScrollView>

      <View style={styles.footer}>
        {localError && (
          <Animated.View entering={FadeInDown.duration(200)} style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={GameColors.coral} />
            <Text style={styles.errorText}>{localError}</Text>
          </Animated.View>
        )}
        <Pressable
          onPress={handleCreate}
          disabled={!name.trim() || creating}
          style={({ pressed }) => [
            styles.cta,
            (!name.trim() || creating) && styles.ctaDisabled,
            pressed && name.trim() && !creating && styles.ctaPressed,
          ]}
        >
          {creating ? (
            <>
              <ActivityIndicator color={GameColors.text} />
              <Text style={styles.ctaText}>{t('onlineConfig.criandoSala')}</Text>
            </>
          ) : (
            <Text style={styles.ctaText}>{t('onlineConfig.criarSala')}</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: GameColors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  section: {
    backgroundColor: GameColors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  sectionLandscape: {
    width: '48.5%',
    marginBottom: 0,
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
  // Player row (Você)
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotOpen: {
    borderColor: GameColors.text,
  },
  nameInput: {
    flex: 1,
    backgroundColor: GameColors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
    color: GameColors.text,
    letterSpacing: 0,
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 6,
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
    transform: [{ scale: 1.08 }],
  },
  // Dica selector
  dicaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dicaCard: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: GameColors.surfaceLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dicaCardActive: {
    borderColor: GameColors.accent,
  },
  dicaTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: GameColors.textMuted,
  },
  dicaTitleActive: {
    color: GameColors.accent,
  },
  dicaHint: {
    fontSize: 11,
    color: GameColors.textMuted,
    lineHeight: 15,
  },
  // Chips
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
  },
  chipText: {
    fontSize: 15,
    fontWeight: '700',
    color: GameColors.textMuted,
  },
  chipTextSelected: {
    color: GameColors.accent,
  },
  timeSubLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: GameColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  // Footer CTA
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: GameColors.surface,
    gap: 10,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: GameColors.coral + '18',
    borderWidth: 1,
    borderColor: GameColors.coral + '55',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    flex: 1,
    color: GameColors.coral,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: GameColors.primary,
    paddingVertical: 16,
    borderRadius: 30,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaPressed: {
    transform: [{ scale: 0.97 }],
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '900',
    color: GameColors.text,
    letterSpacing: 1.5,
  },
});
