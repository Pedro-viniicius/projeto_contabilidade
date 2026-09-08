import { formatarMoeda, formatarPercentual } from "@/lib/format";
import { NOME_CURTO } from "../domain/diferenca-semantica";
import type { Comparacao, TipoAtuacao } from "../types";

/**
 * COMPARAÇÃO ASSINATURA — o desenho que o Clareza usa toda vez que
 * duas alternativas financeiras aparecem lado a lado.
 *
 *     PESSOA FÍSICA                          CNPJ
 *     R$ 17.792,05                           R$ 15.790,08
 *     57,6% de margem                        66,2% de margem
 *                 ── R$ 2.001,97 a mais ──
 *                     para Pessoa Física
 *
 * Três decisões sustentam o desenho:
 *
 * 1. OS DOIS LADOS TÊM O MESMO PESO. Nenhum cenário é pintado de verde
 *    ou de vermelho por natureza — qual deles é o melhor muda a cada
 *    análise, e um esquema fixo de cor anteciparia um veredito que o
 *    cálculo ainda não deu.
 *
 * 2. A DIFERENÇA MORA ENTRE ELES, não à direita de um deles. É a
 *    posição que diz que ela pertence ao par, e é ela que o contador
 *    repete ao cliente.
 *
 * 3. A DIREÇÃO É TEXTO. "a mais para Pessoa Física" não depende de
 *    cor, de sinal nem de seta para ser lida — a cor só reforça.
 *
 * O bloco não calcula nada: recebe a comparação pronta do motor.
 */
export function ComparacaoCenarios({
  comparacao,
}: {
  comparacao: Comparacao;
}) {
  const { pessoaFisica: pf, cnpj, vencedor } = comparacao;

  return (
    <div className="px-4 py-3.5">
      <p className="rotulo-secao">Resultado líquido mensal</p>

      {/*
        `items-stretch` + divisor central: as duas colunas formam um
        par visual, não dois blocos que por acaso estão perto. Abaixo
        de 30rem empilham com um separador horizontal — a relação se
        mantém, muda só o eixo.
      */}
      <div className="mt-2 grid grid-cols-1 overflow-hidden rounded-md border border-border-base @[30rem]:grid-cols-2">
        <Lado
          cenario="pessoa-fisica"
          liquido={pf.liquidoMensal}
          margem={pf.margemLiquida}
          anual={pf.liquidoAnual}
          vencedor={vencedor === "pessoa-fisica"}
        />
        <Lado
          cenario="cnpj"
          liquido={cnpj.liquidoMensal}
          margem={cnpj.margemLiquida}
          anual={cnpj.liquidoAnual}
          vencedor={vencedor === "cnpj"}
          className="border-t border-border-base @[30rem]:border-l @[30rem]:border-t-0"
        />
      </div>
    </div>
  );
}

/**
 * Uma metade do par.
 *
 * O cenário de maior líquido ganha uma faixa de acento no topo e uma
 * palavra ("maior resultado"). Faixa + palavra, nunca só a faixa: em
 * monocromático ou para quem não distingue as cores, a leitura
 * continua inteira.
 */
function Lado({
  cenario,
  liquido,
  margem,
  anual,
  vencedor,
  className,
}: {
  cenario: TipoAtuacao;
  liquido: number;
  margem: number;
  anual: number;
  vencedor: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        "relative min-w-0 px-3.5 py-3",
        vencedor ? "bg-accent-soft/50" : "bg-surface",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {vencedor && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-0.5 bg-accent"
        />
      )}

      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-[0.75rem] font-semibold uppercase tracking-[0.05em] text-ink-muted">
          {NOME_CURTO[cenario]}
        </p>
        {vencedor && (
          <span className="shrink-0 text-[0.6875rem] font-semibold text-accent-ink">
            maior resultado
          </span>
        )}
      </div>

      <p className="num-cenario mt-1.5">{formatarMoeda(liquido)}</p>

      <p className="tnum mt-1 text-[0.75rem] leading-snug text-ink-muted">
        {formatarPercentual(margem)} de margem · {formatarMoeda(anual)}/ano
      </p>
    </div>
  );
}

/**
 * A DIFERENÇA, entre os dois lados — com o ANO em primeiro lugar.
 *
 * Até a v2.7 o número maior da tela era a diferença MENSAL. Perguntado
 * na validação de setembro/2026 qual resultado é mais útil para
 * apresentar ao cliente, o contador respondeu "quanto economiza por
 * ano". Faz sentido operacional: a decisão de abrir CNPJ é anual, e o
 * número mensal é pequeno demais para justificar o custo e o trabalho
 * de manter a empresa.
 *
 * O mensal não sumiu — desceu um degrau na escala. Ele continua sendo
 * o que o cliente sente no caixa do mês.
 *
 * Exportada em separado porque quem a posiciona é o painel de
 * resultado: ela fica no topo, junto da conclusão em uma frase, e não
 * no meio da tabela.
 */
export function DiferencaEntreCenarios({
  vencedor,
  mensal,
  anual,
}: {
  vencedor: TipoAtuacao | null;
  mensal: number;
  anual: number;
}) {
  if (vencedor === null) {
    return (
      <p className="text-[0.8125rem] text-ink-muted">
        Sem diferença de resultado líquido entre os cenários.
      </p>
    );
  }

  return (
    <dl className="flex flex-wrap items-end gap-x-8 gap-y-2">
      <div>
        <dt className="rotulo-secao">Economia estimada no ano</dt>
        <dd className="num-primario mt-1">{formatarMoeda(anual)}</dd>
        <dd className="mt-0.5 text-[0.75rem] leading-snug text-ink-muted">
          a mais para {NOME_CURTO[vencedor]}, em 12 meses
        </dd>
      </div>

      <div>
        <dt className="rotulo-secao">Por mês</dt>
        <dd className="num-secundario mt-1">{formatarMoeda(mensal)}</dd>
        <dd className="mt-0.5 text-[0.75rem] leading-snug text-ink-muted">
          diferença no resultado líquido
        </dd>
      </div>
    </dl>
  );
}
