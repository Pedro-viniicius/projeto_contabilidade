import type { Metadata } from "next";
import { Painel, PainelCabecalho, PainelCorpo } from "@/components/ui/painel";
import { ButtonLink } from "@/components/ui/button";
import { VERSAO_REGRAS } from "@/features/simulacao/domain/calculation-rules";

export const metadata: Metadata = {
  title: "Escopo do modelo",
  description:
    "O que o modelo de cálculo do Clareza cobre, quais simplificações assume e o que está explicitamente fora desta versão.",
  alternates: { canonical: "/como-funciona" },
};

const COBERTO = [
  "Cenário PF: base do livro-caixa, INSS de contribuinte individual com piso e teto, e IRPF pela tabela progressiva mensal.",
  "Cenário CNPJ: alíquota efetiva única sobre o faturamento, honorários contábeis, INSS e IRRF sobre o pró-labore.",
  "Lucro distribuído tratado como isento no cenário CNPJ.",
  "Comparação entre os dois cenários com a mesma receita e os mesmos custos.",
  "Projeção anual por multiplicação direta do resultado mensal.",
];

const FORA = [
  "Tabelas do Simples Nacional, RBT12, Fator R e escolha de anexo.",
  "ISS municipal e retenções na fonte pelo tomador.",
  "MEI, Lucro Presumido e Lucro Real.",
  "Dependentes, despesas médicas, educação, desconto simplificado e ajuste anual do IRPF.",
  "Plano simplificado de INSS (11%) e recolhimento em atraso.",
  "13º, férias, sazonalidade e meses sem faturamento.",
  "Regras distintas de dedutibilidade entre livro-caixa e despesa da PJ.",
  "Despesas pessoais do cliente, que saem do resultado líquido.",
];

export default function EscopoPage() {
  return (
    <div className="mx-auto max-w-[1100px] space-y-4 px-4 py-5 sm:px-6">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-ink">
          Escopo do modelo
        </h1>
        <p className="mt-0.5 text-[0.8125rem] text-ink-muted">
          Limites explícitos do cálculo · versão {VERSAO_REGRAS}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Painel>
          <PainelCabecalho titulo="O que o modelo calcula" />
          <PainelCorpo>
            <ul className="space-y-2">
              {COBERTO.map((item) => (
                <Item key={item}>{item}</Item>
              ))}
            </ul>
          </PainelCorpo>
        </Painel>

        <Painel>
          <PainelCabecalho
            titulo="O que está fora desta versão"
            descricao="Declarado por escolha: preferimos limite explícito a precisão aparente."
          />
          <PainelCorpo>
            <ul className="space-y-2">
              {FORA.map((item) => (
                <Item key={item} negativo>
                  {item}
                </Item>
              ))}
            </ul>
          </PainelCorpo>
        </Painel>
      </div>

      <Painel>
        <PainelCabecalho titulo="Simplificação mais relevante" />
        <PainelCorpo>
          <p className="max-w-3xl text-[0.875rem] leading-relaxed text-ink-muted">
            O cenário CNPJ usa uma{" "}
            <strong className="font-medium text-ink">
              alíquota efetiva única sobre o faturamento
            </strong>{" "}
            no lugar das tabelas do Simples Nacional. Não há cálculo de RBT12,
            Fator R nem partilha entre tributos. A decisão foi deliberada:
            preferimos um parâmetro visível e fácil de corrigir a uma precisão
            que o usuário não teria como auditar. É o primeiro item que precisa
            de revisão profissional.
          </p>
          <ButtonLink href="/premissas" variante="secundaria" className="mt-3.5">
            Abrir painel de premissas
          </ButtonLink>
        </PainelCorpo>
      </Painel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Painel>
          <PainelCabecalho titulo="Onde os dados ficam" />
          <PainelCorpo>
            <p className="text-[0.875rem] leading-relaxed text-ink-muted">
              Não há cadastro, login nem servidor. Simulações, referências e
              feedback ficam no armazenamento local do navegador deste
              aparelho. Limpar os dados do site apaga tudo, e nada é
              compartilhado entre dispositivos.
            </p>
          </PainelCorpo>
        </Painel>

        <Painel>
          <PainelCabecalho titulo="Uso como aplicativo" />
          <PainelCorpo>
            <p className="text-[0.875rem] leading-relaxed text-ink-muted">
              O Clareza é um PWA: pode ser instalado no computador ou no celular
              e as telas já visitadas continuam disponíveis sem conexão. No
              Chrome e no Edge a instalação aparece na barra de endereços; no
              iOS, use <em>Compartilhar → Adicionar à Tela de Início</em>.
            </p>
          </PainelCorpo>
        </Painel>
      </div>
    </div>
  );
}

function Item({
  children,
  negativo,
}: {
  children: React.ReactNode;
  negativo?: boolean;
}) {
  return (
    <li className="flex gap-2 text-[0.875rem] leading-relaxed text-ink-muted">
      <span
        aria-hidden="true"
        className={`mt-[0.45rem] size-1.5 shrink-0 rounded-full ${
          negativo ? "bg-border-strong" : "bg-accent"
        }`}
      />
      <span>{children}</span>
    </li>
  );
}
