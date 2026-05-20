import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://sintonia.party";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sintonia — um jogo de sintonia mental",
    template: "%s · Sintonia",
  },
  description:
    "Dê pistas, mova a agulha e descubra quem está na mesma frequência. Jogue com até 8 amigos no mesmo celular — grátis, sem cadastro, sem anúncios.",
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
    title: "Sintonia — um jogo de sintonia mental",
    description:
      "Dê pistas, mova a agulha e descubra quem está na mesma frequência. Jogue com até 8 amigos no mesmo celular.",
    siteName: "Sintonia",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sintonia — um jogo de sintonia mental",
    description: "Jogue com até 8 amigos no mesmo celular.",
  },
  appleWebApp: {
    title: "Sintonia",
    capable: true,
    statusBarStyle: "black-translucent",
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
        {children}
      </body>
    </html>
  );
}
