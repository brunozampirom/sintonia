"use client";

import { useEffect, useState } from "react";

interface Props {
  height?: number;
}

// CTA bottom waves — chunky neon bands + glowing orb, no scroll cue.
export function CTAWaves({ height = 150 }: Props) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const loop = (ts: number) => {
      setT(ts / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const waves = [
    {
      d: "M -40 140 C 180 60,  420 200, 700 100 C 980 0,    1220 180, 1480 60",
      grad: "cw-1",
      sw: 22,
      op: 0.95,
      pX: 18,
      pY: 14,
      phX: 0,
      phY: 0,
      ampX: 6,
      ampY: 5,
    },
    {
      d: "M -40 100 C 200 180, 440 60,  700 160 C 960 220,  1200 60,  1480 160",
      grad: "cw-2",
      sw: 16,
      op: 0.88,
      pX: 15,
      pY: 17,
      phX: Math.PI / 2,
      phY: Math.PI / 3,
      ampX: 6,
      ampY: 5,
    },
    {
      d: "M -40 80  C 220 180, 460 20,  700 120 C 940 220,  1180 0,   1480 120",
      grad: "cw-3",
      sw: 11,
      op: 0.8,
      pX: 21,
      pY: 13,
      phX: Math.PI,
      phY: Math.PI / 4,
      ampX: 5,
      ampY: 5,
    },
    {
      d: "M -40 180 C 200 90,  440 220, 700 140 C 960 60,   1200 200, 1480 120",
      grad: "cw-4",
      sw: 8,
      op: 0.72,
      pX: 17,
      pY: 19,
      phX: Math.PI * 1.5,
      phY: (Math.PI * 2) / 3,
      ampX: 5,
      ampY: 4,
    },
    {
      d: "M -40 200 C 220 120, 460 220, 700 160 C 940 100,  1200 200, 1480 140",
      grad: "cw-5",
      sw: 5,
      op: 0.62,
      pX: 13,
      pY: 21,
      phX: Math.PI * 0.8,
      phY: Math.PI * 1.2,
      ampX: 4,
      ampY: 4,
    },
  ];

  const grads: Record<string, [string, number][]> = {
    "cw-1": [
      ["#FF006E", 0],
      ["#FF4D6D", 30],
      ["#FF8500", 60],
      ["#FFBE0B", 100],
    ],
    "cw-2": [
      ["#FFBE0B", 0],
      ["#8AC926", 50],
      ["#06D6A0", 100],
    ],
    "cw-3": [
      ["#06D6A0", 0],
      ["#118AB2", 50],
      ["#7B2FF7", 100],
    ],
    "cw-4": [
      ["#7B2FF7", 0],
      ["#C77DFF", 55],
      ["#FF006E", 100],
    ],
    "cw-5": [
      ["#55EFC4", 0],
      ["#74B9FF", 60],
      ["#A29BFE", 100],
    ],
  };

  return (
    <div
      className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden"
      style={{ height }}
    >
      {waves.map((w, i) => {
        const tx = Math.sin((t / w.pX) * Math.PI * 2 + w.phX) * w.ampX;
        const ty = Math.sin((t / w.pY) * Math.PI * 2 + w.phY) * w.ampY;
        return (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              transform: `translate(${tx}px, ${ty}px)`,
              willChange: "transform",
            }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 1400 240"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <linearGradient id={w.grad} x1="0%" x2="100%">
                  {grads[w.grad].map(([c, p], j) => (
                    <stop key={j} offset={`${p}%`} stopColor={c} />
                  ))}
                </linearGradient>
                <filter
                  id={`cw-glow-${i}`}
                  x="-10%"
                  y="-50%"
                  width="120%"
                  height="200%"
                >
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                d={w.d}
                fill="none"
                stroke={`url(#${w.grad})`}
                strokeWidth={w.sw}
                strokeLinecap="round"
                opacity={w.op}
                filter={`url(#cw-glow-${i})`}
              />
            </svg>
          </div>
        );
      })}

      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1400 240"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0"
      >
        <defs>
          <radialGradient id="cw-orb" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
            <stop offset="30%" stopColor="#FFBE0B" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#FF006E" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#FF006E" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="700" cy="120" r="90" fill="url(#cw-orb)" />
        <circle cx="700" cy="120" r="22" fill="#fff" fillOpacity="0.98" />
        <circle cx="700" cy="120" r="11" fill="#fff" fillOpacity="0.45" />
        <circle
          cx="700"
          cy="120"
          r="58"
          fill="none"
          stroke="#fff"
          strokeWidth="0.6"
          opacity="0.18"
        />
        <circle
          cx="700"
          cy="120"
          r="108"
          fill="none"
          stroke="#fff"
          strokeWidth="0.5"
          opacity="0.1"
        />
      </svg>
    </div>
  );
}
