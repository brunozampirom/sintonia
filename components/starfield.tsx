import React, { useEffect, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

interface StarData {
  key: number;
  left: string;
  top: string;
  size: number;
  opacity: number;
  color: string;
  twinkle: boolean;
  twinkleDelay: number;
  twinkleDuration: number;
  twinkleMin: number;
}

interface StarfieldProps {
  count?: number;
}

function TwinklingStar({ star }: { star: StarData }) {
  const opacity = useSharedValue(star.opacity);

  useEffect(() => {
    opacity.value = withDelay(
      star.twinkleDelay,
      withRepeat(
        withSequence(
          withTiming(star.twinkleMin, { duration: star.twinkleDuration }),
          withTiming(star.opacity, { duration: star.twinkleDuration }),
        ),
        -1,
        false,
      ),
    );
  }, [opacity, star]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: star.left as unknown as number,
          top: star.top as unknown as number,
          width: star.size,
          height: star.size,
          borderRadius: star.size / 2,
          backgroundColor: star.color,
        },
        animatedStyle,
      ]}
    />
  );
}

// Android's mid-range haptic motors aren't the only weak spot — the GPU/UI
// thread also chokes on dozens of concurrent Reanimated loops. Cap the
// effective star count and twinkle rate on Android so we don't ship 35+
// infinite `withRepeat` animations to budget devices.
const MAX_STARS_ANDROID = 50;
const TWINKLE_PROB = Platform.OS === 'android' ? 0 : 0.35;

export function Starfield({ count = 80 }: StarfieldProps) {
  const effectiveCount =
    Platform.OS === 'android' ? Math.min(count, MAX_STARS_ANDROID) : count;
  const stars = useMemo(() => {
    const result: StarData[] = [];
    for (let i = 0; i < effectiveCount; i++) {
      const size = Math.random() < 0.15 ? 3 : Math.random() < 0.4 ? 2 : 1;
      const opacity = 0.15 + Math.random() * 0.35;
      const twinkle = Math.random() < TWINKLE_PROB;
      result.push({
        key: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: twinkle ? size + 0.5 : size,
        opacity: twinkle ? Math.max(opacity, 0.35) : opacity,
        color: Math.random() < 0.1 ? '#8B9DC3' : Math.random() < 0.05 ? '#F5A623' : '#FFFFFF',
        twinkle,
        twinkleDelay: Math.random() * 3000,
        twinkleDuration: 600 + Math.random() * 1200,
        twinkleMin: 0.02,
      });
    }
    return result;
  }, [effectiveCount]);

  return (
    <View style={styles.container} pointerEvents="none">
      {stars.map((s) =>
        s.twinkle ? (
          <TwinklingStar key={s.key} star={s} />
        ) : (
          <View
            key={s.key}
            style={[
              styles.star,
              {
                left: s.left as unknown as number,
                top: s.top as unknown as number,
                width: s.size,
                height: s.size,
                borderRadius: s.size / 2,
                backgroundColor: s.color,
                opacity: s.opacity,
              },
            ]}
          />
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
  },
});
