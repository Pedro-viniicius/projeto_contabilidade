"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AreaRolavel } from "@/components/ui/area-rolavel";
import { TOM_STATUS } from "./composicao-encargos";
import {
  listarPremissas,
  resumoValidacao,
  ROTULO_STATUS,
  VERSAO_REGRAS,
  type PremissaListada,
  type StatusPremissa,
} from "../domain/calculation-rules";

type Filtro = "todas" | StatusPremissa;

/**
 * Auditoria das regras de cálculo, dentro do painel lateral.
 *
 * Filtros, contagens e status saem de `listarPremissas()` — nada é
 * escrito à mão. Quando o contador revisar uma regra no domínio, este
 * painel reflete a mudança sozinho.
 */
export function PainelPremissas() {
  const premissas = listarPremissas();
  const { total, pendentes, porStatus } = resumoValidacao();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [expandida, setExpandida] = useState<string | null>(null);

  const contagens = useMemo(() => {
    const mapa = new Map<Filtro, number>([["todas", premissas.length]]);
    for (const p of premissas) {
      mapa.set(p.status, (mapa.get(p.status) ?? 0) + 1);
    }
    return mapa;
  }, [premissas]);

  /* Só oferecemos filtros que existem nos dados — nada de aba vazia. */
  const filtros: Filtro[] = [
    "todas",
    ...(Object.keys(ROTULO_STATUS) as StatusPremissa[]).filter(
      (s) => (contagens.get(s) ?? 0) > 0,
    ),
  ];

  const visiveis =
    filtro === "todas"
      ? premissas
      : premissas.filter((p) => p.status === filtro);

  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 rounded-md border border-border-base bg-surface sm:grid-cols-4">
        {[
          { rotulo: "No modelo", valor: total },
          { rotulo: "Temporárias", valor: porStatus["hipotese-temporaria"] },
          { rotulo: "A validar", valor: porStatus["a-validar"] },
          { rotulo: "Validadas", valor: porStatus["validada-tecnicamente"] },
        ].map((ind, i) => (
          <div
            key={ind.rotulo}
            className={[
              "px-3 py-2",
              i % 2 === 1 ? "border-l border-border-base" : "",
              i >= 2 ? "border-t border-border-base sm:border-t-0" : "",
              i === 2 ? "sm:border-l" : "",
            ].join(" ")}
          >
            <dt className="rotulo-secao">{ind.rotulo}</dt>
            <dd className="tnum mt-0.5 text-base font-semibold text-ink">
              {ind.valor}
            </dd>
          </div>
        ))}
      </dl>

      {pendentes > 0 && (
        <p className="rounded-md border-l-2 border-l-atencao bg-atencao-soft px-3 py-2.5 text-[0.8125rem] leading-relaxed text-ink">
          <strong className="font-semibold">
            {pendentes} de {total} premissas ainda não foram revisadas por um
            contador.
          </strong>{" "}
          Os valores são referências escolhidas para tornar o modelo
          compreensível e fácil de corrigir — não constituem apuração fiscal.
        </p>
      )}

      <div className="flex flex-wrap gap-1">
        {filtros.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filtro === f}
            onClick={() => setFiltro(f)}
            className={[
              "alvo-toque min-h-8 rounded-md px-2.5 text-[0.8125rem] transition-colors",
              filtro === f
                ? "bg-accent-soft font-medium text-accent-ink"
                : "text-ink-muted hover:bg-surface-muted hover:text-ink",
            ].join(" ")}
          >
            {f === "todas" ? "Todas" : ROTULO_STATUS[f]}
            <span className="ml-1.5 tabular-nums text-ink-subtle">
              {contagens.get(f) ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-md border border-border-base bg-surface">
        <AreaRolavel>
          <table className="tabela-dados min-w-[38rem] text-[0.8125rem]">
            <caption className="sr-only">
              Premissas de cálculo com cenário, valor, status de validação e
              onde cada uma é utilizada.
            </caption>
            <thead>
              <tr>
                <th scope="col">Premissa</th>
                <th scope="col">Cenário</th>
                <th scope="col" className="num">
                  Valor
                </th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((p) => (
                <LinhaPremissa
                  key={p.chave}
                  premissa={p}
                  aberta={expandida === p.chave}
                  onAlternar={() =>
                    setExpandida(expandida === p.chave ? null : p.chave)
                  }
                />
              ))}
            </tbody>
          </table>
        </AreaRolavel>

        {visiveis.length === 0 && (
          <p className="px-4 py-8 text-center text-[0.8125rem] text-ink-muted">
            Nenhuma premissa neste status.
          </p>
        )}
      </div>

      <p className="text-[0.75rem] text-ink-subtle">
        Versão das regras: {VERSAO_REGRAS}
      </p>
    </div>
  );
}

function LinhaPremissa({
  premissa,
  aberta,
  onAlternar,
}: {
  premissa: PremissaListada;
  aberta: boolean;
  onAlternar: () => void;
}) {
  const idDetalhe = `detalhe-${premissa.chave.replace(/\W+/g, "-")}`;

  return (
    <>
      <tr className="hover:bg-surface-hover">
        <th scope="row" className="font-normal">
          <button
            type="button"
            onClick={onAlternar}
            aria-expanded={aberta}
            aria-controls={idDetalhe}
            className="alvo-toque flex items-start gap-1.5 rounded-sm text-left text-ink"
          >
            <span
              aria-hidden="true"
              className={`mt-px shrink-0 text-ink-subtle transition-transform ${
                aberta ? "rotate-90" : ""
              }`}
            >
              ›
            </span>
            {premissa.chave}
          </button>
        </th>
        <td className="text-ink-muted">{premissa.grupo}</td>
        <td className="num font-medium text-ink">{premissa.valorFormatado}</td>
        <td>
          <Badge tom={TOM_STATUS[premissa.status]}>
            {ROTULO_STATUS[premissa.status]}
          </Badge>
        </td>
      </tr>

      {aberta && (
        <tr id={idDetalhe} className="bg-surface-muted">
          <td colSpan={4} className="px-4 py-3">
            <dl className="max-w-3xl space-y-2">
              <div>
                <dt className="rotulo-secao">O que representa</dt>
                <dd className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink">
                  {premissa.descricao}
                </dd>
              </div>
              <div>
                <dt className="rotulo-secao">
                  Por que existe e o que simplifica
                </dt>
                <dd className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-muted">
                  {premissa.porQueExiste}
                </dd>
              </div>
              <div>
                <dt className="rotulo-secao">Onde é utilizada</dt>
                <dd className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-muted">
                  {premissa.ondeUsada}
                </dd>
              </div>
            </dl>
          </td>
        </tr>
      )}
    </>
  );
}
