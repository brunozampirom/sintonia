import type { Metadata, Viewport } from "next";
import { I18nProvider } from "@/components/i18n-provider";
import { SiteFooter } from "@/components/site-footer";
import { TopNav } from "@/components/top-nav";
import { TwinkleStars } from "@/components/twinkle-stars";
import "./globals.css";

const SITE_URL = "https://sintonia.party";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sintonia · um jogo de sintonia mental",
    template: "%s · Sintonia",
  },
  description:
    "Dá uma dica de uma palavra só sobre um alvo secreto. A galera adivinha junto, no mesmo celular. Quanto mais perto, mais ponto.",
  applicationName: "Sintonia",
  keywords: [
    "jogo de festa",
    "party game",
    "sintonia",
    "wavelength",
    "jogo brasileiro",
    "jogo de grupo",
    "celular único",
    "amigos",
  ],
  authors: [{ name: "Bruno Zampirom" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    title: "Sintonia · um jogo de sintonia mental",
    description:
      "Dá uma dica de uma palavra só sobre um alvo secreto. A galera adivinha junto, no mesmo celular.",
    siteName: "Sintonia",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sintonia · um jogo de sintonia mental",
    description: "Jogue com até 8 amigos no mesmo celular.",
  },
  appleWebApp: {
    title: "Sintonia",
    capable: true,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a172b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="page-ambient" />
        <I18nProvider>
          <div className="relative z-10">
            <TwinkleStars count={110} />
            <TopNav />
            {children}
            <SiteFooter />
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
