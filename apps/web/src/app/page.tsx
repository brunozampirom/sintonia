"use client";

import {
  IoColorPaletteOutline,
  IoCreateOutline,
  IoLanguageOutline,
  IoPeopleOutline,
} from "react-icons/io5";
import { FeatureCard } from "@/components/feature-card";
import { HeroWordmark } from "@/components/hero-wordmark";
import { PhoneMockup3D } from "@/components/phone-mockup-3d";
import { SpectrumsCarousel } from "@/components/spectrums-carousel";
import { StepCard } from "@/components/step-card";
import { StoreBadges } from "@/components/store-badges";
import { featuredSpectrums } from "@/lib/spectrums";

const FEATURES = [
  {
    icon: IoPeopleOutline,
    color: "#74B9FF",
    title: "Mesmo celular",
    desc: "Ninguém precisa baixar nada — é só passar o celular e jogar.",
  },
  {
    icon: IoColorPaletteOutline,
    color: "#E84393",
    title: "270+ espectros",
    desc: "De 'Frio ↔ Quente' a 'Sommelier ↔ Vinho é só Sangue de Boi' — nunca enjoa.",
  },
  {
    icon: IoLanguageOutline,
    color: "#F5A623",
    title: "PT-BR, EN & ES",
    desc: "Suporte completo pra português, inglês e espanhol — com gírias regionais.",
  },
  {
    icon: IoCreateOutline,
    color: "#AAC573",
    title: "Espectros custom",
    desc: "Crie seus próprios cartões com piadas internas e vibes nichadas da galera.",
  },
];

const STEPS = [
  {
    color: "#74B9FF",
    title: "Dê uma dica",
    desc: "Veja um alvo secreto no espectro e dê uma dica de uma palavra.",
  },
  {
    color: "#F5A623",
    title: "Leia a mente",
    desc: "Os outros arrastam a agulha pra onde acham que a dica se encaixa.",
  },
  {
    color: "#AAC573",
    title: "Pontue",
    desc: "Quanto mais perto do alvo, mais pontos — primeiro a bater a meta vence.",
  },
];

export default function HomePage() {
  return (
    <main className="relative z-10 mx-auto max-w-[1240px] px-6 md:px-8">
      {/* Hero */}
      <section className="grid md:grid-cols-[1fr_400px] gap-12 lg:gap-20 pt-16 md:pt-24 pb-20 md:pb-32 items-center">
        <div>
          <HeroWordmark />

          <div className="mt-10 flex flex-col items-center md:items-start gap-5">
            <StoreBadges />
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <span className="flex -space-x-1">
                {[...Array(4)].map((_, i) => (
                  <span
                    key={i}
                    className="h-5 w-5 rounded-full border-2 border-[var(--color-bg)]"
                    style={{
                      background: ["#74B9FF", "#E84393", "#F5A623", "#AAC573"][i],
                    }}
                  />
                ))}
              </span>
              <span>+360 instalações no primeiro mês</span>
            </div>
          </div>
        </div>

        {/* Phone */}
        <div className="flex justify-center md:justify-end">
          <PhoneMockup3D />
        </div>
      </section>

      <div className="wave-sep" />

      {/* How it works */}
      <section className="py-20 md:py-28">
        <SectionHeader
          eyebrow="Como funciona"
          title="3 passos pra todo mundo entrar em sintonia"
          subtitle="Aprenda em 30 segundos. Funciona com qualquer grupo, em qualquer mesa."
        />

        <div className="mt-12 flex flex-col md:flex-row gap-5">
          {STEPS.map((step, i) => (
            <StepCard
              key={i}
              number={i + 1}
              color={step.color}
              title={step.title}
              desc={step.desc}
            />
          ))}
        </div>
      </section>

      <div className="wave-sep" />

      {/* Spectrums carousel */}
      <section className="py-20 md:py-28">
        <SectionHeader
          eyebrow="O que rola por dentro"
          title="Espectros pra qualquer roda de amigos"
          subtitle="270+ cartões com referências culturais brasileiras, internet, geração e polêmica. Localizados pra PT-BR, EN e ES."
        />

        <div className="mt-12">
          <SpectrumsCarousel spectrums={featuredSpectrums} />
        </div>
      </section>

      <div className="wave-sep" />

      {/* Features */}
      <section className="py-20 md:py-28">
        <SectionHeader
          eyebrow="Por que vai curtir"
          title="Feito pra quem cansou de olhar pro próprio celular"
          subtitle="Sem cadastro, sem anúncios, sem in-app purchase. Abre e joga."
        />

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} index={i} {...f} />
          ))}
        </div>
      </section>

      <div className="wave-sep" />

      {/* CTA */}
      <section className="py-24 md:py-32 text-center">
        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-balance">
          Pronto pra sintonizar?
        </h2>
        <p className="mt-4 text-lg text-[var(--color-text-muted)]">
          Grátis, sem anúncios, sem cadastro.
        </p>
        <div className="mt-10">
          <StoreBadges />
        </div>
      </section>

      <footer className="border-t border-white/5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--color-text-muted)]">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wider">SINTONIA</span>
          <span>© 2026</span>
        </div>
        <div className="flex gap-6">
          <a href="/privacy" className="hover:text-white transition">
            Privacidade
          </a>
          <a href="/terms" className="hover:text-white transition">
            Termos
          </a>
        </div>
      </footer>
    </main>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center">
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] tracking-[2.4px] uppercase font-bold text-[var(--color-text-muted)]">
        {eyebrow}
      </span>
      <h2 className="mt-5 text-4xl md:text-5xl font-black tracking-tight text-balance leading-tight">
        {title}
      </h2>
      <p className="mt-4 text-base md:text-lg text-[var(--color-text-muted)] max-w-[56ch] mx-auto leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
}
