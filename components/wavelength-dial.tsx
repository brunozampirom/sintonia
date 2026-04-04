import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  withSpring,
  SharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { GameColors } from '@/constants/theme';
import { SCORE_ZONES } from '@/constants/game';

const DIAL_SIZE = 300;
const CENTER_X = DIAL_SIZE / 2; // 150 — pivot X in both SVG and View coords
const CENTER_Y = DIAL_SIZE / 2; // 150 — pivot Y (semicircle baseline)
const SVG_HEIGHT = CENTER_Y + 20; // 170 — extra padding below baseline
const ARC_RADIUS = CENTER_X - 15; // 135
const NEEDLE_LENGTH = ARC_RADIUS - 10; // 125
const NEEDLE_HEIGHT = 4;

interface WavelengthDialProps {
  targetAngle: number; // 0 = left, 180 = right
  guessAngle: SharedValue<number>;
  showTarget: boolean;
  interactive: boolean;
  showGuess: boolean;
  onGuessChange?: (angle: number) => void;
}

/**
 * Convert a dial angle (0°=left, 90°=top, 180°=right) + radius
 * to SVG cartesian coordinates with origin at (centerX, centerY).
 *
 * Internally maps dial angles so that 0° is at the left of the semicircle
 * and 180° is at the right, matching the standard board game layout.
 */
function polarToCartesian(centerX: number, centerY: number, radius: number, dialAngleDeg: number) {
  // dial 0° = left = math 180°, dial 180° = right = math 0°
  const mathAngleRad = ((180 - dialAngleDeg) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(mathAngleRad),
    y: centerY - radius * Math.sin(mathAngleRad), // SVG Y is inverted
  };
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? '1' : '0';
  // SVG arc: sweep-flag 1 = clockwise
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function describeWedge(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
) {
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle > 180 ? '1' : '0';
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

/**
 * Given a touch point relative to the dial wrapper, compute the dial angle (0-180).
 */
function touchToDialAngle(touchX: number, touchY: number): number {
  'worklet';
  // Translate so origin is at the semicircle center
  const dx = touchX - CENTER_X;
  const dy = CENTER_Y - touchY; // flip Y so up is positive

  // atan2 gives: 0° = right, 90° = up, 180° = left (in standard math)
  let mathAngle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Clamp to upper semicircle
  if (mathAngle < 0) mathAngle = 0;
  if (mathAngle > 180) mathAngle = 180;

  // Convert to dial angle: dial 0° = left (math 180°), dial 180° = right (math 0°)
  return 180 - mathAngle;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function WavelengthDial({
  targetAngle,
  guessAngle,
  showTarget,
  interactive,
  showGuess,
  onGuessChange,
}: WavelengthDialProps) {
  // Needle rotation: the View needle starts pointing right (0° CSS).
  // dial 0° (left) → CSS rotate 180°
  // dial 90° (up)  → CSS rotate -90°  (i.e. 90°)
  // dial 180° (right) → CSS rotate 0°
  // Formula: -(180 - dialAngle) = dialAngle - 180
  const needleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${guessAngle.value - 180}deg` }],
  }));

  const panGesture = Gesture.Pan()
    .enabled(interactive)
    .onUpdate((event) => {
      'worklet';
      const dialAngle = touchToDialAngle(event.x, event.y);
      guessAngle.value = dialAngle;
      if (onGuessChange) {
        runOnJS(onGuessChange)(dialAngle);
      }
    });

  const tapGesture = Gesture.Tap()
    .enabled(interactive)
    .onEnd((event) => {
      'worklet';
      const dialAngle = touchToDialAngle(event.x, event.y);
      guessAngle.value = withSpring(dialAngle, { damping: 15, stiffness: 150 });
      if (onGuessChange) {
        runOnJS(onGuessChange)(dialAngle);
      }
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  // Tick marks (memoized — static)
  const ticks = useMemo(() => {
    const result = [];
    for (let i = 0; i <= 180; i += 9) {
      const isMajor = i % 45 === 0;
      const outerR = ARC_RADIUS + 2;
      const innerR = isMajor ? ARC_RADIUS - 8 : ARC_RADIUS - 4;
      const p1 = polarToCartesian(CENTER_X, CENTER_Y, outerR, i);
      const p2 = polarToCartesian(CENTER_X, CENTER_Y, innerR, i);
      result.push(
        <Line
          key={`tick-${i}`}
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke={GameColors.textMuted}
          strokeWidth={isMajor ? 1.5 : 0.75}
          opacity={0.5}
        />,
      );
    }
    return result;
  }, []);

  // Scoring zones (wedges) — only when target is visible
  const zones = showTarget
    ? [
        { threshold: SCORE_ZONES.zone2.threshold, color: GameColors.zone2, opacity: 0.6 },
        { threshold: SCORE_ZONES.zone3.threshold, color: GameColors.zone3, opacity: 0.7 },
        { threshold: SCORE_ZONES.zone4.threshold, color: GameColors.zone4, opacity: 0.85 },
      ].map((zone, idx) => {
        const startAngle = Math.max(0, targetAngle - zone.threshold);
        const endAngle = Math.min(180, targetAngle + zone.threshold);
        return (
          <Path
            key={`zone-${idx}`}
            d={describeWedge(CENTER_X, CENTER_Y, ARC_RADIUS - 2, 20, startAngle, endAngle)}
            fill={zone.color}
            opacity={zone.opacity}
          />
        );
      })
    : null;

  // Target line
  const targetLine = showTarget
    ? (() => {
        const tip = polarToCartesian(CENTER_X, CENTER_Y, ARC_RADIUS - 2, targetAngle);
        return (
          <Line
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={tip.x}
            y2={tip.y}
            stroke={GameColors.primary}
            strokeWidth={2.5}
            strokeDasharray="4,4"
          />
        );
      })()
    : null;

  // Decorative dots (stars) — memoized since they're random but stable per mount
  const stars = useMemo(() => {
    const result = [];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * 180;
      const r = 25 + Math.random() * (ARC_RADIUS - 35);
      const pos = polarToCartesian(CENTER_X, CENTER_Y, r, angle);
      if (pos.y < CENTER_Y) {
        result.push(
          <Circle
            key={`star-${i}`}
            cx={pos.x}
            cy={pos.y}
            r={0.5 + Math.random() * 1}
            fill="white"
            opacity={0.2 + Math.random() * 0.3}
          />,
        );
      }
    }
    return result;
  }, []);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={styles.dialWrapper}>
          <Svg width={DIAL_SIZE} height={SVG_HEIGHT} viewBox={`0 0 ${DIAL_SIZE} ${SVG_HEIGHT}`}>
            {/* Background semicircle */}
            <Path
              d={describeWedge(CENTER_X, CENTER_Y, ARC_RADIUS, 0, 0, 180)}
              fill={GameColors.dialBackground}
            />

            {/* Star decorations */}
            {stars}

            {/* Outer arc border */}
            <Path
              d={describeArc(CENTER_X, CENTER_Y, ARC_RADIUS, 0, 180)}
              fill="none"
              stroke={GameColors.dialBorder}
              strokeWidth={3}
            />

            {/* Tick marks */}
            {ticks}

            {/* Scoring zones */}
            {zones}

            {/* Target line */}
            {targetLine}

            {/* Base line */}
            <Line
              x1={CENTER_X - ARC_RADIUS}
              y1={CENTER_Y}
              x2={CENTER_X + ARC_RADIUS}
              y2={CENTER_Y}
              stroke={GameColors.dialBorder}
              strokeWidth={2}
            />

            {/* Pivot decoration (red dot like original game) */}
            <Circle cx={CENTER_X} cy={CENTER_Y} r={12} fill={GameColors.pivotColor} />
            <Circle cx={CENTER_X} cy={CENTER_Y} r={6} fill={GameColors.background} />
          </Svg>

          {/* Animated needle — positioned so its left edge is at the pivot point */}
          {(interactive || showGuess) && (
            <AnimatedView style={[styles.needleContainer, needleAnimatedStyle]}>
              <View style={styles.needle} />
              <View style={styles.needleTip} />
            </AnimatedView>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialWrapper: {
    width: DIAL_SIZE,
    height: SVG_HEIGHT,
  },
  needleContainer: {
    position: 'absolute',
    // Pivot at (CENTER_X, CENTER_Y) — needle extends to the right from there
    top: CENTER_Y - NEEDLE_HEIGHT / 2, // vertically center the 4px needle at y=150
    left: CENTER_X,
    width: NEEDLE_LENGTH,
    height: NEEDLE_HEIGHT,
    transformOrigin: 'left center', // rotate around the pivot (left edge)
  },
  needle: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: NEEDLE_LENGTH - 8,
    height: 3,
    backgroundColor: GameColors.needleColor,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  needleTip: {
    position: 'absolute',
    right: 0,
    top: -2,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftColor: GameColors.needleColor,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
});
