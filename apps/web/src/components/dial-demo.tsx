"use client";

import { useState } from "react";
import { useLocale, useT } from "@/lib/i18n";
import { T } from "@/lib/tokens";
import { Confetti } from "./confetti";
import { WavelengthDial } from "./wavelength-dial";

interface Spectrum {
  l: { pt: string; en: string; es: string };
  r: { pt: string; en: string; es: string };
  clue: { pt: string; en: string; es: string };
  target: number;
}

// Curated from apps/mobile/data/spectrums.*.json — alternates left/right so
// the dial isn't always pointing in the same direction.
const SPECTRUMS: Spectrum[] = [
  // RIGHT
  {
    l: { pt: "Pequeno", en: "Tiny", es: "Pequeño" },
    r: { pt: "Gigante", en: "Huge", es: "Gigante" },
    clue: { pt: "Elefante", en: "Elephant", es: "Elefante" },
    target: 168,
  },
  // LEFT
  {
    l: { pt: "Famoso", en: "Famous", es: "Famoso" },
    r: { pt: "Desconhecido", en: "Unknown", es: "Desconocido" },
    clue: { pt: "Beyoncé", en: "Beyoncé", es: "Beyoncé" },
    target: 20,
  },
  // RIGHT
  {
    l: { pt: "Comum", en: "Common", es: "Común" },
    r: { pt: "Esquisito", en: "Weird", es: "Raro" },
    clue: { pt: "Abacaxi na pizza", en: "Pineapple pizza", es: "Piña en la pizza" },
    target: 140,
  },
  // LEFT
  {
    l: { pt: "Saudável", en: "Healthy", es: "Saludable" },
    r: { pt: "Porcaria", en: "Junk", es: "Chatarra" },
    clue: { pt: "Brócolis no vapor", en: "Steamed broccoli", es: "Brócoli al vapor" },
    target: 14,
  },
  // RIGHT
  {
    l: { pt: "Antigo", en: "Old-school", es: "Antiguo" },
    r: { pt: "Moderno", en: "Modern", es: "Moderno" },
    clue: { pt: "TikTok", en: "TikTok", es: "TikTok" },
    target: 172,
  },
  // LEFT
  {
    l: { pt: "Doce", en: "Sweet", es: "Dulce" },
    r: { pt: "Amargo", en: "Bitter", es: "Amargo" },
    clue: { pt: "Algodão doce", en: "Cotton candy", es: "Algodón de azúcar" },
    target: 12,
  },
  // RIGHT
  {
    l: { pt: "Rápido", en: "Fast", es: "Rápido" },
    r: { pt: "Lento", en: "Slow", es: "Lento" },
    clue: { pt: "Bicho-preguiça", en: "Sloth", es: "Perezoso" },
    target: 168,
  },
  // LEFT
  {
    l: { pt: "Corajoso", en: "Brave", es: "Valiente" },
    r: { pt: "Medroso", en: "Coward", es: "Miedoso" },
    clue: { pt: "Bombeiro", en: "Firefighter", es: "Bombero" },
    target: 22,
  },
];

function scoreFor(diff: number) {
  if (diff <= 12) return 4;
  if (diff <= 24) return 3;
  if (diff <= 36) return 2;
  return 0;
}

export function DialDemo() {
  const t = useT();
  const { locale: loc } = useLocale();
  const [spectrum, setSpectrum] = useState(SPECTRUMS[0]);
  const [guess, setGuess] = useState(90);
  const [locked, setLocked] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [pressed, setPressed] = useState(false);

  const diff = Math.abs(spectrum.target - guess);
  const pts = locked ? scoreFor(diff) : null;

  function next() {
    const pool = SPECTRUMS.filter((s) => s !== spectrum);
    setSpectrum(pool[Math.floor(Math.random() * pool.length)]);
    setGuess(90);
    setLocked(false);
  }

  function lockIn() {
    setLocked(true);
    if (scoreFor(diff) >= 3) setConfettiKey((k) => k + 1);
  }

  const verdictColor = !locked
    ? T.text
    : pts === 4
      ? T.zone4
      : pts === 3
        ? T.zone3
        : pts === 2
          ? T.zone2
          : T.textMuted;

  const verdictLabel = !locked
    ? "···"
    : pts === 4
      ? t("demo.verdict.perfect")
      : pts === 3
        ? t("demo.verdict.close")
        : pts === 2
          ? t("demo.verdict.near")
          : t("demo.verdict.miss");

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(36,51,84,0.65) 0%, rgba(26,39,68,0.85) 100%)",
        border: "1px solid rgba(139,157,195,0.18)",
        borderRadius: 28,
        padding: "32px 28px 28px",
        boxShadow:
          "0 24px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(40% 50% at 80% 15%, rgba(245,166,35,0.12), transparent 70%)," +
            "radial-gradient(40% 60% at 10% 90%, rgba(232,67,147,0.10), transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-3.5">
        <div
          className="flex flex-wrap items-center justify-center gap-2.5"
          style={{
            color: T.textMuted,
            fontFamily: T.fontBody,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 0.6,
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: T.accent,
              boxShadow: `0 0 8px ${T.accent}`,
            }}
          />
          <span className="whitespace-nowrap">
            {t("demo.clueLabel")}{" "}
            <span
              style={{
                color: T.accent,
                fontWeight: 900,
                letterSpacing: 1,
              }}
            >
              &ldquo;{spectrum.clue[loc]}&rdquo;
            </span>
          </span>
        </div>

        <div
          className="flex items-center gap-2.5"
          style={{
            fontFamily: T.fontDisplay,
            fontWeight: 900,
            fontSize: 28,
            letterSpacing: 1.4,
            color: verdictColor,
            textShadow:
              locked && pts !== null && pts >= 2
                ? `0 0 18px ${verdictColor}`
                : "none",
            height: 38,
          }}
        >
          {verdictLabel}
          {locked && pts !== null && pts > 0 && (
            <span style={{ color: verdictColor }}>+{pts}</span>
          )}
        </div>

        <div className="relative">
          <WavelengthDial
            size={360}
            targetAngle={spectrum.target}
            guessAngle={guess}
            showTarget={locked}
            showGuess
            interactive={!locked}
            onGuessChange={setGuess}
          />
          <Confetti trigger={confettiKey} originY={68} count={45} />
        </div>

        <div
          className="flex items-center justify-between w-full"
          style={{
            background: T.dialBorder,
            borderRadius: 16,
            padding: "14px 18px",
            maxWidth: 460,
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          }}
        >
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
            ← {spectrum.l[loc]}
          </span>
          <span
            style={{
              width: 2,
              height: 24,
              background: "rgba(255,255,255,0.3)",
            }}
          />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
            {spectrum.r[loc]} →
          </span>
        </div>

        <button
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          onMouseLeave={() => setPressed(false)}
          onClick={locked ? next : lockIn}
          style={{
            background: locked ? T.accent : T.primary,
            color: locked ? T.bg : T.text,
            border: "none",
            borderRadius: 30,
            padding: "16px 40px",
            minWidth: 200,
            fontFamily: T.fontDisplay,
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            cursor: "pointer",
            marginTop: 6,
            boxShadow: "0 4px 12px rgba(211,119,63,0.35)",
            transform: pressed ? "scale(0.93)" : "scale(1)",
            transition: "transform 120ms cubic-bezier(.2,.7,.2,1)",
          }}
        >
          {locked ? t("demo.next") : t("demo.reveal")}
        </button>

        <div
          className="text-center"
          style={{
            color: T.textMuted,
            fontSize: 12,
            marginTop: 4,
          }}
        >
          {locked
            ? `${t("demo.difference")} ${Math.round(diff)}°, ${pts === 4 ? t("demo.afterPerfect") : pts !== null && pts >= 2 ? t("demo.afterClose") : t("demo.afterMiss")}`
            : t("demo.placeholder")}
        </div>
      </div>
    </div>
  );
}
