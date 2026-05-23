import type { Metadata } from "next";
import { T } from "@/lib/tokens";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Termos de uso do aplicativo Sintonia — gratuito, sem cadastro, sem propaganda, fornecido como está.",
};

export default function TermsPage() {
  return (
    <main style={{ padding: "80px 0 120px", position: "relative", zIndex: 2 }}>
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
            Termos de Uso
          </h1>
          <p style={{ color: T.textMuted, fontSize: 14 }}>
            Última atualização: 20 de maio de 2026
          </p>
        </header>

        <Section>
          <p>
            Estes Termos de Uso regem o seu acesso e uso do aplicativo Sintonia
            e dos serviços relacionados, incluindo este site (
            <a href="https://sintonia.party" style={linkStyle}>
              sintonia.party
            </a>
            ). Ao baixar, instalar ou usar o Sintonia você concorda com estes
            Termos. Se você não concorda, não use o Serviço.
          </p>
        </Section>

        <H2>O que é o Sintonia</H2>
        <Section>
          <p>
            Sintonia é um jogo de festa para 2 a 8 pessoas em um único celular.
            O Serviço é oferecido <strong>gratuitamente</strong>, sem
            necessidade de cadastro, conta, assinatura ou pagamento de qualquer
            tipo. O aplicativo não exibe anúncios e não realiza compras dentro
            do app.
          </p>
        </Section>

        <H2>Quem pode usar</H2>
        <Section>
          <p>
            O Sintonia é destinado a maiores de 13 anos. Ao usar o Serviço, você
            declara que tem idade suficiente conforme as leis da sua
            jurisdição. Algumas cartas de espectros podem conter linguagem ou
            referências adultas; recomendamos que crianças usem o aplicativo
            apenas com supervisão.
          </p>
        </Section>

        <H2>Licença de uso</H2>
        <Section>
          <p>
            Concedemos a você uma licença limitada, não exclusiva, intransferível
            e revogável para instalar e usar o Sintonia em dispositivos que você
            possui ou controla, para fins pessoais e não comerciais.
          </p>
          <p>Você concorda em <strong>não</strong>:</p>
          <ul style={listStyle}>
            <Li>
              Copiar, modificar, distribuir, vender ou alugar qualquer parte do
              Serviço.
            </Li>
            <Li>
              Fazer engenharia reversa ou tentar extrair o código-fonte, exceto
              quando expressamente permitido por lei.
            </Li>
            <Li>
              Usar bots, scripts ou meios automatizados para interagir com o
              Serviço.
            </Li>
            <Li>
              Usar o Serviço de maneira que viole leis aplicáveis ou direitos de
              terceiros.
            </Li>
          </ul>
        </Section>

        <H2>Conteúdo gerado por você</H2>
        <Section>
          <p>
            O Sintonia permite que você crie espectros customizados (cartões
            com dois polos textuais). Esse conteúdo fica armazenado apenas no
            seu dispositivo e nós não temos acesso a ele.
          </p>
          <p>
            Você é o único responsável pelo conteúdo que cria. Ao criar
            espectros customizados, você se compromete a não produzir conteúdo
            que:
          </p>
          <ul style={listStyle}>
            <Li>Viole direitos de terceiros (propriedade intelectual, honra, imagem).</Li>
            <Li>Promova ódio, violência, assédio ou discriminação.</Li>
            <Li>Seja ilegal sob a legislação brasileira ou da sua jurisdição.</Li>
            <Li>Envolva exploração de menores.</Li>
          </ul>
        </Section>

        <H2>Propriedade intelectual</H2>
        <Section>
          <p>
            Todo o conteúdo do Sintonia que não foi criado por você, incluindo
            o código, design, gráficos, ícones, marca, espectros padrão e
            textos, é de propriedade de Bruno Zampirom e está protegido pelas
            leis aplicáveis de propriedade intelectual.
          </p>
          <p>
            A marca <strong>Sintonia</strong> e os elementos visuais
            relacionados não podem ser usados sem autorização escrita.
          </p>
        </Section>

        <H2>Atualizações e disponibilidade</H2>
        <Section>
          <p>
            Podemos atualizar, modificar ou descontinuar funcionalidades do
            Serviço a qualquer momento, sem aviso prévio. Atualizações são
            distribuídas pela App Store e Google Play.
          </p>
          <p>
            Não garantimos que o Serviço estará sempre disponível, livre de
            erros ou ininterrupto. Faremos esforço razoável para manter o
            aplicativo funcionando, mas o Serviço é oferecido &ldquo;como
            está&rdquo;.
          </p>
        </Section>

        <H2>Isenção de garantias</H2>
        <Section>
          <p>
            Na máxima extensão permitida em lei, o Sintonia é fornecido
            &ldquo;como está&rdquo; e &ldquo;conforme disponível&rdquo;, sem
            garantias de qualquer tipo, expressas ou implícitas, incluindo, mas
            não se limitando a, garantias de comercialização, adequação a um
            propósito específico, não infração e qualidade satisfatória.
          </p>
          <p>
            Não garantimos que o Serviço atenderá a expectativas específicas,
            que os resultados serão precisos ou confiáveis, ou que os erros
            serão corrigidos.
          </p>
        </Section>

        <H2>Limitação de responsabilidade</H2>
        <Section>
          <p>
            Na máxima extensão permitida em lei, em hipótese alguma a Sintonia,
            seus desenvolvedores ou colaboradores serão responsáveis por:
          </p>
          <ul style={listStyle}>
            <Li>
              Danos indiretos, incidentais, especiais, consequenciais, punitivos
              ou exemplares.
            </Li>
            <Li>
              Perda de lucros, receitas, dados, uso ou outros prejuízos
              intangíveis.
            </Li>
            <Li>
              Conduta de qualquer terceiro relacionado ao Serviço.
            </Li>
            <Li>
              Qualquer questão relativa a conteúdo criado por você ou por outros
              usuários.
            </Li>
          </ul>
        </Section>

        <H2>Privacidade</H2>
        <Section>
          <p>
            O uso do Sintonia é regido também pela nossa{" "}
            <a href="/privacy" style={linkStyle}>
              Política de Privacidade
            </a>
            , que descreve como tratamos seus dados (em uma frase: nada sai do
            seu celular).
          </p>
        </Section>

        <H2>Encerramento</H2>
        <Section>
          <p>
            Você pode encerrar a relação com o Serviço a qualquer momento
            desinstalando o aplicativo. Podemos suspender ou descontinuar o
            Serviço, no todo ou em parte, a qualquer momento.
          </p>
        </Section>

        <H2>Lei aplicável e foro</H2>
        <Section>
          <p>
            Estes Termos são regidos pelas leis da República Federativa do
            Brasil. Eventuais controvérsias serão resolvidas no foro da Comarca
            de São Paulo/SP, salvo competência diversa imposta por lei.
          </p>
        </Section>

        <H2>Alterações destes Termos</H2>
        <Section>
          <p>
            Podemos atualizar estes Termos periodicamente. A data de
            &ldquo;Última atualização&rdquo; no topo será ajustada. Recomendamos
            uma revisão ocasional. O uso continuado do Serviço após mudanças
            constitui aceitação dos novos Termos.
          </p>
        </Section>

        <H2>Contato</H2>
        <Section>
          <p>
            Dúvidas sobre estes Termos podem ser enviadas para:
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
