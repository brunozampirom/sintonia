"use client";

import { useEffect, useRef, useState } from "react";

interface Particle {
  id: string;
  vx: number;
  vy: number;
  rot: number;
  spin: number;
  color: string;
  shape: "rect" | "circle" | "bar";
  size: number;
  life: number;
}

interface Props {
  trigger?: number;
  count?: number;
  originY?: number;
}

export function Confetti({ trigger = 0, count = 50, originY = 50 }: Props) {
  const [parts, setParts] = useState<Particle[]>([]);
  const [tick, setTick] = useState(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (!trigger) return;
    const colors = [
      "#FF006E",
      "#FF8500",
      "#FFBE0B",
      "#06D6A0",
      "#74B9FF",
      "#7B2FF7",
      "#C77DFF",
      "#FF6B6B",
    ];
    const next: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI + Math.PI;
      const speed = 220 + Math.random() * 320;
      next.push({
        id: `${trigger}-${i}`,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * 360,
        spin: (Math.random() - 0.5) * 720,
        color: colors[i % colors.length],
        shape:
          Math.random() < 0.4 ? "rect" : Math.random() < 0.7 ? "circle" : "bar",
        size: 6 + Math.random() * 8,
        life: 1100 + Math.random() * 700,
      });
    }
    setParts(next);
    const t = setTimeout(() => setParts([]), 2200);
    return () => clearTimeout(t);
  }, [trigger, count]);

  useEffect(() => {
    if (parts.length === 0) return;
    startRef.current = performance.now();
    let raf = 0;
    const loop = (ts: number) => {
      setTick(ts - startRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [parts]);

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 30 }}
    >
      {parts.map((p) => {
        const t = Math.min(tick, p.life) / 1000;
        const x = p.vx * t;
        const y = p.vy * t + 0.5 * 900 * t * t;
        const rot = p.rot + p.spin * t;
        const opacity = 1 - tick / p.life;
        const base: React.CSSProperties = {
          position: "absolute",
          left: "50%",
          top: `${originY}%`,
          transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${rot}deg)`,
          opacity: Math.max(0, opacity),
          background: p.color,
          boxShadow: `0 0 6px ${p.color}66`,
          willChange: "transform, opacity",
        };
        if (p.shape === "rect")
          return (
            <div
              key={p.id}
              style={{
                ...base,
                width: p.size,
                height: p.size * 0.5,
                borderRadius: 2,
              }}
            />
          );
        if (p.shape === "bar")
          return (
            <div
              key={p.id}
              style={{
                ...base,
                width: p.size * 1.6,
                height: p.size * 0.25,
                borderRadius: 2,
              }}
            />
          );
        return (
          <div
            key={p.id}
            style={{
              ...base,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
            }}
          />
        );
      })}
    </div>
  );
}
