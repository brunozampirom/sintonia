"use client";

import { useEffect, useMemo, useState } from "react";
import { T } from "@/lib/tokens";
import { MiniWaves } from "./mini-waves";
import { WavelengthDial } from "./wavelength-dial";

interface Props {
  width?: number;
}

// Titanium iPhone 16 Pro mockup with depth via gradient body, dynamic island,
// glossy bezel, side buttons. Inner screen cycles 3 app states.
export function PhoneMockup({ width = 300 }: Props) {
  const ratio = 19.5 / 9.5;
  const height = Math.round(width * ratio);

  const [variant, setVariant] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setVariant((v) => (v + 1) % 3), 4200);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="relative"
      style={{
        width,
        height,
      }}
    >
      {/* Titanium body — multi-stop gradient for depth */}
      <div
        className="absolute inset-0"
        style={{
          borderRadius: 48,
          background:
            "linear-gradient(135deg, #2a2f3a 0%, #5a6273 18%, #1a1d24 38%, #4a5260 58%, #1d2030 78%, #3a4250 100%)",
          boxShadow: [
            "0 40px 80px -20px rgba(0,0,0,0.75)",
            "0 25px 50px -10px rgba(0,0,0,0.55)",
            "inset 0 2px 3px rgba(255,255,255,0.18)",
            "inset 0 -2px 3px rgba(0,0,0,0.5)",
            "inset 0 0 0 1px rgba(255,255,255,0.05)",
          ].join(","),
        }}
      />

      {/* Side button highlights (left volume + right power) */}
      <div
        style={{
          position: "absolute",
          left: -3,
          top: 140,
          width: 3,
          height: 60,
          borderRadius: "0 2px 2px 0",
          background:
            "linear-gradient(to right, #1a1d24 30%, #4a5260 70%, #2a2f3a)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -3,
          top: 220,
          width: 3,
          height: 40,
          borderRadius: "0 2px 2px 0",
          background:
            "linear-gradient(to right, #1a1d24 30%, #4a5260 70%, #2a2f3a)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -3,
          top: 280,
          width: 3,
          height: 40,
          borderRadius: "0 2px 2px 0",
          background:
            "linear-gradient(to right, #1a1d24 30%, #4a5260 70%, #2a2f3a)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -3,
          top: 200,
          width: 3,
          height: 80,
          borderRadius: "2px 0 0 2px",
          background:
            "linear-gradient(to left, #1a1d24 30%, #4a5260 70%, #2a2f3a)",
        }}
      />

      {/* Inner glossy bezel (creates the “rim” around the screen) */}
      <div
        className="absolute"
        style={{
          inset: 6,
          borderRadius: 42,
          background:
            "radial-gradient(ellipse at top, rgba(255,255,255,0.15), transparent 60%), #060912",
        }}
      />

      {/* Screen */}
      <div
        className="absolute overflow-hidden"
        style={{
          inset: 10,
          background: T.bg,
          borderRadius: 38,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Status bar */}
        <div
          className="flex items-end justify-between"
          style={{
            height: 30,
            padding: "0 24px",
            color: "#fff",
            fontFamily: T.fontBody,
            fontSize: 11,
            fontWeight: 700,
            marginTop: 8,
          }}
        >
          <span>9:41</span>
          <span className="inline-flex items-center gap-1" style={{ opacity: 0.95 }}>
            {/* signal bars */}
            <span style={{ display: "inline-flex", gap: 1.5, alignItems: "flex-end", height: 9 }}>
              {[3, 5, 7, 9].map((h, i) => (
                <span key={i} style={{ width: 2, height: h, background: "#fff", borderRadius: 0.5 }} />
              ))}
            </span>
            {/* battery */}
            <span
              style={{
                width: 18,
                height: 9,
                borderRadius: 2,
                border: "1.2px solid #fff",
                position: "relative",
                marginLeft: 3,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  inset: 1,
                  background: "#fff",
                  borderRadius: 1,
                  right: 4,
                }}
              />
            </span>
          </span>
        </div>

        <div className="relative flex-1 overflow-hidden">
          {variant === 0 && <HomeMock />}
          {variant === 1 && <GameMock />}
          {variant === 2 && <ResultMock />}
        </div>
      </div>

      {/* Dynamic Island — pill on top of screen */}
      <div
        className="absolute"
        style={{
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          width: 110,
          height: 32,
          borderRadius: 20,
          background: "#000",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.06), inset 0 0 8px rgba(255,255,255,0.04)",
          zIndex: 5,
        }}
      >
        {/* Camera dot */}
        <div
          className="absolute"
          style={{
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, #1a1f2e 0%, #050810 80%)",
            boxShadow: "inset 0 0 0 1px #2a3a55",
          }}
        />
        {/* Speaker hint */}
        <div
          className="absolute"
          style={{
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "#080b14",
          }}
        />
      </div>

      {/* Glossy screen highlight overlay */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: 10,
          borderRadius: 38,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.03) 100%)",
          mixBlendMode: "screen",
          zIndex: 10,
        }}
      />
    </div>
  );
}

function MiniStars({ count = 30 }: { count?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const stars = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: count }).map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() < 0.2 ? 2 : 1,
      o: 0.15 + Math.random() * 0.35,
    }));
  }, [count, mounted]);
  return (
    <div className="absolute inset-0 pointer-events-none">
      {stars.map((s, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            background: "#fff",
            opacity: s.o,
          }}
        />
      ))}
    </div>
  );
}

function PillBtn({
  label,
  primary,
  fullWidth = true,
}: {
  label: string;
  primary?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <div
      style={{
        background: primary ? T.primary : "transparent",
        border: primary ? "none" : `1.5px solid ${T.textMuted}`,
        borderRadius: 999,
        padding: "11px 16px",
        color: "#fff",
        fontFamily: T.fontDisplay,
        fontWeight: 800,
        fontSize: 13,
        letterSpacing: 1.3,
        textAlign: "center",
        width: fullWidth ? "100%" : "auto",
        boxShadow: primary ? "0 4px 14px rgba(211,119,63,0.45)" : "none",
      }}
    >
      {label}
    </div>
  );
}

function HomeMock() {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center"
      style={{ padding: "44px 20px 22px" }}
    >
      <MiniStars count={36} />
      <div
        className="absolute"
        style={{ top: 28, left: 0, right: 0, height: 200, opacity: 0.92 }}
      >
        <MiniWaves />
      </div>

      <div
        className="flex flex-col items-center justify-center relative"
        style={{ flex: 1, zIndex: 2, marginTop: 64, width: "100%" }}
      >
        <div
          style={{
            fontFamily: T.fontDisplay,
            fontWeight: 900,
            fontSize: 30,
            letterSpacing: 4,
            color: "#fff",
            textShadow: `0 0 20px ${T.primary}, 0 0 40px rgba(211,119,63,0.4)`,
            textAlign: "center",
          }}
        >
          SINTONIA
        </div>
        <div
          style={{
            color: T.textMuted,
            fontSize: 10.5,
            marginTop: 8,
            letterSpacing: 1.2,
            textTransform: "lowercase",
            fontWeight: 600,
          }}
        >
          um jogo de sintonia mental
        </div>

        <div
          className="flex flex-col gap-2 w-full"
          style={{ marginTop: 42 }}
        >
          <PillBtn label="JOGAR" primary />
          <PillBtn label="CONFIGURAÇÕES" />
        </div>
      </div>

      <div
        className="relative"
        style={{
          padding: "7px 16px",
          borderRadius: 999,
          border: `1px solid ${T.surfaceLight}`,
          color: T.textMuted,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.4,
          zIndex: 2,
        }}
      >
        Aprenda a jogar
      </div>
    </div>
  );
}

function GameMock() {
  const players: Array<[string, string, number]> = [
    ["Bruno", T.primary, 7],
    ["Ana", T.sky, 4],
    ["Leo", T.secondary, 6],
    ["Júlia", T.lavender, 5],
  ];
  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ padding: "44px 14px 14px", gap: 8 }}
    >
      {/* Scoreboard */}
      <div
        className="flex justify-around"
        style={{
          gap: 4,
          padding: 6,
          background: T.surface,
          borderRadius: 12,
        }}
      >
        {players.map(([n, c, s], i) => (
          <div
            key={i}
            className="flex flex-col items-center"
            style={{
              gap: 2,
              padding: "3px 5px",
              borderRadius: 8,
              border: i === 0 ? `1.5px solid ${c}` : "1.5px solid transparent",
              background: i === 0 ? `${c}1F` : "transparent",
              flex: 1,
            }}
          >
            <span
              style={{
                fontSize: 8,
                color: T.textMuted,
                letterSpacing: 0.3,
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              {n}
            </span>
            <span
              style={{
                fontFamily: T.fontDisplay,
                fontWeight: 900,
                fontSize: 16,
                color: i === 0 ? c : "#fff",
              }}
            >
              {s}
            </span>
          </div>
        ))}
      </div>

      {/* Turn label */}
      <div
        className="text-center"
        style={{
          fontFamily: T.fontDisplay,
          fontWeight: 800,
          fontSize: 14,
          color: "#fff",
          marginTop: 2,
        }}
      >
        Bruno, sua vez!
      </div>
      <div
        className="text-center"
        style={{
          color: T.textMuted,
          fontSize: 9.5,
          marginTop: -4,
        }}
      >
        Veja o alvo e pense em uma dica
      </div>

      {/* Dial */}
      <div className="flex justify-center" style={{ marginTop: -4 }}>
        <WavelengthDial
          size={236}
          targetAngle={108}
          guessAngle={92}
          showTarget
          showGuess
        />
      </div>

      {/* Spectrum card */}
      <div
        className="flex items-center justify-between"
        style={{
          background: T.dialBorder,
          borderRadius: 12,
          padding: "10px 14px",
          marginTop: -8,
        }}
      >
        <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>
          ← Frio
        </span>
        <span
          style={{
            width: 1.5,
            height: 18,
            background: "rgba(255,255,255,0.3)",
          }}
        />
        <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>
          Quente →
        </span>
      </div>

      {/* Hint */}
      <div
        className="text-center"
        style={{
          color: T.accent,
          fontSize: 10.5,
          letterSpacing: 0.5,
          fontWeight: 800,
          fontStyle: "italic",
        }}
      >
        Diga a dica em voz alta
      </div>
    </div>
  );
}

function ResultMock() {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center text-center"
      style={{ padding: "60px 18px 22px", gap: 16 }}
    >
      <MiniStars count={26} />
      <div className="relative" style={{ zIndex: 2 }}>
        <div
          style={{
            fontFamily: T.fontDisplay,
            fontWeight: 900,
            fontSize: 30,
            color: "#fff",
            letterSpacing: 1,
            textShadow: `0 0 20px ${T.zone4}`,
          }}
        >
          PERFEITO!
        </div>
        <div
          style={{
            fontFamily: T.fontDisplay,
            fontWeight: 900,
            fontSize: 64,
            color: T.zone4,
            lineHeight: 1,
            marginTop: 8,
            textShadow: `0 0 28px ${T.zone4}aa`,
          }}
        >
          +4
        </div>
      </div>

      <div
        className="w-full flex flex-col"
        style={{ gap: 8, zIndex: 2 }}
      >
        <div
          className="flex justify-between items-center"
          style={{
            background: T.surface,
            borderRadius: 12,
            padding: "9px 14px",
          }}
        >
          <span style={{ color: "#fff", fontSize: 11.5, fontWeight: 700 }}>
            Alvo
          </span>
          <span
            style={{
              fontFamily: T.fontDisplay,
              fontWeight: 900,
              fontSize: 13,
              color: T.primary,
            }}
          >
            108°
          </span>
        </div>
        <div
          className="flex justify-between items-center"
          style={{
            background: T.surface,
            borderRadius: 12,
            padding: "9px 14px",
          }}
        >
          <span style={{ color: "#fff", fontSize: 11.5, fontWeight: 700 }}>
            Palpite
          </span>
          <span
            style={{
              fontFamily: T.fontDisplay,
              fontWeight: 900,
              fontSize: 13,
              color: T.mint,
            }}
          >
            106°
          </span>
        </div>
      </div>

      <div style={{ width: "100%", marginTop: 6 }}>
        <PillBtn label="PRÓXIMA RODADA" primary />
      </div>
    </div>
  );
}
