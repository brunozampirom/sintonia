// Sticky banner shown when the WebSocket connection isn't healthy.
// Rendered above the screen content in lobby and online-game so the
// player has continuous visual feedback that something's up. Hidden
// when status is 'connected' or 'idle'.

import { GameColors } from '@/constants/theme';
import { useNetwork } from '@/contexts/network-context';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export function ConnectionStatusBanner() {
  const { t } = useTranslation();
  const { status, retryAttempt, lastError } = useNetwork();

  if (status === 'connected' || status === 'idle') return null;

  // Server-side rejection (invalid code, already started, etc.) — show the
  // error text instead of the generic "reconnecting" copy.
  const isTerminal = status === 'error' || status === 'disconnected';
  const showServerError = isTerminal && lastError;

  const { icon, text, color } = (() => {
    if (showServerError) {
      return { icon: 'alert-circle' as const, text: lastError.message, color: GameColors.coral };
    }
    if (status === 'reconnecting') {
      return {
        icon: 'sync' as const,
        text: retryAttempt > 0 ? t('connection.reconectandoCount', { n: retryAttempt }) : t('connection.reconectando'),
        color: GameColors.yellow,
      };
    }
    if (status === 'connecting') {
      return { icon: 'cloud-outline' as const, text: t('connection.conectando'), color: GameColors.sky };
    }
    if (status === 'disconnected') {
      return { icon: 'cloud-offline-outline' as const, text: t('connection.desconectado'), color: GameColors.textMuted };
    }
    // status === 'error'
    return { icon: 'warning' as const, text: t('connection.falha'), color: GameColors.coral };
  })();

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      style={[styles.banner, { backgroundColor: color + '22', borderColor: color }]}
    >
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.text, { color }]}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'center',
    marginVertical: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
