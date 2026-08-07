import { formatarMoeda, formatarPercentual } from "@/lib/format";
import type { ResultadoCenario } from "../types";

interface Fatia {
  rotulo: string;
  valor: number;
  cor: string;
}

/**
 * Composição da receita em uma única barra empilhada.
 * Escolhida no lugar de um gráfico de biblioteca porque responde à
 * pergunta real do usuário ("para onde vai o meu faturamento?") com
 * zero JavaScript extra. Legenda textual acompanha a barra — a
 * informação nunca depende só da cor.
 */
export function BarraComposicao({ cenario }: { cenario: ResultadoCenario }) {
  const total = cenario.receitaMensal;
  if (total <= 0) return null;

  const liquidoPositivo = Math.max(0, cenario.liquidoMensal);
  const fatias: Fatia[] = [
    {
      rotulo: "Custos do negócio",
      valor: cenario.custosMensais,
      cor: "var(--border-strong)",
    },
    {
      rotulo: "Encargos e tributos",
      valor: cenario.encargosMensais,
      cor: "var(--ink-subtle)",
    },
    {
      rotulo: "Resultado líquido",
      valor: liquidoPositivo,
      cor: "var(--accent)",
    },
  ].filter((f) => f.valor > 0);

  const soma = fatias.reduce((acc, f) => acc + f.valor, 0) || 1;

  return (
    <div>
      <h3 className="text-sm font-medium text-ink">
        Para onde vai o seu faturamento
      </h3>

      <div
        className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-surface-muted"
        role="img"
        aria-label={fatias
          .map(
            (f) =>
              `${f.rotulo}: ${formatarPercentual(f.valor / soma, 0)} do faturamento`,
          )
          .join(". ")}
      >
        {fatias.map((f) => (
          <div
            key={f.rotulo}
            style={{ width: `${(f.valor / soma) * 100}%`, background: f.cor }}
          />
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {fatias.map((f) => (
          <li
            key={f.rotulo}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex items-center gap-2 text-ink-muted">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: f.cor }}
              />
              {f.rotulo}
            </span>
            <span className="tnum shrink-0 text-ink">
              {formatarPercentual(f.valor / soma, 0)} ·{" "}
              {formatarMoeda(f.valor)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
