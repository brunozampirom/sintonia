import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { GameColors } from '@/constants/theme';

const PARTICLE_COUNT = 50;
const COLORS = [
  GameColors.primary,
  GameColors.accent,
  GameColors.yellow,
  GameColors.pink,
  GameColors.coral,
  GameColors.lavender,
  GameColors.sky,
  GameColors.mint,
  GameColors.orange,
];

interface ParticleData {
  key: number;
  color: string;
  size: number;
  startX: number;
  endX: number;
  endY: number;
  rotation: number;
  delay: number;
  duration: number;
  shape: 'square' | 'rect';
}

function ConfettiParticle({ particle, trigger }: { particle: ParticleData; trigger: number }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    progress.value = 0;
    opacity.value = 0;

    progress.value = withDelay(
      particle.delay,
      withTiming(1, { duration: particle.duration, easing: Easing.out(Easing.quad) }),
    );
    opacity.value = withDelay(
      particle.delay,
      withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(particle.duration - 400, withTiming(0, { duration: 300 })),
      ),
    );
  }, [trigger, particle, progress, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const x = particle.startX + (particle.endX - particle.startX) * t;
    const y = -20 + particle.endY * t;
    const rotate = particle.rotation * t;

    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${rotate}deg` },
      ],
      opacity: opacity.value,
    };
  });

  const w = particle.shape === 'rect' ? particle.size * 2.5 : particle.size;
  const h = particle.size;

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: w,
          height: h,
          borderRadius: particle.size * 0.2,
          backgroundColor: particle.color,
        },
        animatedStyle,
      ]}
    />
  );
}

interface ConfettiProps {
  active: boolean;
}

export function Confetti({ active }: ConfettiProps) {
  const { width } = useWindowDimensions();
  const triggerCount = useSharedValue(0);
  const [trigger, setTrigger] = React.useState(0);

  useEffect(() => {
    if (active) {
      triggerCount.value = triggerCount.value + 1;
      setTrigger((t) => t + 1);
    }
  }, [active, triggerCount]);

  const particles = useMemo<ParticleData[]>(() => {
    const result: ParticleData[] = [];
    const centerX = width / 2;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const spread = width * 0.8;
      result.push({
        key: i,
        color: COLORS[i % COLORS.length],
        size: 4 + Math.random() * 6,
        startX: centerX + (Math.random() - 0.5) * 60,
        endX: centerX + (Math.random() - 0.5) * spread,
        endY: 200 + Math.random() * 500,
        rotation: (Math.random() - 0.5) * 720,
        delay: Math.random() * 300,
        duration: 1200 + Math.random() * 800,
        shape: Math.random() < 0.5 ? 'square' : 'rect',
      });
    }
    return result;
  }, [width]);

  if (trigger === 0) return null;

  return (
    <>
      {particles.map((p) => (
        <ConfettiParticle key={p.key} particle={p} trigger={trigger} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
