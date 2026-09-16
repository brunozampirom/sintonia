"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { T } from "@/lib/tokens";
import { LanguagePicker } from "./language-picker";

export function TopNav() {
  const t = useT();
  const pathname = usePathname();
  // Language picker only on home — legal pages are PT-only for now.
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        transition: "background 240ms, border-color 240ms, backdrop-filter 240ms",
        background: scrolled ? "rgba(10,23,43,0.72)" : "transparent",
        backdropFilter: scrolled ? "blur(10px) saturate(140%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(10px) saturate(140%)" : "none",
        borderBottom: `1px solid ${scrolled ? "rgba(139,157,195,0.12)" : "transparent"}`,
      }}
    >
      <div
        className="sintonia-container flex items-center justify-between"
        style={{ padding: "14px 28px" }}
      >
        <a href="#top" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon.png"
            alt=""
            width={34}
            height={34}
            style={{ borderRadius: 9, boxShadow: "0 4px 10px rgba(0,0,0,0.4)" }}
          />
          <span
            style={{
              fontFamily: T.fontDisplay,
              fontWeight: 900,
              letterSpacing: 2.4,
              fontSize: 16,
              color: "#fff",
            }}
          >
            SINTONIA
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-6">
          <a href="/#how" className="nav-link" style={navLinkStyle}>
            {t("nav.howItWorks")}
          </a>
          <a href="/#demo" className="nav-link" style={navLinkStyle}>
            {t("nav.demo")}
          </a>
          <a href="/#features" className="nav-link" style={navLinkStyle}>
            {t("nav.features")}
          </a>
          {isHome && <LanguagePicker />}
          <a
            href="/#download"
            className="press"
            style={{
              background: T.primary,
              color: "#fff",
              borderRadius: 999,
              padding: "9px 18px",
              fontFamily: T.fontDisplay,
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 1.2,
              boxShadow: "0 4px 14px rgba(211,119,63,0.45)",
            }}
          >
            {t("nav.download")}
          </a>
        </nav>

        {isHome && (
          <div className="md:hidden">
            <LanguagePicker />
          </div>
        )}
      </div>
    </header>
  );
}

const navLinkStyle: React.CSSProperties = {
  color: T.textMuted,
  fontSize: 13,
  fontWeight: 700,
};
