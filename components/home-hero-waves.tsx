import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

interface HomeHeroWavesProps {
  width: number;
  height: number;
}

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 340;

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface WaveLayerProps {
  width: number;
  height: number;
  t: SharedValue<number>;
  ampX: number;
  ampY: number;
  periodX: number;
  periodY: number;
  phaseX: number;
  phaseY: number;
  opacityPeriod: number;
  opacityPhase: number;
  widthPeriod: number;
  widthPhase: number;
  d: string;
  gradientId: 'hh-wave1' | 'hh-wave2' | 'hh-wave3' | 'hh-wave4';
  strokeWidth: number;
  opacity: number;
}

const OPACITY_DIP = 0.18; // wave dims by up to ~18% at the trough
const WIDTH_DIP = 1; // strokeWidth oscillates by ±1px around the base

function WaveLayer({
  width,
  height,
  t,
  ampX,
  ampY,
  periodX,
  periodY,
  phaseX,
  phaseY,
  opacityPeriod,
  opacityPhase,
  widthPeriod,
  widthPhase,
  d,
  gradientId,
  strokeWidth,
  opacity,
}: WaveLayerProps) {
  const style = useAnimatedStyle(() => {
    const s = Math.sin((t.value / opacityPeriod) * Math.PI * 2 + opacityPhase);
    // remap sin from [-1, 1] to [1 - dip, 1]
    const opacityMult = 1 - OPACITY_DIP * (1 - s) * 0.5;
    return {
      opacity: opacityMult,
      transform: [
        { translateX: Math.sin((t.value / periodX) * Math.PI * 2 + phaseX) * ampX },
        { translateY: Math.sin((t.value / periodY) * Math.PI * 2 + phaseY) * ampY },
      ],
    };
  });

  const animatedPathProps = useAnimatedProps(() => ({
    strokeWidth:
      strokeWidth + Math.sin((t.value / widthPeriod) * Math.PI * 2 + widthPhase) * WIDTH_DIP,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}>
        <Defs>
          {gradientId === 'hh-wave1' && (
            <LinearGradient id="hh-wave1" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#FF006E" />
              <Stop offset="35%" stopColor="#FF4D6D" />
              <Stop offset="65%" stopColor="#FF8500" />
              <Stop offset="100%" stopColor="#FFBE0B" />
            </LinearGradient>
          )}
          {gradientId === 'hh-wave2' && (
            <LinearGradient id="hh-wave2" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#FFBE0B" />
              <Stop offset="50%" stopColor="#8AC926" />
              <Stop offset="100%" stopColor="#06D6A0" />
            </LinearGradient>
          )}
          {gradientId === 'hh-wave3' && (
            <LinearGradient id="hh-wave3" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#06D6A0" />
              <Stop offset="45%" stopColor="#118AB2" />
              <Stop offset="100%" stopColor="#7B2FF7" />
            </LinearGradient>
          )}
          {gradientId === 'hh-wave4' && (
            <LinearGradient id="hh-wave4" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#7B2FF7" />
              <Stop offset="55%" stopColor="#C77DFF" />
              <Stop offset="100%" stopColor="#FF006E" />
            </LinearGradient>
          )}
        </Defs>
        <AnimatedPath
          animatedProps={animatedPathProps}
          d={d}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={opacity}
        />
      </Svg>
    </Animated.View>
  );
}

export function HomeHeroWaves({ width, height }: HomeHeroWavesProps) {
  // t tracks real time (in seconds) via a per-frame callback. No looping or
  // resetting — just continuously increasing. sin() of it stays smooth forever.
  const t = useSharedValue(0);
  useFrameCallback((frameInfo) => {
    t.value = frameInfo.timestamp / 1000;
  }, true);

  return (
    <View style={[styles.wrap, { width, height }]} pointerEvents="none">
      {/* Static background: ambient blobs */}
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <RadialGradient id="hh-ambient1" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FF006E" stopOpacity="0.22" />
            <Stop offset="100%" stopColor="#FF006E" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="hh-ambient2" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#7B2FF7" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#7B2FF7" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="hh-ambient3" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#06D6A0" stopOpacity="0.16" />
            <Stop offset="100%" stopColor="#06D6A0" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="150" cy="120" r="150" fill="url(#hh-ambient1)" />
        <Circle cx="450" cy="100" r="140" fill="url(#hh-ambient2)" />
        <Circle cx="420" cy="190" r="130" fill="url(#hh-ambient3)" />
      </Svg>

      {/* Each wave drifts up to 3px on X and Y using continuous sine — no flicker */}
      <WaveLayer
        width={width}
        height={height}
        t={t}
        ampX={3}
        ampY={3}
        periodX={16}
        periodY={13}
        phaseX={0}
        phaseY={0}
        opacityPeriod={11}
        opacityPhase={0.7}
        widthPeriod={9.3}
        widthPhase={1.8}
        d="M -20 250 C 80 100, 200 260, 300 170 C 400 80, 520 220, 620 110"
        gradientId="hh-wave1"
        strokeWidth={18}
        opacity={0.92}
      />
      <WaveLayer
        width={width}
        height={height}
        t={t}
        ampX={3}
        ampY={3}
        periodX={14}
        periodY={17}
        phaseX={Math.PI / 2}
        phaseY={Math.PI / 3}
        opacityPeriod={8.5}
        opacityPhase={2.3}
        widthPeriod={12.4}
        widthPhase={3.4}
        d="M -20 180 C 100 260, 220 110, 300 190 C 380 270, 500 110, 620 200"
        gradientId="hh-wave2"
        strokeWidth={13}
        opacity={0.85}
      />
      <WaveLayer
        width={width}
        height={height}
        t={t}
        ampX={3}
        ampY={3}
        periodX={18}
        periodY={12}
        phaseX={Math.PI}
        phaseY={Math.PI / 4}
        opacityPeriod={13}
        opacityPhase={4.1}
        widthPeriod={10.7}
        widthPhase={5.2}
        d="M -20 150 C 120 220, 240 90, 300 170 C 360 250, 480 90, 620 170"
        gradientId="hh-wave3"
        strokeWidth={9}
        opacity={0.75}
      />
      <WaveLayer
        width={width}
        height={height}
        t={t}
        ampX={3}
        ampY={3}
        periodX={15}
        periodY={19}
        phaseX={(Math.PI * 3) / 2}
        phaseY={(Math.PI * 2) / 3}
        opacityPeriod={9.7}
        opacityPhase={5.8}
        widthPeriod={14.2}
        widthPhase={0.4}
        d="M -20 220 C 110 130, 230 270, 300 180 C 370 90, 500 260, 620 160"
        gradientId="hh-wave4"
        strokeWidth={6}
        opacity={0.65}
      />

      {/* Foreground: orb + particles (static) */}
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <RadialGradient id="hh-orb" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <Stop offset="30%" stopColor="#FFBE0B" stopOpacity="0.55" />
            <Stop offset="60%" stopColor="#FF006E" stopOpacity="0.18" />
            <Stop offset="100%" stopColor="#FF006E" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={300} cy={175} r={60} fill="url(#hh-orb)" />
        <Circle cx={300} cy={175} r={18} fill="#FFFFFF" fillOpacity={0.95} />
        <Circle cx={300} cy={175} r={10} fill="#FFFFFF" fillOpacity={0.4} />
        <Circle cx={300} cy={175} r={38} fill="none" stroke="#FFFFFF" strokeWidth={0.6} opacity={0.15} />
        <Circle cx={300} cy={175} r={68} fill="none" stroke="#FFFFFF" strokeWidth={0.5} opacity={0.08} />

        <Circle cx={70} cy={60} r={2} fill="#FF006E" opacity={0.6} />
        <Circle cx={530} cy={50} r={1.8} fill="#FFBE0B" opacity={0.6} />
        <Circle cx={90} cy={300} r={1.6} fill="#06D6A0" opacity={0.6} />
        <Circle cx={510} cy={300} r={2} fill="#C77DFF" opacity={0.55} />
        <Circle cx={200} cy={40} r={1.4} fill="#118AB2" opacity={0.6} />
        <Circle cx={400} cy={320} r={1.4} fill="#FF8500" opacity={0.55} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    position: 'relative',
  },
});
