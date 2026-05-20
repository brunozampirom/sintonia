import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Sintonia — um jogo de sintonia mental";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(60% 50% at 50% 30%, rgba(211,119,63,0.32), transparent 65%)," +
            "radial-gradient(50% 50% at 80% 80%, rgba(232,67,147,0.18), transparent 65%)," +
            "radial-gradient(50% 50% at 15% 75%, rgba(85,239,196,0.14), transparent 65%)," +
            "linear-gradient(180deg, #0d1d36 0%, #0a172b 50%, #08132a 100%)",
          fontFamily: "system-ui, sans-serif",
          color: "#FFFFFF",
          position: "relative",
        }}
      >
        {/* Eyebrow chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 22px",
            borderRadius: 999,
            background: "rgba(36, 51, 84, 0.7)",
            border: "1px solid rgba(139, 157, 195, 0.25)",
            color: "#8B9DC3",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 2.4,
            textTransform: "uppercase",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: "#55EFC4",
              boxShadow: "0 0 12px #55EFC4",
            }}
          />
          <span>Disponível pra iOS e Android</span>
        </div>

        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            fontSize: 200,
            fontWeight: 900,
            letterSpacing: 12,
            color: "#FFFFFF",
            textShadow:
              "0 0 32px #D3773F, 0 0 64px rgba(211,119,63,0.55), 0 0 96px rgba(211,119,63,0.35)",
            lineHeight: 0.95,
          }}
        >
          SINTONIA
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: 32,
            fontWeight: 500,
            color: "#8B9DC3",
            letterSpacing: 2,
            marginTop: 24,
            textTransform: "lowercase",
          }}
        >
          um jogo de sintonia mental
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontSize: 26,
            fontWeight: 600,
            color: "#F5A623",
            marginTop: 32,
            fontStyle: "italic",
          }}
        >
          Funciona com a namorada, com a galera e até com a tia.
        </div>

        {/* Spectrum bar at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 8,
            background:
              "linear-gradient(90deg, #55EFC4 0%, #AAC573 18%, #F8E71C 38%, #F5A623 58%, #FF6B6B 78%, #E84393 100%)",
            opacity: 0.85,
          }}
        />
      </div>
    ),
    size,
  );
}
