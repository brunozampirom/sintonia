"use client";

import { motion } from "motion/react";

export function HeroWordmark() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="flex flex-col items-center md:items-start"
    >
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] tracking-[3px] uppercase font-bold text-[var(--color-text-muted)] mb-6">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-mint)] animate-pulse" />
        beta · grátis · sem ads
      </span>

      <h1
        className="text-[clamp(56px,12vw,128px)] font-black leading-none tracking-[0.04em] text-white"
        style={{
          textShadow:
            "0 0 30px rgba(211,119,63,0.55), 0 0 60px rgba(211,119,63,0.35)",
          animation: "pulse-glow 4s ease-in-out infinite",
        }}
      >
        SINTONIA
      </h1>

      <p className="text-xl md:text-2xl text-white/85 mt-4 max-w-[480px] font-medium text-center md:text-left">
        Um jogo de sintonia mental pra<br className="hidden md:inline" /> jogar com até 8 amigos no mesmo celular.
      </p>

      <p className="text-base text-[var(--color-accent)] italic mt-3 font-semibold text-center md:text-left">
        aquele jogo que vai salvar suas festas de ficarem no celular
      </p>
    </motion.div>
  );
}
