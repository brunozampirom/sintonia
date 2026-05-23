import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, Text, type TextStyle } from 'react-native';

interface AnimatedScoreProps {
  value: number;
  style?: StyleProp<TextStyle>;
  duration?: number;
}

export function AnimatedScore({ value, style, duration = 500 }: AnimatedScoreProps) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;

    if (from === to) return;

    const startTime = Date.now();
    let raf: number;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplay(current);

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <Text style={style}>{display}</Text>;
}
