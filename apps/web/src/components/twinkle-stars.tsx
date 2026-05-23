"use client";

import { useEffect, useMemo, useState } from "react";

interface Props {
  count?: number;
}

export function TwinkleStars({ count = 110 }: Props) {
  // Render on client-only — Math.random() would mismatch SSR
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const stars = useMemo(() => {
    if (!mounted) return [];
    const palette = ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFBE0B", "#74B9FF", "#FF006E"];
    const out: Array<{
      left: number;
      top: number;
      size: number;
      o: number;
      color: string;
      delay: number;
      dur: number;
    }> = [];
    for (let i = 0; i < count; i++) {
      const size = Math.random() < 0.1 ? 3 : Math.random() < 0.35 ? 2 : 1;
      const o = 0.18 + Math.random() * 0.45;
      out.push({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size,
        o,
        color: palette[Math.floor(Math.random() * palette.length)],
        delay: -Math.random() * 4,
        dur: 2.6 + Math.random() * 3,
      });
    }
    return out;
  }, [count, mounted]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {stars.map((s, i) => (
        <span
          key={i}
          style={
            {
              position: "absolute",
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              background: s.color,
              opacity: s.o,
              "--o": s.o,
              animation: `star-twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
              boxShadow: s.size >= 2 ? `0 0 4px ${s.color}` : "none",
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
