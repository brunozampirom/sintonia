"use client";

import { useEffect, useRef, useState } from "react";
import { IoChevronDownOutline } from "react-icons/io5";
import { useT } from "@/lib/i18n";
import { T } from "@/lib/tokens";
import { PhoneMockup } from "./phone-mockup";
import { StoreButton } from "./store-button";

export function Hero() {
  const t = useT();
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const on = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 14;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      setParallax({ x, y });
    };
    window.addEventListener("mousemove", on);
    return () => window.removeEventListener("mousemove", on);
  }, []);

  return (
    <section
      id="top"
      className="relative flex items-center overflow-hidden"
      style={{
        minHeight: "min(820px, 100vh)",
        paddingTop: 60,
        paddingBottom: 80,
      }}
    >
      {/* Phone-side ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: 60,
          right: 0,
          width: "min(900px, 70vw)",
          height: 600,
          transform: `translateX(${parallax.x * 0.4}px) translateY(${parallax.y * 0.6}px)`,
          zIndex: 0,
          transition: "transform 600ms cubic-bezier(.2,.7,.2,1)",
          background:
            "radial-gradient(closest-side at 55% 45%, rgba(255,0,110,0.16), transparent 70%)," +
            "radial-gradient(closest-side at 70% 30%, rgba(123,47,247,0.14), transparent 70%)," +
            "radial-gradient(closest-side at 40% 65%, rgba(6,214,160,0.12), transparent 70%)," +
            "radial-gradient(closest-side at 75% 70%, rgba(255,190,11,0.10), transparent 70%)",
          filter: "blur(8px)",
        }}
      />

      <div
        className="sintonia-container hero-grid"
        style={{
          display: "grid",
          gap: 40,
          alignItems: "center",
        }}
      >
        <div>
          <div
            className="inline-flex items-center gap-2.5"
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(36,51,84,0.6)",
              border: "1px solid rgba(139,157,195,0.18)",
              color: T.textMuted,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: T.mint,
                boxShadow: `0 0 8px ${T.mint}`,
              }}
            />
            {t("hero.chip")}
          </div>

          <h1
            style={{
              fontFamily: T.fontDisplay,
              fontWeight: 900,
              fontSize: "clamp(48px, 7.5vw, 100px)",
              lineHeight: 0.92,
              letterSpacing: "clamp(2px, 0.45vw, 5px)",
              color: "#fff",
              margin: 0,
              textTransform: "uppercase",
              animation: "wordmark-pulse 4.5s ease-in-out infinite",
              textShadow: `0 0 22px ${T.primary}, 0 0 44px rgba(211,119,63,0.45)`,
              textWrap: "balance",
            }}
          >
            SINTONIA
          </h1>

          <div
            style={{
              color: T.textMuted,
              fontFamily: T.fontBody,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: 1.4,
              textTransform: "lowercase",
              marginTop: 18,
            }}
          >
            {t("hero.subtitle")}
          </div>

          <p
            style={{
              fontSize: 20,
              lineHeight: 1.45,
              color: "#E0E6F3",
              maxWidth: 540,
              marginTop: 18,
              marginBottom: 8,
              textWrap: "pretty",
            }}
          >
            {t("hero.description.before")}{" "}
            <em
              style={{
                color: T.accent,
                fontStyle: "normal",
                fontWeight: 700,
              }}
            >
              {t("hero.description.highlight")}
            </em>{" "}
            {t("hero.description.after")}
          </p>
          <p
            style={{
              fontSize: 15,
              color: T.textMuted,
              maxWidth: 540,
              marginTop: 0,
              marginBottom: 36,
              fontStyle: "italic",
              textWrap: "pretty",
            }}
          >
            {t("hero.tagline")}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <StoreButton store="ios" primary />
            <StoreButton store="android" />
          </div>

          <div
            className="flex flex-wrap items-center gap-x-6 gap-y-2"
            style={{
              marginTop: 36,
              color: T.textMuted,
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <Stat n="200+" label={t("hero.stat.spectrums")} />
            <Stat n="2–8" label={t("hero.stat.players")} />
            <Stat n="0" label={t("hero.stat.signup")} />
            <Stat n="∞" label={t("hero.stat.rounds")} />
          </div>
        </div>

        <TiltedPhone parallaxY={parallax.y} />
      </div>

      <div
        className="absolute flex flex-col items-center gap-2"
        style={{
          bottom: 18,
          left: "50%",
          transform: "translateX(-50%)",
          color: T.textMuted,
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: 2.2,
          textTransform: "uppercase",
          zIndex: 2,
          opacity: 0.65,
        }}
      >
        <span>{t("hero.scrollCue")}</span>
        <IoChevronDownOutline
          size={18}
          style={{
            color: T.textMuted,
            animation: "scroll-bob 1.8s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        .hero-grid {
          grid-template-columns: 1.1fr 0.9fr;
        }
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        style={{
          fontFamily: T.fontDisplay,
          fontWeight: 900,
          fontSize: 20,
          color: "#fff",
          letterSpacing: 0.5,
        }}
      >
        {n}
      </span>
      <span
        style={{
          textTransform: "uppercase",
          letterSpacing: 1,
          fontSize: 10.5,
          fontWeight: 800,
          color: T.textMuted,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function TiltedPhone({ parallaxY }: { parallaxY: number }) {
  const [tilt, setTilt] = useState({ rx: -4, ry: 8 });
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / 600));
      const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / 600));
      const ry = nx * 10 + 6;
      const rx = -ny * 8 - 3;
      setTilt({ rx, ry });
    };
    window.addEventListener("mousemove", on);
    return () => window.removeEventListener("mousemove", on);
  }, []);

  return (
    <div
      ref={wrapRef}
      className="flex justify-center items-center"
      style={{
        perspective: 1400,
        perspectiveOrigin: "50% 40%",
        transform: `translateY(${parallaxY * -0.6}px)`,
        transition: "transform 600ms cubic-bezier(.2,.7,.2,1)",
      }}
    >
      <div
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 420ms cubic-bezier(.2,.7,.2,1)",
          willChange: "transform",
          filter: `drop-shadow(${tilt.ry * -1.2}px ${24 - tilt.rx * 1.4}px 40px rgba(0,0,0,0.55))`,
        }}
      >
        <div
          style={{
            animation: "float-y 6s ease-in-out infinite",
            transformStyle: "preserve-3d",
          }}
        >
          <PhoneMockup width={260} />
        </div>
      </div>
    </div>
  );
}
