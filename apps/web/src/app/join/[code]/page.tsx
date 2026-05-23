"use client";

import { QRCodeSVG } from "qrcode.react";
import { use, useEffect, useState } from "react";
import { IoLogoApple, IoLogoGooglePlaystore, IoQrCodeOutline } from "react-icons/io5";
import { T } from "@/lib/tokens";

const APP_STORE_URL = "https://apps.apple.com/br/app/sintonia-party-game/id6762064623";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.bruno.wavelength";
const STORAGE_KEY = "sintonia.pending-join";

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function normalizeCode(raw: string): string {
  // 4-char codes from the multiplayer plan: A-HJ-NP-Z + 2-9 (no I/O/0/1)
  return decodeURIComponent(raw).toUpperCase().slice(0, 8);
}

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function JoinPage({ params }: PageProps) {
  const { code: rawCode } = use(params);
  const code = normalizeCode(rawCode);

  const [platform, setPlatform] = useState<Platform>("desktop");
  const [autoRedirect, setAutoRedirect] = useState(true);

  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);

    // Persist the code so the app can pick it up after install on a re-visit.
    // (The primary join path is the Universal Link itself: when the app is
    // installed, the OS intercepts /join/CODE and routes straight to the app.
    // This localStorage entry is the fallback for when the user comes back
    // to this web page after installing.)
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ code, at: Date.now() }),
      );
    } catch {
      // ignore quota / private mode errors
    }

    // Mobile: redirect to store automatically after a short delay so the
    // user has time to read what is happening.
    if (p === "ios" || p === "android") {
      const t = setTimeout(() => {
        if (autoRedirect) {
          window.location.href = p === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
        }
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [code, autoRedirect]);

  const joinUrl = `https://sintonia.party/join/${code}`;

  return (
    <main
      className="relative z-10 flex items-center justify-center"
      style={{
        minHeight: "calc(100vh - 240px)",
        padding: "60px 0 80px",
      }}
    >
      <div
        className="sintonia-container"
        style={{
          maxWidth: 640,
          textAlign: "center",
        }}
      >
        <span className="section-eyebrow">Convite</span>
        <h1
          style={{
            fontFamily: T.fontDisplay,
            fontWeight: 900,
            fontSize: "clamp(34px, 5.6vw, 56px)",
            letterSpacing: -0.5,
            lineHeight: 1.05,
            color: "#fff",
            margin: "18px 0 12px",
            textWrap: "balance",
          }}
        >
          Te chamaram pra uma sala
        </h1>

        {/* The code, big and copy-pasteable */}
        <div
          className="inline-flex items-center justify-center"
          style={{
            margin: "24px auto 14px",
            padding: "14px 28px",
            borderRadius: 18,
            background:
              "linear-gradient(180deg, rgba(36,51,84,0.85) 0%, rgba(26,39,68,0.95) 100%)",
            border: `1px solid ${T.primary}55`,
            boxShadow: `0 0 32px ${T.primary}22`,
          }}
        >
          <span
            style={{
              fontFamily: T.fontDisplay,
              fontWeight: 900,
              fontSize: 48,
              letterSpacing: 8,
              color: "#fff",
              textShadow: `0 0 22px ${T.primary}`,
              paddingLeft: 8,
            }}
          >
            {code}
          </span>
        </div>

        {platform === "desktop" && (
          <DesktopView joinUrl={joinUrl} />
        )}
        {platform === "ios" && (
          <MobileView
            kind="ios"
            onAbort={() => setAutoRedirect(false)}
            autoRedirect={autoRedirect}
          />
        )}
        {platform === "android" && (
          <MobileView
            kind="android"
            onAbort={() => setAutoRedirect(false)}
            autoRedirect={autoRedirect}
          />
        )}
      </div>
    </main>
  );
}

function DesktopView({ joinUrl }: { joinUrl: string }) {
  return (
    <>
      <p
        style={{
          color: T.textMuted,
          fontSize: 16,
          lineHeight: 1.5,
          maxWidth: 480,
          margin: "0 auto 36px",
        }}
      >
        Sintonia roda no celular. Escaneia o QR abaixo com a câmera do
        seu iPhone ou Android pra abrir a sala.
      </p>

      <div
        className="inline-flex"
        style={{
          padding: 18,
          borderRadius: 24,
          background: "#fff",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        }}
      >
        <QRCodeSVG
          value={joinUrl}
          size={224}
          marginSize={1}
          fgColor="#0a172b"
          bgColor="#ffffff"
          level="M"
        />
      </div>

      <div
        className="flex items-center justify-center gap-2"
        style={{ marginTop: 22, color: T.textMuted, fontSize: 13 }}
      >
        <IoQrCodeOutline />
        <span>Abrir câmera → mirar no QR</span>
      </div>

      <p style={{ color: T.textMuted, fontSize: 12, marginTop: 28, opacity: 0.7 }}>
        Ainda não tem o app?{" "}
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: T.accent, textDecoration: "underline" }}
        >
          App Store
        </a>{" "}
        ·{" "}
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: T.accent, textDecoration: "underline" }}
        >
          Google Play
        </a>
      </p>
    </>
  );
}

function MobileView({
  kind,
  onAbort,
  autoRedirect,
}: {
  kind: "ios" | "android";
  onAbort: () => void;
  autoRedirect: boolean;
}) {
  const storeUrl = kind === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
  const storeName = kind === "ios" ? "App Store" : "Google Play";
  const Icon = kind === "ios" ? IoLogoApple : IoLogoGooglePlaystore;

  return (
    <>
      <p
        style={{
          color: T.textMuted,
          fontSize: 16,
          lineHeight: 1.5,
          maxWidth: 480,
          margin: "0 auto 28px",
        }}
      >
        Vou te levar pra {storeName} pra baixar o Sintonia. Depois de
        instalar, abre o app e digita o código acima.
      </p>

      <a
        href={storeUrl}
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
        <Icon size={22} />
        <span>Abrir {storeName}</span>
      </a>

      {autoRedirect && (
        <p
          style={{
            color: T.textMuted,
            fontSize: 12,
            marginTop: 20,
            opacity: 0.8,
          }}
        >
          Redirecionando em alguns segundos.{" "}
          <button
            type="button"
            onClick={onAbort}
            style={{
              color: T.accent,
              background: "transparent",
              border: "none",
              textDecoration: "underline",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            cancelar
          </button>
        </p>
      )}
    </>
  );
}
