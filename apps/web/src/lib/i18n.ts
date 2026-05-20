"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Locale = "pt" | "en" | "es";

type Dict = Record<string, string>;

const PT: Dict = {
  "nav.howItWorks": "Como Funciona",
  "nav.demo": "Experimente",
  "nav.features": "Recursos",
  "nav.download": "BAIXAR",

  "hero.chip": "Disponível pra iOS e Android",
  "hero.subtitle": "um jogo de sintonia mental",
  "hero.description.before": "Você vê",
  "hero.description.highlight": "um alvo secreto",
  "hero.description.after": "e dá uma dica pra galera adivinhar onde ele cai no espectro. Quanto mais perto, mais ponto.",
  "hero.tagline": "Aquele jogo que vai salvar seus rolês de ficarem no celular.",
  "hero.stat.spectrums": "espectros",
  "hero.stat.players": "jogadores",
  "hero.stat.signup": "cadastro",
  "hero.stat.rounds": "rodadas",
  "hero.scrollCue": "Role para descobrir",

  "how.eyebrow": "Como Funciona",
  "how.title": "Três passos. Um celular. Bora jogar.",
  "how.subtitle": "Sintonia foi feito pra ser explicado em 20 segundos e jogado de pé, com bebida na mão. Sem app pra todo mundo. Sem cadastro. Sem regras decoradas.",
  "how.step1.title": "Dê a dica",
  "how.step1.body": "A tela mostra um alvo secreto. Pense numa dica que represente onde ele está no espectro entre os dois polos.",
  "how.step2.title": "Passe o celular",
  "how.step2.body": "A galera adivinha junto. Cada um arrasta a agulha pro ponto que combina com a sua dica.",
  "how.step3.title": "Pontuação na hora",
  "how.step3.body": "Quanto mais perto do alvo, mais pontos. Bullseye vale +4. Primeiro a chegar na meta leva a partida.",

  "demo.eyebrow": "Experimente Agora",
  "demo.title": "Não precisa baixar pra ver como é.",
  "demo.subtitle": "A dica tá aí. Arraste a agulha pro ponto onde você acha que ela cai no espectro e veja se entrou em sintonia.",

  "features.eyebrow": "Por que vai amar",
  "features.title.before": "Feito pra ser",
  "features.title.highlight": "aquele jogo",
  "features.title.after": "que salva o rolê.",
  "features.subtitle": "Aquele jogo que sai do armário toda vez que tem gente nova em casa. Da tia ao sobrinho, todo mundo pega na hora.",
  "features.active": "Em destaque",
  "features.players.title": "2 a 8 jogadores",
  "features.players.body": "Time pequeno, festa cheia, mesa de bar. Sintonia adapta a dinâmica ao número de gente que tá lá.",
  "features.onePhone.title": "Um celular só",
  "features.onePhone.body": "Ninguém precisa baixar nada. Você baixa, a galera joga junto. Mesma tela, mesma risada.",
  "features.spectrums.title": "200+ espectros",
  "features.spectrums.body": "De 'frio ↔ quente' até 'subestimado ↔ superestimado'. Vocabulário pra rachar o grupo e descobrir o que cada um pensa.",
  "features.languages.title": "PT, EN e ES",
  "features.languages.body": "Joga em português, inglês ou espanhol. Frases, espectros e gírias adaptados pra cada idioma.",
  "features.custom.title": "Espectros próprios",
  "features.custom.body": "Cria os seus pra zoar o grupo: do mais light ao mais peçonhento. O jogo te acompanha.",
  "features.offline.title": "Offline, sem ads",
  "features.offline.body": "Sem internet, sem assinatura, sem propaganda. Você abre, joga e fecha.",

  "cta.title": "Pronto pra entrar em sintonia?",
  "cta.subtitle": "Baixa de graça, chama a galera e descobre quem realmente pensa igual a você. Spoiler: nem o seu melhor amigo.",
  "cta.meta": "iOS 15+ · Android 8+ · 38 MB · sem cadastro · sem ads",

  "footer.howToPlay": "Como Jogar",
  "footer.privacy": "Privacidade",
  "footer.github": "GitHub",
  "footer.copyright": "© 2026 Sintonia",

  "store.ios.top": "Baixe na",
  "store.ios.bottom": "App Store",
  "store.android.top": "Disponível no",
  "store.android.bottom": "Google Play",

  "demo.clueLabel": "A dica é",
  "demo.placeholder": "Arraste a agulha pra onde acha que a dica está no espectro.",
  "demo.reveal": "REVELAR ALVO",
  "demo.next": "OUTRA DICA",
  "demo.verdict.perfect": "PERFEITO!",
  "demo.verdict.close": "QUASE LÁ!",
  "demo.verdict.near": "POR POUCO!",
  "demo.verdict.miss": "OPS... +0",
  "demo.afterPerfect": "na mosca.",
  "demo.afterClose": "quase lá.",
  "demo.afterMiss": "fora da zona pontuada.",
  "demo.difference": "Diferença de",
};

const EN: Dict = {
  "nav.howItWorks": "How It Works",
  "nav.demo": "Try It",
  "nav.features": "Features",
  "nav.download": "DOWNLOAD",

  "hero.chip": "Available on iOS and Android",
  "hero.subtitle": "a mind sync party game",
  "hero.description.before": "You see",
  "hero.description.highlight": "a secret target",
  "hero.description.after": "and give a clue for the crew to guess where it falls on the spectrum. The closer the guess, the more points.",
  "hero.tagline": "Finally a reason to look at the same phone together.",
  "hero.stat.spectrums": "spectrums",
  "hero.stat.players": "players",
  "hero.stat.signup": "sign-up",
  "hero.stat.rounds": "rounds",
  "hero.scrollCue": "Scroll to discover",

  "how.eyebrow": "How It Works",
  "how.title": "Three steps. One phone. Just play.",
  "how.subtitle": "Sintonia was built to be explained in 20 seconds and played on your feet, drink in hand. No app for everyone. No sign-up. No rules to memorize.",
  "how.step1.title": "Give the clue",
  "how.step1.body": "The screen shows a secret target. Think of a clue that nails where it falls on the spectrum between the two poles.",
  "how.step2.title": "Pass the phone",
  "how.step2.body": "Everyone else guesses together. They drag the needle to the spot that matches your clue.",
  "how.step3.title": "Score in real time",
  "how.step3.body": "The closer to the target, the more points. Bullseye is worth +4. First to reach the goal wins the match.",

  "demo.eyebrow": "Try It Now",
  "demo.title": "No need to download to see how it plays.",
  "demo.subtitle": "Here is the clue. Drag the needle to where you think it lands on the spectrum and see if you are in sync.",

  "features.eyebrow": "Why you will love it",
  "features.title.before": "Made to be",
  "features.title.highlight": "that game",
  "features.title.after": "that saves the night.",
  "features.subtitle": "The one that comes out of the cabinet every time new people show up. From your aunt to your nephew, everyone gets it right away.",
  "features.active": "Featured",
  "features.players.title": "2 to 8 players",
  "features.players.body": "Small team, full party, bar table. Sintonia adapts to whoever is there.",
  "features.onePhone.title": "Single phone",
  "features.onePhone.body": "Nobody else needs to download. You install it, the crew plays together. Same screen, same laughs.",
  "features.spectrums.title": "200+ spectrums",
  "features.spectrums.body": "From 'cold ↔ hot' to 'underrated ↔ overrated'. Built to spark debate and reveal what your friends actually think.",
  "features.languages.title": "EN, PT and ES",
  "features.languages.body": "Play in English, Portuguese or Spanish. Phrases, spectrums and slang adapted to each language.",
  "features.custom.title": "Custom spectrums",
  "features.custom.body": "Make your own for inside jokes and niche vibes. From the lightest to the spiciest.",
  "features.offline.title": "Offline, no ads",
  "features.offline.body": "No internet, no subscription, no advertising. You open, play and close.",

  "cta.title": "Ready to sync minds?",
  "cta.subtitle": "Free to play. Gather the crew and find out who actually thinks like you. Spoiler: not even your best friend.",
  "cta.meta": "iOS 15+ · Android 8+ · 38 MB · no sign-up · no ads",

  "footer.howToPlay": "How To Play",
  "footer.privacy": "Privacy",
  "footer.github": "GitHub",
  "footer.copyright": "© 2026 Sintonia",

  "store.ios.top": "Download on the",
  "store.ios.bottom": "App Store",
  "store.android.top": "Get it on",
  "store.android.bottom": "Google Play",

  "demo.clueLabel": "The clue is",
  "demo.placeholder": "Drag the needle to where you think the clue lands.",
  "demo.reveal": "REVEAL TARGET",
  "demo.next": "NEW CLUE",
  "demo.verdict.perfect": "PERFECT!",
  "demo.verdict.close": "SO CLOSE!",
  "demo.verdict.near": "ALMOST!",
  "demo.verdict.miss": "OOF... +0",
  "demo.afterPerfect": "bullseye.",
  "demo.afterClose": "almost there.",
  "demo.afterMiss": "outside the scoring zone.",
  "demo.difference": "Off by",
};

const ES: Dict = {
  "nav.howItWorks": "Cómo Funciona",
  "nav.demo": "Probalo",
  "nav.features": "Recursos",
  "nav.download": "DESCARGAR",

  "hero.chip": "Disponible para iOS y Android",
  "hero.subtitle": "un juego de sintonía mental",
  "hero.description.before": "Ves",
  "hero.description.highlight": "un objetivo secreto",
  "hero.description.after": "y le das una pista a la banda para que adivinen dónde cae en el espectro. Mientras más cerca, más puntos.",
  "hero.tagline": "El juego que va a salvar tus juntadas de quedarse en el celular.",
  "hero.stat.spectrums": "espectros",
  "hero.stat.players": "jugadores",
  "hero.stat.signup": "registro",
  "hero.stat.rounds": "rondas",
  "hero.scrollCue": "Scrolleá para descubrir",

  "how.eyebrow": "Cómo Funciona",
  "how.title": "Tres pasos. Un celular. A jugar.",
  "how.subtitle": "Sintonía está pensado para explicarse en 20 segundos y jugarse de pie, con la bebida en la mano. Sin app para todos. Sin registro. Sin reglas memorizadas.",
  "how.step1.title": "Dale la pista",
  "how.step1.body": "La pantalla muestra un objetivo secreto. Pensá una pista que represente dónde cae en el espectro entre los dos polos.",
  "how.step2.title": "Pasá el celular",
  "how.step2.body": "La banda adivina junta. Cada uno arrastra la aguja al punto que coincide con tu pista.",
  "how.step3.title": "Puntos en el momento",
  "how.step3.body": "Mientras más cerca del objetivo, más puntos. Bullseye vale +4. Primero en llegar a la meta gana la partida.",

  "demo.eyebrow": "Probalo Ahora",
  "demo.title": "No hace falta bajar la app para ver cómo es.",
  "demo.subtitle": "Ahí está la pista. Arrastrá la aguja al punto donde pensás que cae en el espectro y fijate si estás en sintonía.",

  "features.eyebrow": "Por qué lo vas a amar",
  "features.title.before": "Hecho para ser",
  "features.title.highlight": "ese juego",
  "features.title.after": "que salva la juntada.",
  "features.subtitle": "Ese juego que sale del armario cada vez que llega gente nueva. De la tía al sobrino, todos lo cazan al toque.",
  "features.active": "Destacado",
  "features.players.title": "2 a 8 jugadores",
  "features.players.body": "Grupo chico, fiesta llena, mesa de bar. Sintonía se adapta a la cantidad de gente que esté.",
  "features.onePhone.title": "Un solo celular",
  "features.onePhone.body": "Nadie tiene que bajar nada. Vos lo instalás, la banda juega junta. Misma pantalla, mismas risas.",
  "features.spectrums.title": "200+ espectros",
  "features.spectrums.body": "De 'frío ↔ caliente' a 'subestimado ↔ sobrevalorado'. Vocabulario para abrir el debate y descubrir lo que cada uno piensa.",
  "features.languages.title": "ES, PT y EN",
  "features.languages.body": "Jugá en español, portugués o inglés. Frases, espectros y modismos adaptados a cada idioma.",
  "features.custom.title": "Espectros propios",
  "features.custom.body": "Creá los tuyos para joder al grupo: del más light al más picante. El juego te sigue.",
  "features.offline.title": "Offline, sin ads",
  "features.offline.body": "Sin internet, sin suscripción, sin publicidad. Abrís, jugás y cerrás.",

  "cta.title": "¿Listo para entrar en sintonía?",
  "cta.subtitle": "Bajalo gratis, juntá a la banda y descubrí quién piensa realmente igual que vos. Spoiler: ni tu mejor amigo.",
  "cta.meta": "iOS 15+ · Android 8+ · 38 MB · sin registro · sin ads",

  "footer.howToPlay": "Cómo Jugar",
  "footer.privacy": "Privacidad",
  "footer.github": "GitHub",
  "footer.copyright": "© 2026 Sintonia",

  "store.ios.top": "Bajalo en la",
  "store.ios.bottom": "App Store",
  "store.android.top": "Disponible en",
  "store.android.bottom": "Google Play",

  "demo.clueLabel": "La pista es",
  "demo.placeholder": "Arrastrá la aguja al punto donde pensás que cae la pista.",
  "demo.reveal": "REVELAR OBJETIVO",
  "demo.next": "OTRA PISTA",
  "demo.verdict.perfect": "¡PERFECTO!",
  "demo.verdict.close": "¡CASI!",
  "demo.verdict.near": "¡POR POCO!",
  "demo.verdict.miss": "UF... +0",
  "demo.afterPerfect": "bullseye.",
  "demo.afterClose": "casi.",
  "demo.afterMiss": "fuera de la zona de puntos.",
  "demo.difference": "Diferencia de",
};

const DICTS: Record<Locale, Dict> = { pt: PT, en: EN, es: ES };

function detectLocale(): Locale {
  if (typeof window === "undefined") return "pt";
  const lang = (navigator.language || "pt").toLowerCase();
  if (lang.startsWith("es")) return "es";
  if (lang.startsWith("en")) return "en";
  return "pt";
}

export interface I18nState {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const I18nContext = createContext<I18nState>({
  locale: "pt",
  setLocale: () => {},
});

export function useT() {
  const { locale } = useContext(I18nContext);
  return (key: string) => DICTS[locale][key] ?? key;
}

export function useLocale() {
  return useContext(I18nContext);
}

const STORAGE_KEY = "sintonia.locale";

export function useI18nState(): I18nState {
  const [locale, setLocaleState] = useState<Locale>("pt");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Locale | null;
    if (stored && (stored === "pt" || stored === "en" || stored === "es")) {
      setLocaleState(stored);
    } else {
      setLocaleState(detectLocale());
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, l);
      } catch {}
    }
  };

  return { locale, setLocale };
}
