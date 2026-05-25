// Tela única de entrada manual numa sala: código + nome + cor num
// scroll só. Após CONTINUAR vai direto pro lobby — sem passar pela
// /join/[code] (que continua sendo o deeplink target).

import { HeaderIconButton, HeaderSpacer, HeaderTitle, ScreenHeader } from '@/components/screen-header';
import { GameColors } from '@/constants/theme';
import { useNetwork } from '@/contexts/network-context';
import { useSettings } from '@/contexts/settings-context';
import { haptics } from '@/lib/haptics';
import { isValidRoomCode, normalizeRoomCode } from '@/lib/room-codes';
import { Ionicons } from '@expo/vector-icons';
import { PLAYER_COLOR_PALETTE } from '@sintonia/game-core';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SectionProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  title: string;
  children: React.ReactNode;
  delay?: number;
}

function Section({ icon, iconColor, title, children, delay = 0 }: SectionProps) {
  return (
    <Animated.View entering={FadeInDown.duration(400).delay(delay)} style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color={iconColor} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </Animated.View>
  );
}

export default function JoinCodeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const { connect, disconnect, state, status, lastError } = useNetwork();
  const params = useLocalSearchParams<{ code?: string }>();
  const prefilledCode = normalizeRoomCode(params.code ?? '');
  const hasPrefilledCode = isValidRoomCode(prefilledCode);

  const [draft, setDraft] = useState(hasPrefilledCode ? prefilledCode : '');
  const [name, setName] = useState(settings.onlinePlayerName);
  const [color, setColor] = useState(
    settings.onlinePlayerColor || settings.playerColors[0] || PLAYER_COLOR_PALETTE[0],
  );
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const code = normalizeRoomCode(draft);
  const validCode = useMemo(() => isValidRoomCode(code), [code]);
  const canContinue = validCode && name.trim().length > 0 && !pendingCode;

  function clearPendingTimeout() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function abort(message: string) {
    clearPendingTimeout();
    disconnect();
    setPendingCode(null);
    setLocalError(message);
  }

  // Success path: server confirmed the room with matching code → navigate.
  useEffect(() => {
    if (!pendingCode) return;
    if (status === 'connected' && state?.code === pendingCode) {
      clearPendingTimeout();
      setPendingCode(null);
      setLocalError(null);
      router.replace({
        pathname: '/lobby/[code]',
        params: { code: pendingCode, name: name.trim(), color },
      });
    }
  }, [pendingCode, status, state, router, name, color]);

  // Failure paths: server-side error (INVALID_CODE, room doesn't exist) or
  // connection itself failed.
  useEffect(() => {
    if (!pendingCode) return;
    if (lastError) {
      abort(lastError.message || t('joinCode.errors.joinFailed'));
    } else if (status === 'error') {
      abort(t('joinCode.errors.connect'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, lastError, pendingCode]);

  useEffect(() => {
    return () => {
      clearPendingTimeout();
      if (pendingCode) disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleContinue() {
    if (!canContinue) return;
    haptics.play();
    setLocalError(null);
    updateSettings({
      onlinePlayerName: name.trim(),
      onlinePlayerColor: color,
    });
    setPendingCode(code);
    void connect({ code, name: name.trim(), color, mode: 'guest' });
    clearPendingTimeout();
    timeoutRef.current = setTimeout(() => {
      abort(t('joinCode.errors.timeout'));
    }, 6000);
  }

  const checking = !!pendingCode;

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader>
        <HeaderIconButton icon="chevron-back" onPress={() => router.back()} />
        <HeaderTitle>{t('joinCode.title')}</HeaderTitle>
        <HeaderSpacer />
      </ScreenHeader>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* CÓDIGO */}
          <Section icon="key-outline" iconColor={GameColors.sky} title={t('joinCode.codigoSala')} delay={0}>
            <TextInput
              value={draft}
              onChangeText={(v) => setDraft(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
              placeholder={t('joinCode.codigoPlaceholder')}
              placeholderTextColor={GameColors.textMuted + '66'}
              style={styles.codeInput}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={4}
              autoFocus={!hasPrefilledCode}
              returnKeyType="next"
              keyboardAppearance="dark"
            />
            <Text style={styles.codeHint}>{t('joinCode.codigoHint')}</Text>
          </Section>

          {/* VOCÊ */}
          <Section icon="person-circle-outline" iconColor={GameColors.secondary} title={t('joinCode.voce')} delay={80}>
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
                placeholder={t('joinCode.namePlaceholder')}
                placeholderTextColor={GameColors.textMuted}
                maxLength={20}
                style={styles.nameInput}
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={handleContinue}
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
        </ScrollView>

        <View style={styles.footer}>
          {localError && (
            <Animated.View entering={FadeInDown.duration(200)} style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={GameColors.coral} />
              <Text style={styles.errorText}>{localError}</Text>
            </Animated.View>
          )}
          <Pressable
            onPress={handleContinue}
            disabled={!canContinue}
            style={({ pressed }) => [
              styles.cta,
              !canContinue && styles.ctaDisabled,
              pressed && canContinue && styles.ctaPressed,
            ]}
          >
            {checking ? (
              <>
                <ActivityIndicator color={GameColors.background} />
                <Text style={styles.ctaText}>{t('joinCode.entrando')}</Text>
              </>
            ) : (
              <Text style={styles.ctaText}>{t('joinCode.entrar')}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: GameColors.background },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  // Section
  section: {
    backgroundColor: GameColors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GameColors.text,
  },
  // Code input
  codeInput: {
    backgroundColor: GameColors.surfaceLight,
    borderRadius: 14,
    paddingVertical: 22,
    paddingHorizontal: 16,
    fontSize: 42,
    fontWeight: '900',
    color: GameColors.text,
    letterSpacing: 10,
    textAlign: 'center',
    borderWidth: 1.5,
    borderColor: GameColors.sky + '55',
  },
  codeHint: {
    fontSize: 12,
    color: GameColors.textMuted,
    textAlign: 'center',
  },
  // Player row
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
  colorDotOpen: { borderColor: GameColors.text },
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
    backgroundColor: GameColors.sky,
    paddingVertical: 16,
    borderRadius: 30,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaPressed: { transform: [{ scale: 0.97 }] },
  ctaText: {
    fontSize: 16,
    fontWeight: '900',
    color: GameColors.background,
    letterSpacing: 1.5,
  },
});
