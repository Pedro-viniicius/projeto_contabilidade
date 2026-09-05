import type { ReactNode } from "react";

/**
 * ESCALA DO NÚMERO FINANCEIRO.
 *
 * O produto exibe dezenas de valores por tela e todos precisam
 * responder a mesma pergunta antes de serem desenhados: *qual o papel
 * deste número na decisão?* A escala tem quatro degraus e nenhum
 * componente inventa um quinto.
 *
 *   primario    a diferença que decide a análise. Um por tela.
 *   cenario     o líquido de PF e de CNPJ na comparação assinatura.
 *   secundario  impacto anual, totais de fechamento.
 *   apoio       valor lido dentro de lista, detalhe ou auditoria.
 *
 * Todos herdam numerais tabulares das classes em `globals.css` — é o
 * que faz colunas de reais alinharem na vertical.
 */
export type EscalaValor = "primario" | "cenario" | "secundario" | "apoio";

const ESCALAS: Record<EscalaValor, string> = {
  primario: "num-primario",
  cenario: "num-cenario",
  secundario: "num-secundario",
  apoio: "num-apoio",
};

/**
 * Valor monetário ou percentual em posição de destaque.
 *
 * `rotulo` vem ACIMA e em caixa alta discreta: o contador lê o que o
 * número mede antes de ler o número. `apoio` fica abaixo e carrega a
 * qualificação — período, base, ressalva.
 */
export function ValorFinanceiro({
  rotulo,
  valor,
  apoio,
  escala = "secundario",
  className,
}: {
  rotulo?: ReactNode;
  valor: ReactNode;
  apoio?: ReactNode;
  escala?: EscalaValor;
  className?: string;
}) {
  return (
    <div className={className}>
      {rotulo && <p className="rotulo-secao">{rotulo}</p>}
      <p className={`${ESCALAS[escala]} ${rotulo ? "mt-1" : ""}`}>{valor}</p>
      {apoio && (
        <p className="tnum mt-1 text-[0.75rem] leading-snug text-ink-muted">
          {apoio}
        </p>
      )}
    </div>
  );
}

/**
 * DADO DERIVADO — o que o Clareza concluiu, e não o que o contador
 * digitou.
 *
 * Forma deliberadamente diferente de um campo: par termo/valor sobre
 * superfície fosca, sem contorno de controle e sem altura de input.
 * A distinção precisa ser reconhecida sem leitura — um valor
 * calculado que se pareça com um campo editável convida a tentar
 * editá-lo, e a tentativa frustrada é o que corrói a confiança na
 * ferramenta.
 */
export function DadoDerivado({
  termo,
  valor,
  className,
}: {
  termo: ReactNode;
  valor: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={["flex items-baseline justify-between gap-3", className]
        .filter(Boolean)
        .join(" ")}
    >
      <dt className="shrink-0 text-[0.75rem] text-ink-muted">{termo}</dt>
      <dd className="tnum min-w-0 text-right text-[0.75rem] font-medium text-ink">
        {valor}
      </dd>
    </div>
  );
}
