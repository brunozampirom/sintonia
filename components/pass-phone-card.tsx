import { GameButton } from '@/components/game-button';
import { GameColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface PassPhoneCardProps {
  name: string;
  color: string;
  ctaLabel: string;
  message: string;
  onPress: () => void;
}

export function PassPhoneCard({ name, color, ctaLabel, message, onPress }: PassPhoneCardProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      style={[styles.overlay, { backgroundColor: `${color}22` }]}
    >
      <Animated.View
        entering={FadeIn.duration(240)}
        style={[styles.card, { borderColor: color }]}
      >
        <View style={[styles.icon, { backgroundColor: color }]}>
          <Ionicons name="phone-portrait-outline" size={36} color={GameColors.background} />
        </View>
        <Text style={styles.message}>{message}</Text>
        <Text style={[styles.name, { color }]} numberOfLines={2}>
          {name}
        </Text>
        <View style={styles.button}>
          <GameButton title={ctaLabel} onPress={onPress} color={color} textColor={GameColors.background} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: GameColors.surface,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 14,
    borderWidth: 3,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: GameColors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 1,
  },
  name: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  button: {
    marginTop: 12,
  },
});
