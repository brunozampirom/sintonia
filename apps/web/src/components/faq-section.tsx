"use client";

import { useState } from "react";
import { IoAddOutline, IoRemoveOutline } from "react-icons/io5";
import { T } from "@/lib/tokens";

interface QA {
  q: string;
  a: string;
}

const FAQ: QA[] = [
  {
    q: "Como funciona o Sintonia?",
    a: "Cada rodada, um jogador vê um alvo secreto num espectro entre dois extremos (tipo 'Frio ↔ Quente'). Ele pensa numa dica que represente esse ponto e diz em voz alta (ou digita, no modo online por texto). A galera adivinha arrastando uma agulha no celular pro lugar que combina com a dica. Quanto mais perto, mais ponto. Primeiro a atingir a meta vence.",
  },
  {
    q: "Pra quantas pessoas é o jogo?",
    a: "De 2 a 8 jogadores, em dois modos. No Mesmo Celular, vocês passam o aparelho entre as pessoas a cada rodada. No online, cada um joga do seu celular numa sala. Funciona bem em grupos pequenos no sofá, em rolês maiores em mesa de bar ou numa call com a galera.",
  },
  {
    q: "Dá pra jogar cada um no seu celular, mesmo à distância?",
    a: "Dá. No modo online, uma pessoa cria a sala e chama a galera por link, código ou QR code. Cada um precisa ter o app instalado. A dica pode ser dita em voz alta, na mesa ou numa call do Discord, ou digitada por texto, e dá pra escolher se todo mundo palpita ou um por vez.",
  },
  {
    q: "Precisa de internet pra jogar?",
    a: "Depende do modo. O Mesmo Celular funciona 100% offline depois da instalação: você abre, escolhe os jogadores e joga. O modo online precisa de internet pra conectar a sala. Nenhum dos dois pede login ou cadastro.",
  },
  {
    q: "É grátis mesmo? Tem propaganda?",
    a: "Totalmente grátis. Zero anúncio dentro do jogo, zero compra dentro do app, zero assinatura. Sem cadastro também — não pedimos e-mail, telefone nem qualquer dado pessoal.",
  },
  {
    q: "Funciona em iPad e tablet?",
    a: "Sim. O iOS roda em iPhone e iPad (versão universal). Android suporta tablets também, com layout adaptado pra telas maiores em modo paisagem.",
  },
  {
    q: "Em quais idiomas o jogo está disponível?",
    a: "Três idiomas com conteúdo nativo: português brasileiro, inglês e espanhol (LatAm). Os espectros foram localizados pra cada idioma — não é tradução automática, são referências culturais adaptadas pra cada região.",
  },
  {
    q: "Posso criar meus próprios espectros?",
    a: "Sim, dentro do app tem o recurso de espectros customizados. Você cria os cartões que quiser pra zoar o grupo com piadas internas. Eles ficam salvos só no seu celular e, se você criar uma sala online, entram na partida da galera também.",
  },
  {
    q: "Quantos espectros vêm no jogo?",
    a: "Mais de 270 espectros prontos em cada idioma, divididos entre clássicos ('Frio ↔ Quente'), polêmicos ('Sommelier ↔ Vinho é só sangue de boi'), cultura pop, comportamento, geração e mais.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      style={{ padding: "60px 0 80px", position: "relative", zIndex: 2 }}
    >
      <div className="sintonia-container" style={{ maxWidth: 800 }}>
        <div
          className="flex flex-col items-center text-center"
          style={{ marginBottom: 40 }}
        >
          <span className="section-eyebrow">Perguntas frequentes</span>
          <h2 className="section-title">Tudo o que rola na cabeça antes de baixar.</h2>
        </div>

        <div className="flex flex-col" style={{ gap: 10 }}>
          {FAQ.map((item, i) => (
            <FaqItem
              key={i}
              item={item}
              isOpen={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
            />
          ))}
        </div>
      </div>

      {/* FAQPage JSON-LD — search engines surface these as expanded rich results */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.a,
              },
            })),
          }),
        }}
      />
    </section>
  );
}

function FaqItem({
  item,
  isOpen,
  onToggle,
}: {
  item: QA;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, rgba(36,51,84,0.5) 0%, rgba(26,39,68,0.5) 100%)",
        border: `1px solid ${isOpen ? `${T.primary}55` : "rgba(139,157,195,0.14)"}`,
        borderRadius: 18,
        overflow: "hidden",
        transition: "border-color 200ms",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          padding: "20px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          cursor: "pointer",
          color: "#fff",
          fontFamily: T.fontDisplay,
          fontWeight: 700,
          fontSize: 17,
          lineHeight: 1.35,
          textAlign: "left",
        }}
      >
        <span style={{ flex: 1 }}>{item.q}</span>
        <span
          style={{
            flex: "0 0 auto",
            width: 32,
            height: 32,
            borderRadius: 999,
            background: isOpen ? T.primary : "rgba(139,157,195,0.15)",
            color: isOpen ? "#fff" : T.textMuted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 200ms, color 200ms",
          }}
        >
          {isOpen ? <IoRemoveOutline size={18} /> : <IoAddOutline size={18} />}
        </span>
      </button>

      <div
        style={{
          maxHeight: isOpen ? 400 : 0,
          opacity: isOpen ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 320ms cubic-bezier(.2,.7,.2,1), opacity 200ms",
        }}
      >
        <p
          style={{
            margin: 0,
            padding: "0 22px 22px",
            color: T.textMuted,
            fontSize: 14.5,
            lineHeight: 1.6,
          }}
        >
          {item.a}
        </p>
      </div>
    </div>
  );
}
