// Shown when only the host remains in a mid-game room — every other player
// has disconnected or left. Blocks the game UI so they don't sit looking at
// a stalled board; gives them an explicit "Desconectar" exit.

import { GameColors } from '@/constants/theme';
import { haptics } from '@/lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface AloneRoomModalProps {
  visible: boolean;
  onDisconnect: () => void;
}

export function AloneRoomModal({ visible, onDisconnect }: AloneRoomModalProps) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="fade">
      <Animated.View entering={FadeIn.duration(180)} style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="hourglass-outline" size={36} color={GameColors.accent} />
          </View>
          <Text style={styles.title}>{t('aloneRoom.title')}</Text>
          <Text style={styles.body}>{t('aloneRoom.body')}</Text>
          <Pressable
            onPress={() => { haptics.play(); onDisconnect(); }}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          >
            <Text style={styles.ctaText}>{t('aloneRoom.disconnect')}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: GameColors.surface,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: GameColors.accent + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: GameColors.text,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: GameColors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 8,
  },
  cta: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: GameColors.coral,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  ctaPressed: { transform: [{ scale: 0.97 }] },
  ctaText: {
    fontSize: 14,
    fontWeight: '900',
    color: GameColors.background,
    letterSpacing: 1.2,
  },
});
