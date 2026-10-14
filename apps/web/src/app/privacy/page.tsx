import type { Metadata } from "next";
import { T } from "@/lib/tokens";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como a Sintonia trata seus dados: o mínimo possível. No modo Mesmo Celular nada sai do seu celular, e no modo online só trafega o necessário pra partida acontecer.",
};

export default function PrivacyPage() {
  return (
    <main
      style={{
        padding: "80px 0 120px",
        position: "relative",
        zIndex: 2,
      }}
    >
      <article
        className="sintonia-container"
        style={{
          maxWidth: 760,
          fontFamily: T.fontBody,
          color: "#E0E6F3",
          fontSize: 15,
          lineHeight: 1.65,
        }}
      >
        <header style={{ marginBottom: 48, textAlign: "center" }}>
          <span className="section-eyebrow">Legal</span>
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
            Política de Privacidade
          </h1>
          <p style={{ color: T.textMuted, fontSize: 14 }}>
            Última atualização: 14 de outubro de 2026
          </p>
        </header>

        <Section>
          <p>
            Esta Política de Privacidade descreve as práticas da Sintonia (
            <em>&ldquo;Sintonia&rdquo;, &ldquo;nós&rdquo;</em>) em relação à
            coleta, uso e divulgação das suas informações quando você usa o
            aplicativo Sintonia para iOS e Android. Em uma frase: nós coletamos
            o mínimo possível. No modo Mesmo Celular nada sai do seu celular, e
            no modo online só trafega o necessário pra partida acontecer, sem
            ficar guardado depois que a sala fecha.
          </p>
          <p>
            Ao usar o Sintonia você concorda com a coleta e uso das informações
            descritas aqui.
          </p>
        </Section>

        <H2>Definições</H2>
        <Section>
          <ul style={listStyle}>
            <Li>
              <strong>Aplicativo</strong>: o software Sintonia distribuído pela
              Apple App Store e Google Play.
            </Li>
            <Li>
              <strong>Serviço</strong>: o aplicativo e qualquer página
              relacionada, incluindo este site (
              <a href="https://sintonia.party" style={linkStyle}>
                sintonia.party
              </a>
              ).
            </Li>
            <Li>
              <strong>Dados Pessoais</strong>: qualquer informação que se refira
              a uma pessoa identificada ou identificável.
            </Li>
            <Li>
              <strong>Dados de Uso</strong>: informações coletadas
              automaticamente pela operação do Serviço, como tipo de dispositivo
              e versão do sistema operacional.
            </Li>
            <Li>
              <strong>Você</strong>: a pessoa que utiliza o Serviço.
            </Li>
            <Li>
              <strong>País</strong>: Brasil. A operação do Sintonia está sujeita
              à Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).
            </Li>
          </ul>
        </Section>

        <H2>Que dados a Sintonia coleta</H2>
        <Section>
          <p>
            O Sintonia é projetado para ser jogado{" "}
            <strong>sem cadastro</strong>. Não pedimos e-mail, nome real,
            telefone ou qualquer credencial. Em termos práticos:
          </p>
          <ul style={listStyle}>
            <Li>
              <strong>Modo Mesmo Celular</strong>: os nomes de jogadores que
              você digita durante a configuração da partida ficam armazenados{" "}
              <em>apenas no próprio celular</em> (AsyncStorage local) e nunca
              são enviados pra servidores nossos.
            </Li>
            <Li>
              <strong>Modo online</strong>: pra conectar os jogadores de uma
              sala, o aplicativo envia ao nosso servidor o nome e a cor que você
              escolhe pra aparecer na partida, um identificador anônimo gerado
              aleatoriamente no seu celular (serve só pra você voltar à sala se
              a conexão cair, e não está ligado a nenhum dado seu), o código da
              sala, os seus palpites e, quando a dica é por texto, a dica que
              você digita. Se você cria a sala, os espectros da partida (incluindo
              os customizados que você ativou) também são enviados, pra que
              todos joguem com os mesmos cartões. Você pode usar um apelido; não
              precisa ser o seu nome real.
            </Li>
            <Li>
              <strong>Espectros customizados</strong>: o texto dos cartões que
              você cria fica armazenado <em>apenas no próprio celular</em>, e só
              sai dele quando você cria uma sala online (veja acima).
            </Li>
            <Li>
              <strong>Preferências</strong>: idioma, vibração e configurações
              ficam armazenadas no celular.
            </Li>
            <Li>
              <strong>Dados de Uso anônimos</strong>: quando você abre o
              aplicativo, as plataformas (App Store / Play Store) podem coletar
              automaticamente métricas básicas de uso e estabilidade
              (instalações, crashes, tempo de sessão agregado). Esses dados são
              processados pela Apple e pelo Google conforme suas próprias
              políticas e nós só temos acesso a relatórios agregados, sem
              identificação individual.
            </Li>
          </ul>
        </Section>

        <H2>Para que usamos esses dados</H2>
        <Section>
          <p>Os dados agregados são usados estritamente para:</p>
          <ul style={listStyle}>
            <Li>Manter o Serviço funcionando e identificar problemas.</Li>
            <Li>
              No modo online, conectar os jogadores da sala e sincronizar a
              partida entre os celulares.
            </Li>
            <Li>
              Priorizar correções e melhorias com base em quais telas e
              recursos são mais usados.
            </Li>
            <Li>
              Cumprir obrigações legais quando exigido por autoridades
              competentes.
            </Li>
          </ul>
          <p>
            Não usamos seus dados para anúncios, perfilamento publicitário, nem
            compartilhamos com terceiros para fins comerciais.
          </p>
        </Section>

        <H2>Compartilhamento</H2>
        <Section>
          <p>
            Não vendemos, alugamos nem compartilhamos seus dados com terceiros.
            As únicas situações em que dados podem ser transferidos:
          </p>
          <ul style={listStyle}>
            <Li>
              <strong>Provedores de plataforma (Apple e Google)</strong>:
              recebem dados agregados de uso e estabilidade conforme suas
              próprias políticas, necessários para distribuição e operação do
              aplicativo nas suas lojas.
            </Li>
            <Li>
              <strong>Outros jogadores da sala</strong>: no modo online, quem
              está na mesma sala vê o seu nome, a sua cor, os seus palpites e as
              dicas que você dá. É assim que o jogo funciona.
            </Li>
            <Li>
              <strong>Cloudflare</strong>: o servidor do modo online roda na
              infraestrutura da Cloudflare, que processa as conexões em nosso
              nome e pode registrar dados técnicos de conexão (como endereço IP)
              por um período limitado, conforme a{" "}
              <a
                href="https://www.cloudflare.com/privacypolicy/"
                style={linkStyle}
              >
                política de privacidade dela
              </a>
              .
            </Li>
            <Li>
              <strong>Obrigação legal</strong>: se exigido por lei, ordem
              judicial ou autoridade competente.
            </Li>
            <Li>
              <strong>Transferência de negócio</strong>: em caso de fusão,
              aquisição ou venda do projeto, dados podem ser transferidos para
              a entidade sucessora, sujeitos a esta Política.
            </Li>
          </ul>
        </Section>

        <H2>Retenção dos dados</H2>
        <Section>
          <p>
            O que fica no seu dispositivo (nomes do modo Mesmo Celular,
            espectros customizados, preferências e o identificador anônimo)
            é controlado por você: desinstalar o aplicativo remove tudo.
          </p>
          <p>
            Os dados de uma partida online ficam só na memória do servidor
            enquanto a sala existe. Não gravamos nomes, palpites nem dicas em
            banco de dados, e tudo é descartado quando a sala fecha. Os
            relatórios agregados que Apple e Google fornecem ficam disponíveis
            pelo período padrão dessas plataformas.
          </p>
        </Section>

        <H2>Conteúdo gerado pelo usuário</H2>
        <Section>
          <p>
            Você pode criar espectros customizados dentro do aplicativo. Esse
            conteúdo é armazenado <em>apenas no seu celular</em>. A exceção é o
            modo online: quando você cria uma sala, os espectros da partida
            passam pelo servidor e aparecem pros jogadores da sala, assim como
            as dicas digitadas. Nada disso é guardado depois que a sala fecha.
            Você é responsável por garantir que o conteúdo criado não viole
            direitos de terceiros ou leis aplicáveis.
          </p>
        </Section>

        <H2>Segurança</H2>
        <Section>
          <p>
            Como a maior parte dos dados nunca sai do seu celular, o risco de
            exposição é mínimo. No modo online, a conexão com o servidor é
            criptografada. Para os dados que trafegam para Apple e Google
            (relatórios de estabilidade), confiamos nos mecanismos de segurança
            dessas plataformas. Nenhum método de transmissão pela Internet é
            100% seguro.
          </p>
        </Section>

        <H2>Privacidade de crianças</H2>
        <Section>
          <p>
            O Sintonia não é direcionado a menores de 13 anos. Não coletamos
            conscientemente informações de menores de 13 anos. Se você é
            responsável legal de uma criança que tenha fornecido dados, entre em
            contato e nós removeremos as informações.
          </p>
        </Section>

        <H2>Links para outros sites</H2>
        <Section>
          <p>
            Esta página e o aplicativo podem conter links para sites de
            terceiros (lojas de aplicativos, redes sociais). Não temos controle
            sobre esses sites e recomendamos que você revise as políticas
            individuais antes de fornecer qualquer informação.
          </p>
        </Section>

        <H2>Alterações nesta política</H2>
        <Section>
          <p>
            Podemos atualizar esta Política de Privacidade periodicamente.
            Qualquer alteração será publicada nesta mesma página com a data de
            &ldquo;Última atualização&rdquo; ajustada. Recomendamos uma revisão
            ocasional.
          </p>
        </Section>

        <H2>Seus direitos (LGPD)</H2>
        <Section>
          <p>
            Sob a Lei Geral de Proteção de Dados, você tem direito a confirmar
            a existência de tratamento, acessar, corrigir, anonimizar ou pedir a
            eliminação de dados pessoais. Como o Sintonia não guarda dados
            pessoais em servidores próprios (os dados do modo online somem
            quando a sala fecha), a forma direta de exercer esses direitos é
            desinstalando o aplicativo. Para dúvidas adicionais, entre em
            contato pelo e-mail abaixo.
          </p>
        </Section>

        <H2>Contato</H2>
        <Section>
          <p>
            Em caso de qualquer dúvida sobre esta Política de Privacidade,
            entre em contato:
          </p>
          <p>
            E-mail:{" "}
            <a href="mailto:brunozampirom@outlook.com" style={linkStyle}>
              brunozampirom@outlook.com
            </a>
          </p>
        </Section>

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
  gap: 10,
  paddingLeft: 22,
  margin: "12px 0",
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
        fontSize: 22,
        letterSpacing: 0.3,
        color: "#fff",
        marginTop: 40,
        marginBottom: 12,
      }}
    >
      {children}
    </h2>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        marginBottom: 4,
      }}
    >
      {children}
    </section>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ listStyleType: "disc", color: "#E0E6F3" }}>{children}</li>
  );
}
