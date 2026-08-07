import type { Metadata } from "next";
import { Card, CardTitulo } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { AvisoContabil } from "@/components/ui/aviso-contabil";
import { BotaoInstalar } from "@/components/pwa/botao-instalar";

export const metadata: Metadata = {
  title: "Como funciona",
  description:
    "Entenda o que o simulador do Clareza calcula, o que ele não calcula e como interpretar o resultado.",
  alternates: { canonical: "/como-funciona" },
};

export default function ComoFuncionaPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Como funciona
        </h1>
        <p className="mt-3 leading-relaxed text-ink-muted">
          O Clareza pega três números simples — quanto entra, quanto sai e como
          você atua — e mostra quanto sobra depois dos encargos estimados, nos
          dois cenários possíveis.
        </p>
      </header>

      <Card>
        <CardTitulo>O que a simulação calcula</CardTitulo>
        <ul className="mt-3 space-y-2.5 text-ink-muted">
          <Item>
            <strong className="font-medium text-ink">Pessoa Física:</strong>{" "}
            receita menos custos forma a base do livro-caixa. Sobre ela incidem
            INSS de contribuinte individual e IRPF pela tabela progressiva
            mensal.
          </Item>
          <Item>
            <strong className="font-medium text-ink">CNPJ:</strong> uma alíquota
            efetiva única sobre o faturamento, mais honorários contábeis, mais
            INSS e IRRF sobre o pró-labore. O lucro distribuído é tratado como
            isento.
          </Item>
          <Item>
            <strong className="font-medium text-ink">Comparativo:</strong> os
            dois cenários rodam com a mesma receita e os mesmos custos, e a
            diferença aparece em reais por mês e por ano.
          </Item>
        </ul>
      </Card>

      <Card>
        <CardTitulo>O que ela ainda não calcula</CardTitulo>
        <p className="mt-3 leading-relaxed text-ink-muted">
          Ser explícito sobre os limites é parte do produto. Esta versão não
          considera:
        </p>
        <ul className="mt-3 space-y-2.5 text-ink-muted">
          <Item>tabelas do Simples Nacional, RBT12 e Fator R;</Item>
          <Item>ISS variável por município e retenções na fonte;</Item>
          <Item>MEI, Lucro Presumido e Lucro Real;</Item>
          <Item>
            dependentes, despesas médicas, educação e ajuste anual do IRPF;
          </Item>
          <Item>13º, férias, sazonalidade e meses sem faturamento;</Item>
          <Item>despesas pessoais, que saem do resultado líquido.</Item>
        </ul>
        <ButtonLink href="/premissas" variante="secundaria" className="mt-5">
          Ver todas as premissas
        </ButtonLink>
      </Card>

      <Card>
        <CardTitulo>Seus dados ficam no seu aparelho</CardTitulo>
        <p className="mt-3 leading-relaxed text-ink-muted">
          Não existe cadastro nem login. A simulação e o feedback ficam salvos
          apenas no armazenamento local do navegador — nada é enviado para um
          servidor nesta versão. Limpar os dados do site apaga tudo.
        </p>
      </Card>

      <Card>
        <CardTitulo>Funciona como aplicativo</CardTitulo>
        <p className="mt-3 leading-relaxed text-ink-muted">
          O Clareza é um PWA: dá para instalar na tela inicial do celular e usar
          as telas já visitadas mesmo sem internet. No Android e no desktop, o
          navegador oferece a instalação; no iPhone, use{" "}
          <em>Compartilhar → Adicionar à Tela de Início</em>.
        </p>
        <div className="mt-5">
          <BotaoInstalar />
        </div>
      </Card>

      <div className="pt-2">
        <ButtonLink href="/simulacao" tamanho="lg">
          Fazer uma simulação
        </ButtonLink>
      </div>

      <AvisoContabil className="px-1 pt-2" />
    </div>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 leading-relaxed">
      <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
      <span>{children}</span>
    </li>
  );
}
