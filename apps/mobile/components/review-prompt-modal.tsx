import { GameColors } from '@/constants/theme';
import { haptics } from '@/lib/haptics';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface ReviewPromptModalProps {
  onResponse: (accepted: boolean) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ChoiceButton({
  label,
  icon,
  onPress,
  variant,
}: {
  label: string;
  icon: 'thumbs-up' | 'thumbs-down';
  onPress: () => void;
  variant: 'primary' | 'secondary';
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isPrimary = variant === 'primary';
  const bgColor = isPrimary ? GameColors.primary : 'transparent';
  const borderColor = isPrimary ? 'transparent' : GameColors.textMuted;
  const txtColor = GameColors.text;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.93, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      style={[
        styles.choiceButton,
        {
          backgroundColor: bgColor,
          borderColor,
          borderWidth: isPrimary ? 0 : 2,
        },
        animatedStyle,
      ]}
    >
      <FontAwesome6 name={icon} size={18} color={txtColor} solid />
      <Text style={[styles.choiceText, { color: txtColor }]}>{label}</Text>
    </AnimatedPressable>
  );
}

export function ReviewPromptModal({ onResponse }: ReviewPromptModalProps) {
  const { t } = useTranslation();

  const handleResponse = (accepted: boolean) => {
    haptics.selection();
    onResponse(accepted);
  };

  return (
    <Animated.View entering={FadeIn.duration(180)} style={styles.overlay}>
      <Animated.View entering={FadeIn.duration(240)} style={styles.card}>
        <View style={styles.icon}>
          <Ionicons name="heart" size={36} color={GameColors.background} />
        </View>
        <Text style={styles.title}>{t('game.review.title')}</Text>
        <Text style={styles.description}>{t('game.review.description')}</Text>
        <View style={styles.buttonRow}>
          <ChoiceButton
            label={t('game.review.no')}
            icon="thumbs-down"
            variant="secondary"
            onPress={() => handleResponse(false)}
          />
          <ChoiceButton
            label={t('game.review.yes')}
            icon="thumbs-up"
            variant="primary"
            onPress={() => handleResponse(true)}
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 60,
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
    gap: 18,
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
    backgroundColor: GameColors.primary,
  },
  title: {
    fontSize: 22,
    color: GameColors.text,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 13,
    color: GameColors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: -8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  choiceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    ...Platform.select({ web: { cursor: 'pointer' as const } }),
  },
  choiceText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
