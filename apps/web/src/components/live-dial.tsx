"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";

// Animated semi-circular spectrum dial — SVG. Needle gently oscillates,
// then drifts toward a "guess" once per cycle to suggest gameplay.
export function LiveDial() {
  const cx = 160;
  const cy = 150;
  const r = 110;
  const innerR = 78;

  // Needle target degree, 0 = leftmost, 180 = rightmost
  const targetDegree = useMotionValue(60);
  const animatedDegree = useSpring(targetDegree, {
    stiffness: 50,
    damping: 14,
  });

  // Rotation transform — needle origin is at (cx, cy), points up (-90deg)
  const rotateDeg = useTransform(animatedDegree, (d) => d - 90);

  useEffect(() => {
    const values = [60, 105, 92, 130, 75];
    let i = 0;
    const id = setInterval(() => {
      targetDegree.set(values[i % values.length]);
      i += 1;
    }, 2200);
    return () => clearInterval(id);
  }, [targetDegree]);

  // Build arc path
  function polar(angle: number, radius: number) {
    const rad = ((180 - angle) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  }
  const s = polar(0, r);
  const e = polar(180, r);
  const arcPath = `M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}`;

  // Zone arcs (4-3-2-2-3-4 like real Wavelength target)
  function zoneArc(from: number, to: number, color: string, width: number) {
    const start = polar(from, r);
    const end = polar(to, r);
    return (
      <path
        d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`}
        stroke={color}
        strokeWidth={width}
        fill="none"
        strokeLinecap="round"
      />
    );
  }

  return (
    <svg viewBox="0 0 320 200" className="w-full h-auto">
      <defs>
        <linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#55EFC4" />
          <stop offset="20%" stopColor="#AAC573" />
          <stop offset="40%" stopColor="#F8E71C" />
          <stop offset="60%" stopColor="#F5A623" />
          <stop offset="80%" stopColor="#FF6B6B" />
          <stop offset="100%" stopColor="#E84393" />
        </linearGradient>
        <radialGradient id="pivotGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8573D" stopOpacity="1" />
          <stop offset="100%" stopColor="#E8573D" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer rainbow halo */}
      <path d={arcPath} stroke="url(#rainbow)" strokeWidth={16} fill="none" strokeLinecap="round" opacity={0.18} />
      {/* Solid rainbow track */}
      <path d={arcPath} stroke="url(#rainbow)" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.5} />

      {/* Inner target zones — 4/3/2 layered scoring zones */}
      {zoneArc(75, 105, "#E8573D", 8)}
      {zoneArc(60, 75, "#F5A623", 8)}
      {zoneArc(105, 120, "#F5A623", 8)}
      {zoneArc(48, 60, "#F8E71C", 6)}
      {zoneArc(120, 132, "#F8E71C", 6)}

      {/* Tick marks */}
      {Array.from({ length: 18 }).map((_, i) => {
        const angle = (i + 1) * 10;
        const t1 = polar(angle, r + 8);
        const t2 = polar(angle, r + 14);
        return (
          <line
            key={i}
            x1={t1.x}
            y1={t1.y}
            x2={t2.x}
            y2={t2.y}
            stroke="#2A3A5C"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        );
      })}

      {/* Needle group rotates around (cx, cy) */}
      <motion.g
        style={{
          rotate: rotateDeg,
          originX: `${cx}px`,
          originY: `${cy}px`,
        }}
      >
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - innerR - 14}
          stroke="#FFFFFF"
          strokeWidth={3.5}
          strokeLinecap="round"
        />
        {/* Needle tip diamond */}
        <circle cx={cx} cy={cy - innerR - 14} r={4} fill="#FFFFFF" />
      </motion.g>

      {/* Pivot glow */}
      <circle cx={cx} cy={cy} r={20} fill="url(#pivotGlow)" />
      {/* Pivot */}
      <circle cx={cx} cy={cy} r={9} fill="#E8573D" />
      <circle cx={cx} cy={cy} r={4} fill="#FFFFFF" opacity={0.9} />
    </svg>
  );
}
