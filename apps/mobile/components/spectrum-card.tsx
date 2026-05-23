import { GameColors } from '@/constants/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface SpectrumCardProps {
  left: string;
  right: string;
}

export function SpectrumCard({ left, right }: SpectrumCardProps) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.card}>
      <View style={styles.labelContainer}>
        <Animated.Text style={styles.arrow}>←</Animated.Text>
        <Animated.Text style={styles.label} numberOfLines={3}>
          {left}
        </Animated.Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.labelContainer}>
        <Animated.Text style={styles.label} numberOfLines={3}>
          {right}
        </Animated.Text>
        <Animated.Text style={styles.arrow}>→</Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GameColors.dialBorder,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    minHeight: 70,
    shadowRadius: 8,
    elevation: 6,
  },
  labelContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    flex: 1,
    color: GameColors.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  arrow: {
    color: GameColors.text,
    fontSize: 18,
    fontWeight: '700',
    opacity: 0.7,
  },
  divider: {
    width: 2,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
    marginHorizontal: 8,
  },
});
