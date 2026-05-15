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
}

interface StarfieldProps {
  count?: number;
}

// Android's mid-range GPUs choke on per-star animation loops, so skip twinkle
// entirely there. On iOS we run exactly two shared loops (groups A + B in
// opposite phase) and let RN multiply parent×child opacity instead of
// animating each star individually.
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
      });
    }
    return result;
  }, [effectiveCount]);

  const groupA = useSharedValue(1);
  const groupB = useSharedValue(1);

  useEffect(() => {
    if (Platform.OS === 'android') return;
    groupA.value = withRepeat(
      withSequence(
        withTiming(0.25, { duration: 900 }),
        withTiming(1, { duration: 900 }),
      ),
      -1,
      false,
    );
    groupB.value = withDelay(
      550,
      withRepeat(
        withSequence(
          withTiming(0.35, { duration: 1100 }),
          withTiming(1, { duration: 1100 }),
        ),
        -1,
        false,
      ),
    );
  }, [groupA, groupB]);

  const styleA = useAnimatedStyle(() => ({ opacity: groupA.value }));
  const styleB = useAnimatedStyle(() => ({ opacity: groupB.value }));

  const staticStars = stars.filter((s) => !s.twinkle);
  const groupAStars = stars.filter((s) => s.twinkle && s.key % 2 === 0);
  const groupBStars = stars.filter((s) => s.twinkle && s.key % 2 === 1);

  return (
    <View style={styles.container} pointerEvents="none">
      {staticStars.map((s) => (
        <View key={s.key} style={starStyle(s)} />
      ))}
      <Animated.View style={[styles.container, styleA]} pointerEvents="none">
        {groupAStars.map((s) => (
          <View key={s.key} style={starStyle(s)} />
        ))}
      </Animated.View>
      <Animated.View style={[styles.container, styleB]} pointerEvents="none">
        {groupBStars.map((s) => (
          <View key={s.key} style={starStyle(s)} />
        ))}
      </Animated.View>
    </View>
  );
}

function starStyle(s: StarData) {
  return [
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
  ];
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
