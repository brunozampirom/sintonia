"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { T } from "@/lib/tokens";

// Round to 3 decimals to avoid SSR/client float precision mismatch.
const round = (n: number) => Math.round(n * 1000) / 1000;

// 0° = left edge, 90° = top, 180° = right edge.
function polarToCart(cx: number, cy: number, r: number, dialAngleDeg: number) {
  const rad = ((180 - dialAngleDeg) * Math.PI) / 180;
  return { x: round(cx + r * Math.cos(rad)), y: round(cy - r * Math.sin(rad)) };
}

function wedgePath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  a0: number,
  a1: number,
) {
  const os = polarToCart(cx, cy, outerR, a0);
  const oe = polarToCart(cx, cy, outerR, a1);
  const ie = polarToCart(cx, cy, innerR, a1);
  const is = polarToCart(cx, cy, innerR, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${os.x} ${os.y} A ${outerR} ${outerR} 0 ${large} 1 ${oe.x} ${oe.y} L ${ie.x} ${ie.y} A ${innerR} ${innerR} 0 ${large} 0 ${is.x} ${is.y} Z`;
}

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const s = polarToCart(cx, cy, r, a0);
  const e = polarToCart(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

const SCORE_ZONES = { zone4: 12, zone3: 24, zone2: 36 };

interface Props {
  targetAngle?: number;
  guessAngle?: number;
  showTarget?: boolean;
  showGuess?: boolean;
  interactive?: boolean;
  onGuessChange?: (angle: number) => void;
  size?: number;
}

export function WavelengthDial({
  targetAngle = 90,
  guessAngle = 90,
  showTarget = false,
  showGuess = false,
  interactive = false,
  onGuessChange,
  size = 300,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const svgH = cy + 20;
  const arcR = cx - 15;
  const needleLen = arcR - 10;
  const pivotR = (size * 12) / 300;
  const pivotInnerR = (size * 6) / 300;
  const innerWedgeR = (size * 20) / 300;

  const svgRef = useRef<SVGSVGElement>(null);

  const onMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * size;
      const y = ((clientY - rect.top) / rect.height) * svgH;
      const dx = x - cx;
      const dy = cy - y;
      let m = Math.atan2(dy, dx) * (180 / Math.PI);
      if (m < 0) m = 0;
      if (m > 180) m = 180;
      onGuessChange?.(180 - m);
    },
    [cx, cy, size, svgH, onGuessChange],
  );

  const dragging = useRef(false);

  useEffect(() => {
    if (!interactive) return;
    function handleMove(e: MouseEvent | TouchEvent) {
      if (!dragging.current) return;
      const t = "touches" in e ? e.touches[0] : e;
      onMove(t.clientX, t.clientY);
    }
    function handleUp() {
      dragging.current = false;
    }
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [interactive, onMove]);

  function handleDown(
    e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>,
  ) {
    if (!interactive) return;
    dragging.current = true;
    const t = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    onMove(t.clientX, t.clientY);
  }

  const ticks = useMemo(() => {
    const out: React.ReactElement[] = [];
    for (let i = 0; i <= 180; i += 9) {
      const major = i % 45 === 0;
      const outerR = arcR + 2;
      const innerR = major ? arcR - 8 : arcR - 4;
      const p1 = polarToCart(cx, cy, outerR, i);
      const p2 = polarToCart(cx, cy, innerR, i);
      out.push(
        <line
          key={i}
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke={T.textMuted}
          strokeWidth={major ? 1.5 : 0.75}
          opacity={0.5}
        />,
      );
    }
    return out;
  }, [arcR, cx, cy]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const stars = useMemo(() => {
    if (!mounted) return [];
    const out: { x: number; y: number; r: number; o: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * 180;
      const r = 25 + Math.random() * (arcR - 35);
      const p = polarToCart(cx, cy, r, a);
      if (p.y < cy) {
        out.push({
          x: p.x,
          y: p.y,
          r: 0.5 + Math.random() * 1,
          o: 0.2 + Math.random() * 0.3,
        });
      }
    }
    return out;
  }, [arcR, cx, cy, mounted]);

  const zones = showTarget
    ? [
        { th: SCORE_ZONES.zone2, color: T.zone2, op: 0.6 },
        { th: SCORE_ZONES.zone3, color: T.zone3, op: 0.7 },
        { th: SCORE_ZONES.zone4, color: T.zone4, op: 0.85 },
      ]
    : [];

  const needleAngle = guessAngle - 180;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: svgH }}
    >
      <svg
        ref={svgRef}
        width={size}
        height={svgH}
        viewBox={`0 0 ${size} ${svgH}`}
        onMouseDown={handleDown}
        onTouchStart={handleDown}
        style={{ touchAction: "none", cursor: interactive ? "grab" : "default" }}
      >
        {/* dial face */}
        <path
          d={`M ${cx - arcR} ${cy} A ${arcR} ${arcR} 0 0 1 ${cx + arcR} ${cy} Z`}
          fill={T.dialBg}
        />

        {/* stars */}
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.o} />
        ))}

        {/* arc border */}
        <path
          d={arcPath(cx, cy, arcR, 0, 180)}
          fill="none"
          stroke={T.dialBorder}
          strokeWidth={3}
        />

        {/* ticks */}
        {ticks}

        {/* scoring zones */}
        {zones.map((z, i) => {
          const a0 = Math.max(0, targetAngle - z.th);
          const a1 = Math.min(180, targetAngle + z.th);
          return (
            <path
              key={i}
              d={wedgePath(cx, cy, arcR - 2, innerWedgeR, a0, a1)}
              fill={z.color}
              opacity={z.op}
            />
          );
        })}

        {/* target line */}
        {showTarget &&
          (() => {
            const tip = polarToCart(cx, cy, arcR - 2, targetAngle);
            return (
              <line
                x1={cx}
                y1={cy}
                x2={tip.x}
                y2={tip.y}
                stroke={T.primary}
                strokeWidth={2.5}
                strokeDasharray="4,4"
              />
            );
          })()}

        {/* base line */}
        <line
          x1={cx - arcR}
          y1={cy}
          x2={cx + arcR}
          y2={cy}
          stroke={T.dialBorder}
          strokeWidth={2}
        />

        {/* pivot */}
        <circle cx={cx} cy={cy} r={pivotR} fill={T.pivot} />
        <circle cx={cx} cy={cy} r={pivotInnerR} fill={T.bg} />
      </svg>

      {/* Needle as absolutely-positioned overlay */}
      {(interactive || showGuess) && (
        <div
          className="absolute pointer-events-none"
          style={{ width: size, height: svgH, left: 0, top: 0 }}
        >
          <div
            style={{
              position: "absolute",
              top: cy - 2,
              left: cx,
              width: needleLen,
              height: 4,
              transformOrigin: "left center",
              transform: `rotate(${needleAngle}deg)`,
              transition: interactive
                ? "none"
                : "transform 480ms cubic-bezier(.2,.7,.2,1)",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: needleLen - 8,
                height: 3,
                background: T.needle,
                borderRadius: 2,
                boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 0,
                top: -2,
                width: 0,
                height: 0,
                borderLeft: "10px solid #fff",
                borderTop: "4px solid transparent",
                borderBottom: "4px solid transparent",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
