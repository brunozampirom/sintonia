import { GameButton } from '@/components/game-button';
import { GameColors } from '@/constants/theme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { haptics } from '@/lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
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
  const { isLandscape } = useResponsiveLayout();

  useEffect(() => {
    haptics.passPhone();
  }, []);

  const handlePress = () => {
    haptics.iAmHere();
    onPress();
  };

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      style={[styles.overlay, { backgroundColor: `${color}22` }]}
    >
      <Animated.View
        entering={FadeIn.duration(240)}
        style={[styles.card, isLandscape && styles.cardLandscape, { borderColor: color }]}
      >
        <View style={[styles.icon, isLandscape && styles.iconLandscape, { backgroundColor: color }]}>
          <Ionicons name="phone-portrait-outline" size={isLandscape ? 26 : 36} color={GameColors.background} />
        </View>
        <Text style={[styles.message, isLandscape && styles.messageLandscape]}>{message}</Text>
        <Text style={[styles.name, isLandscape && styles.nameLandscape, { color }]} numberOfLines={2}>
          {name}
        </Text>
        <View style={[styles.button, isLandscape && styles.buttonLandscape]}>
          <GameButton title={ctaLabel} onPress={handlePress} color={color} textColor={GameColors.background} />
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
  cardLandscape: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
    maxWidth: 320,
    borderRadius: 18,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconLandscape: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 0,
  },
  message: {
    fontSize: 14,
    color: GameColors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 1,
  },
  messageLandscape: {
    fontSize: 11,
  },
  name: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  nameLandscape: {
    fontSize: 24,
  },
  button: {
    marginTop: 12,
  },
  buttonLandscape: {
    marginTop: 4,
  },
});
