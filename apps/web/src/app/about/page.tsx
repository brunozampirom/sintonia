import type { Metadata } from "next";
import { IoArrowForwardOutline } from "react-icons/io5";
import { T } from "@/lib/tokens";

export const metadata: Metadata = {
  title: "Sobre o Sintonia · O jogo de festa em sintonia mental",
  description:
    "Conheça o Sintonia: um jogo de festa pra celular onde a galera tenta entrar em sintonia mental dando uma dica sobre um alvo secreto num espectro. Grátis, sem cadastro, até 8 jogadores no mesmo aparelho.",
  alternates: {
    canonical: "https://sintonia.party/about",
  },
};

export default function AboutPage() {
  return (
    <main style={{ padding: "80px 0 120px", position: "relative", zIndex: 2 }}>
      <article
        className="sintonia-container"
        style={{
          maxWidth: 760,
          fontFamily: T.fontBody,
          color: "#E0E6F3",
          fontSize: 15.5,
          lineHeight: 1.7,
        }}
      >
        <header style={{ marginBottom: 48, textAlign: "center" }}>
          <span className="section-eyebrow">Sobre</span>
          <h1
            style={{
              fontFamily: T.fontDisplay,
              fontWeight: 900,
              fontSize: "clamp(38px, 6vw, 56px)",
              letterSpacing: -0.5,
              lineHeight: 1.05,
              color: "#fff",
              margin: "18px 0 14px",
              textWrap: "balance",
            }}
          >
            O jogo de festa em sintonia mental.
          </h1>
          <p
            style={{
              color: T.textMuted,
              fontSize: 17,
              maxWidth: 560,
              margin: "0 auto",
              textWrap: "pretty",
            }}
          >
            Sintonia é um jogo de adivinhação pra grupos. A gente fez ele pra ser
            entendido em 20 segundos e jogado em qualquer mesa. Sem cadastro,
            sem propaganda, sem regra decorada.
          </p>
        </header>

        <H2>A ideia</H2>
        <p>
          Sintonia nasceu de uma pergunta simples: quantos jogos de festa rolam
          bem com a tia, com a sobrinha de 14 e com o amigo que nunca jogou
          nada na vida ao mesmo tempo? A maioria pede leitura de carta, regra
          complicada, conhecimento prévio. Sintonia precisa de zero — você dá
          uma dica e a galera arrasta a agulha. É só isso.
        </p>
        <p>
          Por trás dessa simplicidade tem uma mecânica de espectro contínuo
          (não é múltipla escolha): você não tá escolhendo entre A ou B, tá
          dizendo &ldquo;tipo 60% pra esse lado, 40% pra esse&rdquo;. Isso
          abre espaço pra criatividade real: uma dica boa não é a mais óbvia,
          é a que faz a galera entender exatamente onde você quis chegar.
        </p>

        <H2>Como uma rodada funciona</H2>
        <p>
          Cada partida tem várias rodadas. A cada rodada o celular sorteia um
          jogador pra dar a dica e mostra dois polos no espectro — por exemplo{" "}
          <em>Frio ↔ Quente</em>, <em>Sommelier ↔ Vinho é só sangue de boi</em>,
          ou <em>Toca em Coachella ↔ Tapa de revista do coração</em>. Só esse
          jogador vê o alvo secreto na semicircunferência: pode estar bem no
          centro, na pontinha da esquerda, no meio do caminho, em qualquer
          lugar.
        </p>
        <p>
          A pessoa pensa numa dica que represente esse ponto — uma palavra,
          uma expressão, um nome próprio, o que for. Diz a dica em voz alta e
          passa o celular pra galera. Cada um arrasta a agulha pro lugar que
          combina com a dica. Quando todo mundo confirma, o jogo revela o alvo
          e calcula a pontuação: bullseye exato vale +4, próximo vale +3,
          razoavelmente perto vale +2, longe não pontua. Primeiro a chegar na
          meta da partida vence.
        </p>

        <H2>O que faz funcionar</H2>
        <p>
          A graça não está no algoritmo, está na escolha da palavra. Uma boa
          dica é específica o bastante pra apontar pra um lado, mas não tão
          específica que entregue o ponto exato. Se o alvo tá num ponto
          ligeiramente mais &ldquo;esquisito&rdquo; do que &ldquo;comum&rdquo;,
          o desafio é achar uma referência que dê esse sinal sem ser um chute
          óbvio. É aí que a gente descobre coisas sobre os amigos: como eles
          pensam, do que riem, o que consideram cringe.
        </p>
        <p>
          A gente passou meses ajustando os espectros pra que essa tensão
          funcionasse — descartando os muito polarizados (sem graça) e os
          muito vagos (impossíveis). O resultado são mais de 270 cartões em
          português, inglês e espanhol, com referências culturais adaptadas
          em cada idioma. Não é tradução automática: as gírias e ícones
          regionais foram escritos do zero pra cada região.
        </p>

        <H2>Pra quem é</H2>
        <p>
          Sintonia funciona em qualquer grupo de 2 a 8 pessoas, em um único
          celular. A gente vê três cenários se repetindo:
        </p>
        <ul style={listStyle}>
          <Li>
            <strong>Festa em casa</strong>. O jogo entra no meio da conversa.
            Não precisa de mesa, não trava o ritmo da noite. Funciona como um
            quebra-gelo entre pessoas que não se conhecem direito.
          </Li>
          <Li>
            <strong>Reunião de família</strong>. A simplicidade é o ponto: a
            tia entende, o sobrinho entende, a vó entende. As referências dos
            espectros têm camadas — alguns são geracionais, outros universais.
            Você descobre o que os primos acham &ldquo;moderno&rdquo;.
          </Li>
          <Li>
            <strong>Mesa de bar</strong>. Quatro amigos, uma cerveja, um
            celular passando entre as mãos. O jogo dura o quanto a partida
            durar — você define a meta de pontos, vence quem chegar primeiro.
          </Li>
        </ul>

        <H2>Sem internet, sem cadastro, sem dado pessoal</H2>
        <p>
          O Sintonia roda 100% offline depois do download. Não tem login, não
          pede e-mail, não envia dado nenhum pra nenhum servidor (
          <a href="/privacy" style={linkStyle}>
            política de privacidade
          </a>
          ). Os espectros customizados que você cria ficam no próprio
          aparelho. Sem propaganda, sem assinatura, sem compra dentro do app.
          A gente fez o app pelo prazer de fazer um jogo bom — não pra
          monetizar você.
        </p>

        <H2>iOS e Android, em três idiomas</H2>
        <p>
          O Sintonia tá disponível no iPhone, iPad e Android (celular e
          tablet). Suporta português brasileiro, inglês e espanhol latino-
          americano, com troca de idioma a qualquer momento dentro do app. A
          interface foi pensada pra funcionar bem em paisagem também — útil
          pra grupos maiores que querem ver o dial de cantos diferentes da
          mesa.
        </p>

        <div
          style={{
            marginTop: 56,
            padding: "32px 28px",
            borderRadius: 24,
            background:
              "linear-gradient(180deg, rgba(36,51,84,0.7) 0%, rgba(26,39,68,0.85) 100%)",
            border: `1px solid ${T.primary}33`,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: T.fontDisplay,
              fontWeight: 800,
              fontSize: 22,
              color: "#fff",
              margin: "0 0 12px",
            }}
          >
            Bora jogar?
          </p>
          <p
            style={{
              color: T.textMuted,
              fontSize: 14,
              margin: "0 0 22px",
            }}
          >
            Baixa de graça e chama a galera.
          </p>
          <a
            href="/"
            className="press inline-flex items-center"
            style={{
              gap: 10,
              background: T.primary,
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 999,
              fontFamily: T.fontDisplay,
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: 1.3,
              textTransform: "uppercase",
              boxShadow: "0 6px 18px rgba(211,119,63,0.45)",
            }}
          >
            <span>Voltar pra home</span>
            <IoArrowForwardOutline size={18} />
          </a>
        </div>

        <div className="wave-sep" style={{ margin: "56px 0 32px" }} />
        <p
          style={{
            color: T.textMuted,
            fontSize: 12,
            textAlign: "center",
            opacity: 0.7,
          }}
        >
          © 2026 Sintonia
        </p>
      </article>
    </main>
  );
}

const listStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  paddingLeft: 22,
  margin: "16px 0",
};

const linkStyle: React.CSSProperties = {
  color: T.accent,
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: T.fontDisplay,
        fontWeight: 800,
        fontSize: 24,
        letterSpacing: 0.3,
        color: "#fff",
        marginTop: 44,
        marginBottom: 14,
        textWrap: "balance",
      }}
    >
      {children}
    </h2>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ listStyleType: "disc", color: "#E0E6F3" }}>{children}</li>
  );
}
