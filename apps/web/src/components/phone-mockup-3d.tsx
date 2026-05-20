"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { LiveDial } from "./live-dial";

// Realistic iPhone 16 Pro-ish mockup with mouse-driven 3D tilt.
// Built entirely in CSS+SVG so it stays sharp at any size and never
// shows a low-res screenshot.
export function PhoneMockup3D() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { stiffness: 80, damping: 18, mass: 0.8 };
  const sx = useSpring(mouseX, springConfig);
  const sy = useSpring(mouseY, springConfig);

  // Mouse right (sx=1) → phone rotates left (-deg). Y inverted similarly.
  const rotateY = useTransform(sx, [0, 1], [18, -18]);
  const rotateX = useTransform(sy, [0, 1], [-12, 12]);
  const glareX = useTransform(sx, [0, 1], ["80%", "20%"]);
  const glareY = useTransform(sy, [0, 1], ["80%", "20%"]);

  function handleMove(e: React.PointerEvent) {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }

  function handleLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  // Idle micro-float so the phone is never perfectly still
  useEffect(() => {
    let raf = 0;
    let start = performance.now();
    const loop = (t: number) => {
      const dt = (t - start) / 1000;
      // Only nudge if mouse is centered (user not interacting)
      const cx = mouseX.get();
      const cy = mouseY.get();
      const centered = Math.abs(cx - 0.5) < 0.02 && Math.abs(cy - 0.5) < 0.02;
      if (centered) {
        mouseX.set(0.5 + Math.sin(dt * 0.4) * 0.04);
        mouseY.set(0.5 + Math.cos(dt * 0.3) * 0.03);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mouseX, mouseY]);

  return (
    <div
      ref={wrapperRef}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className="relative mx-auto"
      style={{
        perspective: "1400px",
        width: "min(360px, 80vw)",
        height: "min(740px, 165vw)",
        maxHeight: "80vh",
      }}
    >
      {/* Glow behind phone */}
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10 rounded-[60px]"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 40%, rgba(232,67,147,0.35), transparent 65%), radial-gradient(50% 50% at 50% 70%, rgba(245,166,35,0.25), transparent 65%)",
          filter: "blur(40px)",
          transform: "translateZ(-100px)",
        }}
      />

      <motion.div
        className="relative w-full h-full"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Titanium body */}
        <div
          className="absolute inset-0 rounded-[52px]"
          style={{
            background:
              "linear-gradient(135deg, #2a2f3a 0%, #555a66 25%, #1a1d24 50%, #4a4f5a 75%, #2a2f3a 100%)",
            boxShadow:
              "0 30px 60px -20px rgba(0,0,0,0.7), 0 20px 40px -10px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.4)",
          }}
        />

        {/* Side button highlights */}
        <div
          aria-hidden
          className="absolute left-[-3px] top-[140px] h-[60px] w-[3px] rounded-l-md"
          style={{ background: "linear-gradient(to right, #1a1d24, #4a4f5a)" }}
        />
        <div
          aria-hidden
          className="absolute left-[-3px] top-[220px] h-[40px] w-[3px] rounded-l-md"
          style={{ background: "linear-gradient(to right, #1a1d24, #4a4f5a)" }}
        />
        <div
          aria-hidden
          className="absolute left-[-3px] top-[280px] h-[40px] w-[3px] rounded-l-md"
          style={{ background: "linear-gradient(to right, #1a1d24, #4a4f5a)" }}
        />
        <div
          aria-hidden
          className="absolute right-[-3px] top-[180px] h-[80px] w-[3px] rounded-r-md"
          style={{ background: "linear-gradient(to left, #1a1d24, #4a4f5a)" }}
        />

        {/* Inner bezel */}
        <div
          className="absolute inset-[8px] rounded-[46px]"
          style={{ background: "#0a0a0a" }}
        />

        {/* Screen */}
        <div
          className="absolute inset-[12px] rounded-[42px] overflow-hidden"
          style={{ background: "#0a172b" }}
        >
          {/* Screen content (live in-app demo) */}
          <PhoneScreenContent />

          {/* Reflective glare overlay — driven by mouse */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[42px]"
            style={{
              background: `radial-gradient(circle at var(--gx) var(--gy), rgba(255,255,255,0.18), transparent 35%)`,
              ["--gx" as never]: glareX,
              ["--gy" as never]: glareY,
              mixBlendMode: "overlay",
            }}
          />
        </div>

        {/* Dynamic Island */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-[22px] h-[34px] w-[120px] rounded-[20px] z-10"
          style={{
            background: "#000",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
          }}
        >
          {/* Camera dot */}
          <div className="absolute right-[10px] top-1/2 -translate-y-1/2 h-[10px] w-[10px] rounded-full bg-[#1a1a1a] ring-1 ring-[#444]" />
        </div>
      </motion.div>
    </div>
  );
}

function PhoneScreenContent() {
  return (
    <div className="relative w-full h-full text-white font-[var(--font-sans)] flex flex-col">
      {/* Status bar */}
      <div className="flex items-center justify-between px-7 pt-3 pb-1 text-[13px] font-semibold tabular-nums">
        <span>13:28</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[10px] w-[14px] rounded-sm bg-white/90" />
          <span className="inline-block h-[10px] w-[18px] rounded-sm border border-white/60 px-[1px]">
            <span className="block h-full w-[80%] rounded-[1px] bg-white" />
          </span>
        </span>
      </div>

      {/* Top header w/ score chips */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <div className="h-9 w-9 rounded-full bg-white/8 flex items-center justify-center text-white/80 text-lg">×</div>
      </div>

      <div className="flex items-stretch justify-center gap-3 px-5">
        <ScoreChip label="TIME 1" value="0" active />
        <div className="flex flex-col items-center justify-center gap-1 text-[10px] text-[var(--color-text-muted)]">
          <span className="font-bold tracking-wider">R1</span>
          <span className="text-[9px]">Meta: 10</span>
        </div>
        <ScoreChip label="TIME 2" value="0" />
      </div>

      {/* Turn title */}
      <div className="text-center px-5 mt-7">
        <h3 className="text-[20px] font-extrabold leading-tight">Jogador 1, sua vez!</h3>
        <p className="text-[12px] text-[var(--color-text-muted)] mt-1">Veja o alvo e pense em uma dica</p>
      </div>

      {/* Dial */}
      <div className="px-3 mt-2">
        <LiveDial />
      </div>

      {/* Spectrum card */}
      <div className="mx-5 mt-1 mb-4 rounded-2xl bg-[var(--color-surface)] px-4 py-3 flex items-center justify-between">
        <button aria-hidden className="text-[var(--color-text-muted)] text-xs">←</button>
        <div className="flex-1 flex items-center justify-between px-3">
          <span className="text-[13px] font-bold">Meme bom</span>
          <span className="text-[var(--color-text-muted)] text-[10px]">↔</span>
          <span className="text-[13px] font-bold">Meme cringe</span>
        </div>
        <button aria-hidden className="text-[var(--color-text-muted)] text-xs">→</button>
      </div>

      <div className="px-5 pb-5 text-center">
        <p className="text-[11px] text-[var(--color-accent)] font-semibold">
          Diga a dica em voz alta e passe o celular
        </p>
      </div>
    </div>
  );
}

function ScoreChip({ label, value, active }: { label: string; value: string; active?: boolean }) {
  return (
    <div
      className={
        "flex-1 max-w-[110px] rounded-2xl border-2 px-4 py-2 text-center " +
        (active
          ? "border-[var(--color-primary)] bg-[rgba(211,119,63,0.08)]"
          : "border-white/10 bg-white/[0.03]")
      }
    >
      <div className="text-[10px] tracking-wider font-bold text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="text-[24px] font-black leading-none mt-0.5">{value}</div>
    </div>
  );
}
