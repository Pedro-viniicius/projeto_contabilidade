import { VERSAO_REGRAS } from "../domain/calculation-rules";

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

/**
 * Limites declarados do modelo.
 *
 * Antes era a página `/como-funciona`. Virou painel: o contador
 * consulta o escopo no meio de uma análise, não antes dela.
 */
export function PainelEscopo() {
  return (
    <div className="space-y-5">
      <section>
        <h3 className="rotulo-secao">O que o modelo calcula</h3>
        <ul className="mt-2 space-y-2">
          {COBERTO.map((item) => (
            <Item key={item}>{item}</Item>
          ))}
        </ul>
      </section>

      <section className="border-t border-border-base pt-4">
        <h3 className="rotulo-secao">O que está fora desta versão</h3>
        <p className="mt-1 text-[0.75rem] leading-snug text-ink-subtle">
          Declarado por escolha: preferimos limite explícito a precisão
          aparente.
        </p>
        <ul className="mt-2 space-y-2">
          {FORA.map((item) => (
            <Item key={item} negativo>
              {item}
            </Item>
          ))}
        </ul>
      </section>

      <section className="border-t border-border-base pt-4">
        <h3 className="rotulo-secao">Simplificação mais relevante</h3>
        <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-muted">
          O cenário CNPJ usa uma{" "}
          <strong className="font-medium text-ink">
            alíquota efetiva única sobre o faturamento
          </strong>{" "}
          no lugar das tabelas do Simples Nacional. Não há cálculo de RBT12,
          Fator R nem partilha entre tributos. A decisão foi deliberada:
          preferimos um parâmetro visível e fácil de corrigir a uma precisão
          que o contador não teria como auditar. É o primeiro item que precisa
          de revisão profissional.
        </p>
      </section>

      <section className="border-t border-border-base pt-4">
        <h3 className="rotulo-secao">Onde os dados ficam</h3>
        <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-muted">
          Não há servidor nesta versão. O acesso é demonstrativo e as análises,
          referências e observações ficam no armazenamento local do navegador
          deste aparelho. Limpar os dados do site apaga tudo, e nada é
          compartilhado entre dispositivos.
        </p>
      </section>

      <p className="border-t border-border-base pt-4 text-[0.75rem] text-ink-subtle">
        Versão das regras: {VERSAO_REGRAS}
      </p>
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
    <li className="flex gap-2 text-[0.8125rem] leading-relaxed text-ink-muted">
      <span
        aria-hidden="true"
        className={`mt-[0.4rem] size-1.5 shrink-0 rounded-full ${
          negativo ? "bg-border-strong" : "bg-accent"
        }`}
      />
      <span>{children}</span>
    </li>
  );
}
