"use client";

import { useEffect, useState } from "react";

// Mini animated rainbow waves — used inside PhoneMockup HomeMock variant.
export function MiniWaves() {
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
      d: "M -10 120 C 60 60, 140 140, 230 80 C 320 30, 380 130, 470 80",
      sw: 10,
      c: "url(#mw-1)",
      op: 0.92,
      p: 18,
      ph: 0,
    },
    {
      d: "M -10 80 C 80 130, 160 50, 230 100 C 300 150, 380 50, 470 110",
      sw: 6,
      c: "url(#mw-2)",
      op: 0.85,
      p: 15,
      ph: Math.PI / 2,
    },
    {
      d: "M -10 60 C 90 100, 160 30, 230 80 C 300 130, 380 30, 470 80",
      sw: 4,
      c: "url(#mw-3)",
      op: 0.75,
      p: 21,
      ph: Math.PI,
    },
  ];

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 460 170"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="mw-1" x1="0%" x2="100%">
          <stop offset="0%" stopColor="#FF006E" />
          <stop offset="50%" stopColor="#FF8500" />
          <stop offset="100%" stopColor="#FFBE0B" />
        </linearGradient>
        <linearGradient id="mw-2" x1="0%" x2="100%">
          <stop offset="0%" stopColor="#FFBE0B" />
          <stop offset="60%" stopColor="#06D6A0" />
          <stop offset="100%" stopColor="#118AB2" />
        </linearGradient>
        <linearGradient id="mw-3" x1="0%" x2="100%">
          <stop offset="0%" stopColor="#7B2FF7" />
          <stop offset="100%" stopColor="#C77DFF" />
        </linearGradient>
        <radialGradient id="orb-mw">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="40%" stopColor="#FFBE0B" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FF006E" stopOpacity="0" />
        </radialGradient>
      </defs>
      {waves.map((w, i) => {
        const ty = Math.sin((t / w.p) * Math.PI * 2 + w.ph) * 3;
        return (
          <g key={i} transform={`translate(0, ${ty})`}>
            <path
              d={w.d}
              fill="none"
              stroke={w.c}
              strokeWidth={w.sw}
              strokeLinecap="round"
              opacity={w.op}
            />
          </g>
        );
      })}
      <circle cx="230" cy="85" r="22" fill="url(#orb-mw)" />
      <circle cx="230" cy="85" r="7" fill="#fff" />
    </svg>
  );
}
