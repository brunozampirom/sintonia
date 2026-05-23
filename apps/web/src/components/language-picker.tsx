"use client";

import { useLocale, type Locale } from "@/lib/i18n";
import { T } from "@/lib/tokens";

const LANGS: { code: Locale; label: string }[] = [
  { code: "pt", label: "PT" },
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
];

export function LanguagePicker() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className="inline-flex items-center"
      style={{
        background: "rgba(36,51,84,0.6)",
        border: "1px solid rgba(139,157,195,0.18)",
        borderRadius: 999,
        padding: 3,
        gap: 2,
      }}
    >
      {LANGS.map((l) => {
        const active = l.code === locale;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLocale(l.code)}
            style={{
              padding: "5px 10px",
              borderRadius: 999,
              fontFamily: T.fontBody,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1,
              cursor: "pointer",
              border: "none",
              background: active ? T.primary : "transparent",
              color: active ? "#fff" : T.textMuted,
              transition: "background 200ms, color 200ms",
            }}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
