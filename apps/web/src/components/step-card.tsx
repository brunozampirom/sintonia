"use client";

import { motion } from "motion/react";

interface Props {
  number: number;
  color: string;
  title: string;
  desc: string;
}

export function StepCard({ number, color, title, desc }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: (number - 1) * 0.1 }}
      className="relative flex-1 rounded-3xl p-7 md:p-8 text-center overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(36, 51, 84, 0.6) 0%, rgba(26, 39, 68, 0.6) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        minWidth: 0,
      }}
    >
      <div
        className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full text-2xl font-black"
        style={{
          color,
          background: `${color}15`,
          boxShadow: `inset 0 0 0 2px ${color}`,
        }}
      >
        {number}
      </div>
      <h3 className="text-lg font-extrabold text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{desc}</p>
    </motion.div>
  );
}
