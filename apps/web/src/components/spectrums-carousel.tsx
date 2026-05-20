"use client";

import { AnimatePresence, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import type { Spectrum } from "@/lib/spectrums";

const ZONE_COLORS = [
  "var(--color-mint)",
  "var(--color-secondary)",
  "var(--color-yellow)",
  "var(--color-accent)",
  "var(--color-coral)",
  "var(--color-pink)",
];

interface Props {
  spectrums: Spectrum[];
}

export function SpectrumsCarousel({ spectrums }: Props) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

  const len = spectrums.length;

  function go(next: number) {
    setDirection(next > index ? 1 : -1);
    setIndex(((next % len) + len) % len);
  }

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % len);
    }, 3800);
    return () => clearInterval(id);
  }, [paused, len]);

  const current = spectrums[index];
  const prev = spectrums[(index - 1 + len) % len];
  const next = spectrums[(index + 1) % len];

  return (
    <div
      className="relative w-full max-w-[820px] mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Side peek cards */}
      <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-[160px] pointer-events-none">
        <PeekCard spectrum={prev} side="left" />
      </div>
      <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-[160px] pointer-events-none">
        <PeekCard spectrum={next} side="right" />
      </div>

      {/* Main card */}
      <div className="relative h-[360px] md:h-[320px] flex items-center justify-center px-12 md:px-0">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            initial={{ x: direction * 60, opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: direction * -60, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) go(index + 1);
              else if (info.offset.x > 60) go(index - 1);
            }}
            className="w-full max-w-[460px] cursor-grab active:cursor-grabbing"
          >
            <MainCard spectrum={current} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 mt-6">
        <button
          onClick={() => go(index - 1)}
          aria-label="Anterior"
          className="grid place-items-center h-11 w-11 rounded-full bg-white/5 hover:bg-white/10 transition border border-white/10"
        >
          <IoChevronBack className="text-white text-lg" />
        </button>

        <div className="flex items-center gap-2">
          {spectrums.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Espectro ${i + 1}`}
              className="group"
            >
              <span
                className={
                  "block h-1.5 rounded-full transition-all duration-300 " +
                  (i === index
                    ? "w-8 bg-[var(--color-primary)]"
                    : "w-1.5 bg-white/25 group-hover:bg-white/40")
                }
              />
            </button>
          ))}
        </div>

        <button
          onClick={() => go(index + 1)}
          aria-label="Próximo"
          className="grid place-items-center h-11 w-11 rounded-full bg-white/5 hover:bg-white/10 transition border border-white/10"
        >
          <IoChevronForward className="text-white text-lg" />
        </button>
      </div>
    </div>
  );
}

function MainCard({ spectrum }: { spectrum: Spectrum }) {
  return (
    <div
      className="relative rounded-3xl p-8 md:p-10 select-none overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, rgba(36, 51, 84, 0.95) 0%, rgba(26, 39, 68, 0.95) 100%)",
        boxShadow:
          "0 30px 60px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Subtle gradient blob */}
      <div
        aria-hidden
        className="absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl opacity-50"
        style={{
          background:
            "radial-gradient(circle, var(--color-primary), transparent 70%)",
        }}
      />

      {spectrum.category && (
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] tracking-[2px] uppercase font-bold text-[var(--color-text-muted)]">
            {spectrum.category}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-right">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
            esquerda
          </p>
          <p className="text-lg md:text-xl font-extrabold leading-tight text-balance">
            {spectrum.left}
          </p>
        </div>

        <div className="flex items-center">
          <SpectrumBar />
        </div>

        <div className="flex-1 text-left">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
            direita
          </p>
          <p className="text-lg md:text-xl font-extrabold leading-tight text-balance">
            {spectrum.right}
          </p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-[12px] text-[var(--color-text-muted)] italic">
          arraste a agulha entre os extremos
        </p>
      </div>
    </div>
  );
}

function SpectrumBar() {
  return (
    <div className="relative h-1.5 w-16 md:w-24 rounded-full overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, ${ZONE_COLORS.join(", ")})`,
        }}
      />
    </div>
  );
}

function PeekCard({ spectrum, side }: { spectrum: Spectrum; side: "left" | "right" }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.5 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl p-5 backdrop-blur-sm"
      style={{
        background: "rgba(26, 39, 68, 0.4)",
        border: "1px solid rgba(255,255,255,0.04)",
        transform: side === "left" ? "scale(0.85) rotate(-3deg)" : "scale(0.85) rotate(3deg)",
      }}
    >
      <div className="flex flex-col gap-2 text-center">
        <p className="text-[12px] font-bold text-white/70 truncate">{spectrum.left}</p>
        <p className="text-[9px] text-white/30">↕</p>
        <p className="text-[12px] font-bold text-white/70 truncate">{spectrum.right}</p>
      </div>
    </motion.div>
  );
}
