import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

interface StarfieldProps {
  count?: number;
}

export function Starfield({ count = 80 }: StarfieldProps) {
  const stars = useMemo(() => {
    const result = [];
    for (let i = 0; i < count; i++) {
      const size = Math.random() < 0.15 ? 2.5 : Math.random() < 0.4 ? 1.5 : 1;
      const opacity = 0.15 + Math.random() * 0.35;
      result.push({
        key: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size,
        opacity,
        color: Math.random() < 0.1 ? '#8B9DC3' : Math.random() < 0.05 ? '#F5A623' : '#FFFFFF',
      });
    }
    return result;
  }, [count]);

  return (
    <View style={styles.container} pointerEvents="none">
      {stars.map((s) => (
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
      ))}
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
