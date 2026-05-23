"use client";

import { useState } from "react";
import {
  IoBulbOutline,
  IoPhonePortraitOutline,
  IoTrophyOutline,
} from "react-icons/io5";
import type { IconType } from "react-icons";
import { useT } from "@/lib/i18n";
import { T } from "@/lib/tokens";

interface Step {
  n: number;
  Icon: IconType;
  color: string;
  titleKey: string;
  bodyKey: string;
}

const STEPS: Step[] = [
  { n: 1, Icon: IoBulbOutline, color: T.sky, titleKey: "how.step1.title", bodyKey: "how.step1.body" },
  { n: 2, Icon: IoPhonePortraitOutline, color: T.accent, titleKey: "how.step2.title", bodyKey: "how.step2.body" },
  { n: 3, Icon: IoTrophyOutline, color: T.secondary, titleKey: "how.step3.title", bodyKey: "how.step3.body" },
];

export function HowItWorks() {
  const t = useT();
  return (
    <section style={{ padding: "110px 0 60px", position: "relative", zIndex: 2 }}>
      <div className="sintonia-container">
        <div
          className="flex flex-col items-center text-center"
          style={{ marginBottom: 56 }}
        >
          <span className="section-eyebrow">{t("how.eyebrow")}</span>
          <h2 className="section-title">{t("how.title")}</h2>
          <p className="section-subtitle">{t("how.subtitle")}</p>
        </div>

        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
        >
          {STEPS.map((s) => (
            <StepCard key={s.n} step={s} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step, t }: { step: Step; t: (k: string) => string }) {
  const [hover, setHover] = useState(false);
  const { Icon } = step;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(36,51,84,0.6) 0%, rgba(26,39,68,0.85) 100%)",
        border: `1px solid ${step.color}${hover ? "66" : "22"}`,
        borderRadius: 24,
        padding: "30px 26px 28px",
        boxShadow: "0 12px 28px rgba(0,0,0,0.30)",
        transition: "transform 240ms cubic-bezier(.2,.7,.2,1), border-color 240ms",
        transform: hover ? "translateY(-6px)" : "translateY(0)",
      }}
    >
      <div
        className="absolute pointer-events-none"
        style={{
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          background: `radial-gradient(closest-side, ${step.color}22, transparent 70%)`,
        }}
      />

      <div className="flex items-center gap-3.5" style={{ marginBottom: 22 }}>
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 16,
            background: `${step.color}1F`,
            color: step.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1.5px solid ${step.color}55`,
          }}
        >
          <Icon size={28} />
        </div>
        <div
          style={{
            fontFamily: T.fontDisplay,
            fontWeight: 900,
            fontSize: 64,
            lineHeight: 1,
            color: "transparent",
            WebkitTextStroke: `1.5px ${step.color}55`,
            marginLeft: "auto",
            opacity: 0.9,
          }}
        >
          {step.n.toString().padStart(2, "0")}
        </div>
      </div>

      <div
        style={{
          fontFamily: T.fontDisplay,
          fontWeight: 800,
          fontSize: 22,
          marginBottom: 8,
          color: "#fff",
        }}
      >
        {t(step.titleKey)}
      </div>
      <div
        style={{
          color: T.textMuted,
          fontSize: 14.5,
          lineHeight: 1.55,
        }}
      >
        {t(step.bodyKey)}
      </div>
    </div>
  );
}
