"use client";

import { useT } from "@/lib/i18n";
import { T } from "@/lib/tokens";
import { StoreButton } from "./store-button";

export function FinalCTA() {
  const t = useT();
  return (
    <section id="baixar" style={{ padding: "90px 0 90px", position: "relative", zIndex: 2 }}>
      <div className="sintonia-container">
        <div
          className="relative overflow-hidden"
          style={{
            background:
              "radial-gradient(80% 100% at 50% 0%, rgba(255,0,110,0.18), transparent 60%)," +
              "radial-gradient(70% 100% at 80% 100%, rgba(123,47,247,0.18), transparent 60%)," +
              "linear-gradient(180deg, rgba(26,39,68,0.85) 0%, rgba(10,23,43,0.95) 100%)",
            borderRadius: 32,
            border: "1px solid rgba(211,119,63,0.25)",
            padding: "clamp(48px, 8vw, 96px) clamp(28px, 6vw, 72px) clamp(56px, 7vw, 80px)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: T.fontDisplay,
              fontWeight: 900,
              fontSize: "clamp(34px, 5.6vw, 64px)",
              letterSpacing: 1,
              lineHeight: 1.05,
              color: "#fff",
              textShadow: `0 0 28px ${T.primary}66`,
              marginBottom: 16,
              textWrap: "balance",
            }}
          >
            {t("cta.title")}
          </div>
          <div
            style={{
              color: T.textMuted,
              fontSize: 17,
              maxWidth: 560,
              margin: "0 auto 32px",
              textWrap: "pretty",
            }}
          >
            {t("cta.subtitle")}
          </div>

          <div className="flex flex-wrap gap-3.5 justify-center">
            <StoreButton store="ios" primary />
            <StoreButton store="android" />
          </div>

          <div
            style={{
              marginTop: 28,
              color: T.textMuted,
              fontSize: 12,
              opacity: 0.7,
            }}
          >
            {t("cta.meta")}
          </div>
        </div>
      </div>
    </section>
  );
}
