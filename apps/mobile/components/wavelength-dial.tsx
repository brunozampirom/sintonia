import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  SharedValue,
  runOnJS,
  FadeIn,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { GameColors } from '@/constants/theme';
import { SCORE_ZONES } from '@/constants/game';
import { haptics } from '@/lib/haptics';

const DIAL_TICK_DEGREES = 9;

const DEFAULT_SIZE = 300;

export interface PlayerMarker {
  angle: number;
  color: string;
  name: string;
}

interface WavelengthDialProps {
  targetAngle: number; // 0 = left, 180 = right
  guessAngle: SharedValue<number>;
  showTarget: boolean;
  interactive: boolean;
  showGuess: boolean;
  onGuessChange?: (angle: number) => void;
  size?: number;
  playerMarkers?: PlayerMarker[];
}

/**
 * Convert a dial angle (0°=left, 90°=top, 180°=right) + radius
 * to SVG cartesian coordinates with origin at (centerX, centerY).
 */
function polarToCartesian(centerX: number, centerY: number, radius: number, dialAngleDeg: number) {
  const mathAngleRad = ((180 - dialAngleDeg) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(mathAngleRad),
    y: centerY - radius * Math.sin(mathAngleRad),
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

const AnimatedView = Animated.createAnimatedComponent(View);

interface MarkerPosition extends PlayerMarker {
  radius: number;
}

function placePlayerMarkers(markers: PlayerMarker[], baseRadius: number): MarkerPosition[] {
  if (markers.length === 0) return [];
  const sorted = markers
    .map((m, i) => ({ ...m, original: i }))
    .sort((a, b) => a.angle - b.angle);
  const COLLISION_THRESHOLD = 18;
  const RADIAL_STEP = 28;
  const result: MarkerPosition[] = [];
  let lastAngle = -999;
  let level = 0;
  for (const m of sorted) {
    if (Math.abs(m.angle - lastAngle) < COLLISION_THRESHOLD) {
      level += 1;
    } else {
      level = 0;
    }
    const offset = level * RADIAL_STEP;
    result.push({
      angle: m.angle,
      color: m.color,
      name: m.name,
      radius: Math.max(40, baseRadius - offset),
    });
    lastAngle = m.angle;
  }
  return result;
}

export function WavelengthDial({
  targetAngle,
  guessAngle,
  showTarget,
  interactive,
  showGuess,
  onGuessChange,
  size = DEFAULT_SIZE,
  playerMarkers,
}: WavelengthDialProps) {
  const centerX = size / 2;
  const centerY = size / 2;
  const svgHeight = centerY + 20;
  const arcRadius = centerX - 15;
  const needleLength = arcRadius - 10;
  const needleHeight = 4;
  const pivotRadius = size * 12 / DEFAULT_SIZE;
  const pivotInnerRadius = size * 6 / DEFAULT_SIZE;
  const innerWedgeRadius = size * 20 / DEFAULT_SIZE;

  const needleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${guessAngle.value - 180}deg` }],
  }));

  // Emit a light haptic tick each time the needle crosses a 9° tick while
  // the user is actively dragging (interactive only — never fires in result/clue).
  const lastTickIdx = useSharedValue(Math.floor(90 / DIAL_TICK_DEGREES));
  useAnimatedReaction(
    () => guessAngle.value,
    (current) => {
      'worklet';
      if (!interactive) return;
      const tickIdx = Math.floor(current / DIAL_TICK_DEGREES);
      if (tickIdx !== lastTickIdx.value) {
        lastTickIdx.value = tickIdx;
        runOnJS(haptics.dialTick)();
      }
    },
  );

  const panGesture = Gesture.Pan()
    .enabled(interactive)
    .onUpdate((event) => {
      'worklet';
      const dx = event.x - centerX;
      const dy = centerY - event.y;
      let mathAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (mathAngle < 0) mathAngle = 0;
      if (mathAngle > 180) mathAngle = 180;
      const dialAngle = 180 - mathAngle;
      guessAngle.value = dialAngle;
      if (onGuessChange) {
        runOnJS(onGuessChange)(dialAngle);
      }
    });

  const tapGesture = Gesture.Tap()
    .enabled(interactive)
    .onEnd((event) => {
      'worklet';
      const dx = event.x - centerX;
      const dy = centerY - event.y;
      let mathAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (mathAngle < 0) mathAngle = 0;
      if (mathAngle > 180) mathAngle = 180;
      const dialAngle = 180 - mathAngle;
      guessAngle.value = withSpring(dialAngle, { damping: 15, stiffness: 150 });
      if (onGuessChange) {
        runOnJS(onGuessChange)(dialAngle);
      }
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const ticks = useMemo(() => {
    const result = [];
    for (let i = 0; i <= 180; i += 9) {
      const isMajor = i % 45 === 0;
      const outerR = arcRadius + 2;
      const innerR = isMajor ? arcRadius - 8 : arcRadius - 4;
      const p1 = polarToCartesian(centerX, centerY, outerR, i);
      const p2 = polarToCartesian(centerX, centerY, innerR, i);
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
  }, [arcRadius, centerX, centerY]);

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
            d={describeWedge(centerX, centerY, arcRadius - 2, innerWedgeRadius, startAngle, endAngle)}
            fill={zone.color}
            opacity={zone.opacity}
          />
        );
      })
    : null;

  const targetLine = showTarget
    ? (() => {
        const tip = polarToCartesian(centerX, centerY, arcRadius - 2, targetAngle);
        return (
          <Line
            x1={centerX}
            y1={centerY}
            x2={tip.x}
            y2={tip.y}
            stroke={GameColors.primary}
            strokeWidth={2.5}
            strokeDasharray="4,4"
          />
        );
      })()
    : null;

  const markerBaseRadius = arcRadius - 38;
  const markerPositions = useMemo(
    () => (playerMarkers && playerMarkers.length > 0 ? placePlayerMarkers(playerMarkers, markerBaseRadius) : []),
    [playerMarkers, markerBaseRadius],
  );
  const MARKER_DIAMETER = Math.max(22, Math.round(size * 28 / DEFAULT_SIZE));
  const MARKER_NAME_WIDTH = MARKER_DIAMETER + 32;

  const stars = useMemo(() => {
    const result = [];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * 180;
      const r = 25 + Math.random() * (arcRadius - 35);
      const pos = polarToCartesian(centerX, centerY, r, angle);
      if (pos.y < centerY) {
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
  }, [arcRadius, centerX, centerY]);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={{ width: size, height: svgHeight }}>
          <Svg width={size} height={svgHeight} viewBox={`0 0 ${size} ${svgHeight}`}>
            {/* Background semicircle */}
            <Path
              d={describeWedge(centerX, centerY, arcRadius, 0, 0, 180)}
              fill={GameColors.dialBackground}
            />

            {/* Star decorations */}
            {stars}

            {/* Outer arc border */}
            <Path
              d={describeArc(centerX, centerY, arcRadius, 0, 180)}
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
              x1={centerX - arcRadius}
              y1={centerY}
              x2={centerX + arcRadius}
              y2={centerY}
              stroke={GameColors.dialBorder}
              strokeWidth={2}
            />

            {/* Pivot decoration */}
            <Circle cx={centerX} cy={centerY} r={pivotRadius} fill={GameColors.pivotColor} />
            <Circle cx={centerX} cy={centerY} r={pivotInnerRadius} fill={GameColors.background} />
          </Svg>

          {/* Player markers (all-guess result reveal) */}
          {markerPositions.map((m, idx) => {
            const pos = polarToCartesian(centerX, centerY, m.radius, m.angle);
            return (
              <Animated.View
                key={`marker-${idx}-${m.name}`}
                entering={FadeIn.delay(80 * idx).duration(280)}
                style={[
                  styles.markerWrap,
                  {
                    left: pos.x - MARKER_NAME_WIDTH / 2,
                    top: pos.y - MARKER_DIAMETER / 2,
                    width: MARKER_NAME_WIDTH,
                  },
                ]}
                pointerEvents="none"
              >
                <View
                  style={[
                    styles.markerDot,
                    {
                      width: MARKER_DIAMETER,
                      height: MARKER_DIAMETER,
                      borderRadius: MARKER_DIAMETER / 2,
                      backgroundColor: m.color,
                    },
                  ]}
                />
                <Text style={styles.markerName} numberOfLines={1}>
                  {m.name.toUpperCase()}
                </Text>
              </Animated.View>
            );
          })}

          {/* Animated needle */}
          {(interactive || showGuess) && (
            <AnimatedView
              style={[
                {
                  position: 'absolute',
                  top: centerY - needleHeight / 2,
                  left: centerX,
                  width: needleLength,
                  height: needleHeight,
                  transformOrigin: 'left center',
                },
                needleAnimatedStyle,
              ]}
            >
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: needleLength - 8,
                  height: 3,
                  backgroundColor: GameColors.needleColor,
                  borderRadius: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.3,
                  shadowRadius: 2,
                }}
              />
              <View
                style={{
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
                }}
              />
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
  markerWrap: {
    position: 'absolute',
    alignItems: 'center',
    gap: 2,
  },
  markerDot: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  markerName: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
