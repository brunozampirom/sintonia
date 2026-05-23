import type { Metadata } from "next";
import { IoArrowBackOutline } from "react-icons/io5";
import { T } from "@/lib/tokens";

export const metadata: Metadata = {
  title: "Saiu da sintonia",
  description: "Essa página não existe — bora voltar pra inicial.",
};

export default function NotFound() {
  return (
    <main
      className="relative z-10 flex items-center justify-center"
      style={{ minHeight: "calc(100vh - 240px)", padding: "60px 0 80px" }}
    >
      <div
        className="sintonia-container"
        style={{ maxWidth: 560, textAlign: "center" }}
      >
        <span className="section-eyebrow">404</span>

        <div
          style={{
            fontFamily: T.fontDisplay,
            fontWeight: 900,
            fontSize: "clamp(96px, 18vw, 180px)",
            letterSpacing: "clamp(2px, 0.4vw, 6px)",
            lineHeight: 1,
            color: "#fff",
            margin: "24px 0 8px",
            textShadow: `0 0 24px ${T.primary}, 0 0 48px rgba(211,119,63,0.4)`,
            animation: "wordmark-pulse 4.5s ease-in-out infinite",
          }}
        >
          404
        </div>

        <h1
          style={{
            fontFamily: T.fontDisplay,
            fontWeight: 800,
            fontSize: "clamp(28px, 4vw, 40px)",
            letterSpacing: -0.5,
            color: "#fff",
            marginTop: 12,
            marginBottom: 14,
            textWrap: "balance",
          }}
        >
          Saiu da sintonia.
        </h1>

        <p
          style={{
            color: T.textMuted,
            fontSize: 16,
            lineHeight: 1.55,
            maxWidth: 440,
            margin: "0 auto 36px",
          }}
        >
          Essa página não existe ou foi pro espectro errado. Volta pra
          home e tenta de novo.
        </p>

        <a
          href="/"
          className="press inline-flex items-center gap-3"
          style={{
            background: T.primary,
            color: "#fff",
            padding: "14px 28px",
            borderRadius: 999,
            fontFamily: T.fontDisplay,
            fontWeight: 800,
            fontSize: 16,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            boxShadow: "0 8px 22px rgba(211,119,63,0.50)",
          }}
        >
          <IoArrowBackOutline size={20} />
          <span>Voltar pra home</span>
        </a>
      </div>
    </main>
  );
}
