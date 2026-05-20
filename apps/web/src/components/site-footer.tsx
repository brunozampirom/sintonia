"use client";

import { useT } from "@/lib/i18n";
import { T } from "@/lib/tokens";

export function SiteFooter() {
  const t = useT();
  return (
    <footer style={{ padding: "32px 0 56px", position: "relative", zIndex: 2 }}>
      <div className="sintonia-container flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon.png"
            alt=""
            width={36}
            height={36}
            style={{
              borderRadius: 9,
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          />
          <div className="flex flex-col">
            <span
              style={{
                fontFamily: T.fontDisplay,
                fontWeight: 900,
                fontSize: 14,
                letterSpacing: 2,
                color: "#fff",
              }}
            >
              SINTONIA
            </span>
            <span style={{ color: T.textMuted, fontSize: 11 }}>
              {t("hero.subtitle")}
            </span>
          </div>
        </div>

        <div
          className="flex gap-5"
          style={{ color: T.textMuted, fontSize: 13, fontWeight: 600 }}
        >
          <a href="#como" className="nav-link cursor-pointer">
            {t("footer.howToPlay")}
          </a>
          <a href="/privacy" className="nav-link cursor-pointer">
            {t("footer.privacy")}
          </a>
        </div>

        <div style={{ color: T.textMuted, fontSize: 12, opacity: 0.7 }}>
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
}
