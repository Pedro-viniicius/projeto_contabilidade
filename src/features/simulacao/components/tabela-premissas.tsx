import {
  ROTULO_STATUS,
  type PremissaListada,
  type StatusPremissa,
} from "../domain/calculation-rules";

const CORES_STATUS: Record<StatusPremissa, string> = {
  "hipotese-temporaria": "bg-warning-soft text-warning-ink",
  "a-validar": "bg-surface-muted text-ink-muted",
  "validada-tecnicamente": "bg-accent-soft text-accent-ink",
  "nao-aplicavel": "bg-surface-muted text-ink-subtle",
};

/**
 * Lista auditável de premissas.
 * Em telas pequenas vira uma lista de cartões; em telas maiores, tabela.
 * Evita rolagem horizontal no celular sem perder a leitura tabular.
 */
export function TabelaPremissas({
  premissas,
}: {
  premissas: readonly PremissaListada[];
}) {
  return (
    <ul className="divide-y divide-[var(--border)]">
      {premissas.map((p) => (
        <li key={p.chave} className="py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h4 className="font-medium text-ink">{p.chave}</h4>
            <p className="tnum text-sm font-semibold text-ink">
              {p.valorFormatado}
            </p>
          </div>

          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            {p.descricao}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-subtle">
            {p.porQueExiste}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-medium ${CORES_STATUS[p.status]}`}
            >
              {ROTULO_STATUS[p.status]}
            </span>
            <span className="text-xs text-ink-subtle">{p.ondeUsada}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
