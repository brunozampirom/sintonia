"use client";

import { DialDemo } from "@/components/dial-demo";
import { FeaturesCarousel } from "@/components/features-carousel";
import { FinalCTA } from "@/components/final-cta";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { SiteFooter } from "@/components/site-footer";
import { TopNav } from "@/components/top-nav";
import { TwinkleStars } from "@/components/twinkle-stars";
import { useT } from "@/lib/i18n";

export default function HomePage() {
  const t = useT();
  return (
    <div className="relative z-10">
      <TwinkleStars count={110} />
      <TopNav />
      <Hero />
      <div className="wave-sep" />
      <div id="como">
        <HowItWorks />
      </div>
      <section id="demo" style={{ padding: "40px 0 80px", position: "relative", zIndex: 2 }}>
        <div className="sintonia-container">
          <div className="flex flex-col items-center text-center" style={{ marginBottom: 40 }}>
            <span className="section-eyebrow">{t("demo.eyebrow")}</span>
            <h2 className="section-title">{t("demo.title")}</h2>
            <p className="section-subtitle">{t("demo.subtitle")}</p>
          </div>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <DialDemo />
          </div>
        </div>
      </section>
      <div className="wave-sep" />
      <div id="features">
        <FeaturesCarousel />
      </div>
      <FinalCTA />
      <SiteFooter />
    </div>
  );
}
