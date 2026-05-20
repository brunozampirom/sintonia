"use client";

import { motion } from "motion/react";
import type { IconType } from "react-icons";

interface Props {
  icon: IconType;
  color: string;
  title: string;
  desc: string;
  index: number;
}

export function FeatureCard({ icon: Icon, color, title, desc, index }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="rounded-3xl p-6 md:p-7 relative overflow-hidden group"
      style={{
        background:
          "linear-gradient(160deg, rgba(36, 51, 84, 0.7) 0%, rgba(26, 39, 68, 0.7) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        aria-hidden
        className="absolute -top-12 -right-12 h-32 w-32 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }}
      />

      <div
        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-5"
        style={{
          background: `${color}22`,
          boxShadow: `inset 0 0 0 1px ${color}33`,
        }}
      >
        <Icon className="text-2xl" style={{ color }} />
      </div>

      <h3 className="text-lg font-extrabold text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{desc}</p>
    </motion.div>
  );
}
