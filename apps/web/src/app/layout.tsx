import type { Metadata, Viewport } from "next";
import { I18nProvider } from "@/components/i18n-provider";
import { SiteFooter } from "@/components/site-footer";
import { TopNav } from "@/components/top-nav";
import { TwinkleStars } from "@/components/twinkle-stars";
import "./globals.css";

const SITE_URL = "https://sintonia.party";

const DESCRIPTION =
  "Sintonia é o jogo de festa em sintonia mental: dê uma dica, a galera adivinha onde cai no espectro. Grátis no iOS e Android, sem cadastro, até 8 jogadores no mesmo celular.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sintonia · Jogo de festa em sintonia mental",
    template: "%s · Sintonia",
  },
  description: DESCRIPTION,
  applicationName: "Sintonia",
  keywords: [
    "sintonia",
    "sintonia jogo",
    "sintonia party game",
    "jogo de festa",
    "jogo de festa pra celular",
    "jogo pra jogar com amigos",
    "jogo de adivinhar palavra",
    "jogo de espectro",
    "jogo de espectro mental",
    "jogo de uma palavra",
    "jogo no mesmo celular",
    "jogo de grupo no celular",
    "party game brasileiro",
    "jogo brasileiro",
    "jogo offline para grupos",
    "jogo de tabuleiro digital",
    "jogo de festa grátis",
    "jogo do tiktok",
    "party game",
  ],
  authors: [{ name: "Bruno Zampirom" }],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    title: "Sintonia · Jogo de festa em sintonia mental",
    description: DESCRIPTION,
    siteName: "Sintonia",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sintonia · Jogo de festa em sintonia mental",
    description: DESCRIPTION,
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

const APP_LD = {
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  name: "Sintonia",
  alternateName: "Sintonia Party Game",
  applicationCategory: "GameApplication",
  applicationSubCategory: "Party Game",
  operatingSystem: "iOS, ANDROID",
  description: DESCRIPTION,
  url: SITE_URL,
  inLanguage: ["pt-BR", "en", "es"],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "BRL",
    availability: "https://schema.org/InStock",
  },
  downloadUrl: [
    "https://apps.apple.com/br/app/sintonia-party-game/id6762064623",
    "https://play.google.com/store/apps/details?id=com.bruno.wavelength",
  ],
  installUrl: "https://apps.apple.com/br/app/sintonia-party-game/id6762064623",
  screenshot: `${SITE_URL}/opengraph-image`,
  author: {
    "@type": "Person",
    name: "Bruno Zampirom",
  },
  publisher: {
    "@type": "Person",
    name: "Bruno Zampirom",
  },
  datePublished: "2026-04-23",
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
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(APP_LD) }}
        />
      </body>
    </html>
  );
}
