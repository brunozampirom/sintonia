"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { T } from "@/lib/tokens";

const APP_STORE_URL = "https://apps.apple.com/br/app/sintonia-party-game/id6762064623";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.bruno.wavelength";

interface Props {
  store: "ios" | "android";
  primary?: boolean;
}

export function StoreButton({ store, primary }: Props) {
  const t = useT();
  const [pressed, setPressed] = useState(false);
  const isApple = store === "ios";
  const top = isApple ? t("store.ios.top") : t("store.android.top");
  const bot = isApple ? t("store.ios.bottom") : t("store.android.bottom");
  const href = isApple ? APP_STORE_URL : PLAY_STORE_URL;

  const bg = primary ? T.primary : T.surface;
  const border = primary ? "transparent" : T.surfaceLight;
  const glow = primary
    ? "0 8px 22px rgba(211,119,63,0.50), 0 0 0 1px rgba(255,255,255,0.05) inset"
    : "0 6px 14px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04) inset";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        background: bg,
        border: `1.5px solid ${border}`,
        borderRadius: 999,
        padding: "12px 22px",
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        boxShadow: glow,
        transform: pressed ? "scale(0.95)" : "scale(1)",
        transition:
          "transform 120ms cubic-bezier(.2,.7,.2,1), box-shadow 200ms",
        color: "#fff",
      }}
    >
      <span style={{ width: 26, height: 26, display: "inline-flex" }}>
        {isApple ? (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.7 12.4c0-2.5 2-3.7 2.1-3.8-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.8-3.2-.8-1.6 0-3.2 1-4 2.5-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3.1 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.4-2.8-.1-.1-2.7-1-2.8-3.9zM15.3 5.1c.7-.8 1.1-2 1-3.1-.9 0-2.1.6-2.7 1.4-.6.7-1.2 1.9-1 3 1 .1 2-.5 2.7-1.3z" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24">
            <defs>
              <linearGradient id="gp-a" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#00C9FF" />
                <stop offset="100%" stopColor="#00A2FF" />
              </linearGradient>
              <linearGradient id="gp-b" x1="0" x2="1" y1="1" y2="0">
                <stop offset="0%" stopColor="#FFD200" />
                <stop offset="100%" stopColor="#FFA200" />
              </linearGradient>
              <linearGradient id="gp-c" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#FF3D6B" />
                <stop offset="100%" stopColor="#D70036" />
              </linearGradient>
              <linearGradient id="gp-d" x1="0" x2="1" y1="1" y2="0">
                <stop offset="0%" stopColor="#00F076" />
                <stop offset="100%" stopColor="#00B844" />
              </linearGradient>
            </defs>
            <path d="M3.5 2.2v19.6c0 .4.2.7.5.9l11-10.7L4 1.4c-.3.2-.5.5-.5.8z" fill="url(#gp-a)" />
            <path d="M19.2 10.5l-3.3-1.9-2.4 2.4 2.4 2.4 3.3-1.9c1-.6 1-2.4 0-3z" fill="url(#gp-b)" />
            <path d="M15 11l-11 11c.4.2.9.2 1.3 0l10.6-6.1L15 11z" fill="url(#gp-c)" />
            <path d="M4 1.4l11 10.7L15.9 9 5.3 2.9c-.4-.2-.9-.2-1.3 0v-.1z" fill="url(#gp-d)" />
          </svg>
        )}
      </span>
      <span
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            fontFamily: T.fontBody,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 0.6,
            color: primary ? "rgba(255,255,255,0.85)" : T.textMuted,
            textTransform: "uppercase",
          }}
        >
          {top}
        </span>
        <span
          style={{
            fontFamily: T.fontDisplay,
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: 0.3,
            marginTop: 3,
            color: "#fff",
          }}
        >
          {bot}
        </span>
      </span>
    </a>
  );
}
