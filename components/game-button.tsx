import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { GameColors } from '@/constants/theme';

interface GameButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  variant?: 'primary' | 'secondary';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GameButton({
  title,
  onPress,
  color,
  textColor,
  variant = 'primary',
}: GameButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bgColor =
    color ??
    (variant === 'primary' ? GameColors.primary : 'transparent');
  const borderColor = variant === 'secondary' ? GameColors.textMuted : 'transparent';
  const txtColor =
    textColor ?? GameColors.text;

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
        styles.button,
        {
          backgroundColor: bgColor,
          borderColor: borderColor,
          borderWidth: variant === 'secondary' ? 2 : 0,
        },
        animatedStyle,
      ]}
    >
      <Text style={[styles.text, { color: txtColor }]}>{title}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 200,
  },
  text: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
