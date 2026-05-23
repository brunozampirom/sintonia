// Deeplink target — opened when the user follows a
// https://sintonia.party/join/CODE link with the app installed. Lets
// the guest pick their name + color before going into the lobby.

import { HeaderIconButton, HeaderSpacer, HeaderTitle, ScreenHeader } from '@/components/screen-header';
import { GameColors } from '@/constants/theme';
import { useSettings } from '@/contexts/settings-context';
import { haptics } from '@/lib/haptics';
import { isValidRoomCode, normalizeRoomCode } from '@/lib/room-codes';
import { Ionicons } from '@expo/vector-icons';
import { PLAYER_COLOR_PALETTE } from '@sintonia/game-core';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function JoinByCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const code = normalizeRoomCode(params.code ?? '');
  const validCode = isValidRoomCode(code);

  const { settings } = useSettings();

  const [name, setName] = useState(settings.playerNames[0] ?? 'Jogador');
  const [color, setColor] = useState(
    settings.playerColors[0] ?? PLAYER_COLOR_PALETTE[0],
  );

  const canContinue = useMemo(() => name.trim().length >= 1 && validCode, [name, validCode]);

  function handleEnter() {
    haptics.play();
    if (!canContinue) return;
    router.replace({
      pathname: '/lobby/[code]',
      params: { code, name: name.trim(), color },
    });
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader>
        <HeaderIconButton icon="chevron-back" onPress={() => router.back()} />
        <HeaderTitle>Entrar na sala</HeaderTitle>
        <HeaderSpacer />
      </ScreenHeader>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.codeBlock}>
          <Text style={styles.eyebrow}>Convite</Text>
          <Text style={styles.codeText}>{validCode ? code : '???'}</Text>
          {!validCode && (
            <Text style={styles.errorHint}>Código inválido. Confere o link e tenta de novo.</Text>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.field}>
          <Text style={styles.label}>Seu nome</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Como você quer aparecer pra galera"
            placeholderTextColor={GameColors.textMuted}
            style={styles.input}
            maxLength={20}
            returnKeyType="done"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.field}>
          <Text style={styles.label}>Sua cor</Text>
          <View style={styles.colorGrid}>
            {PLAYER_COLOR_PALETTE.map((c) => (
              <Pressable
                key={c}
                onPress={() => {
                  haptics.play();
                  setColor(c);
                }}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c },
                  color === c && styles.colorSwatchSelected,
                ]}
              >
                {color === c && (
                  <Ionicons name="checkmark" size={20} color={GameColors.background} />
                )}
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <View style={styles.spacer} />

        <Pressable
          onPress={handleEnter}
          disabled={!canContinue}
          style={({ pressed }) => [
            styles.cta,
            canContinue ? styles.ctaEnabled : styles.ctaDisabled,
            pressed && canContinue && styles.ctaPressed,
          ]}
        >
          <Text style={styles.ctaText}>ENTRAR NA SALA</Text>
        </Pressable>
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
    gap: 20,
  },
  codeBlock: {
    backgroundColor: GameColors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GameColors.primary + '33',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: GameColors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  codeText: {
    fontSize: 48,
    fontWeight: '900',
    color: GameColors.text,
    letterSpacing: 8,
    textShadowColor: GameColors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    paddingLeft: 8,
  },
  errorHint: {
    color: GameColors.coral,
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },
  field: {
    gap: 8,
  },
  label: {
    color: GameColors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: GameColors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: GameColors.text,
    borderWidth: 1,
    borderColor: GameColors.surfaceLight,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: GameColors.text,
    transform: [{ scale: 1.08 }],
  },
  spacer: {
    flex: 1,
  },
  cta: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  ctaEnabled: {
    backgroundColor: GameColors.primary,
  },
  ctaDisabled: {
    backgroundColor: GameColors.surface,
    opacity: 0.6,
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
