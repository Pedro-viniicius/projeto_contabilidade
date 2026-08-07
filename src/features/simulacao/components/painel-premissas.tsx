"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Painel, PainelCabecalho } from "@/components/ui/painel";
import { AreaRolavel } from "@/components/ui/area-rolavel";
import {
  listarPremissas,
  ROTULO_STATUS,
  type PremissaListada,
  type StatusPremissa,
} from "../domain/calculation-rules";

const TOM_STATUS: Record<StatusPremissa, "atencao" | "neutro" | "positivo"> = {
  "hipotese-temporaria": "atencao",
  "a-validar": "neutro",
  "validada-tecnicamente": "positivo",
  "nao-aplicavel": "neutro",
};

type Filtro = "todas" | StatusPremissa;

/**
 * Painel de auditoria das regras de cálculo.
 *
 * Os filtros e as contagens saem de `listarPremissas()` — nenhum status
 * ou número é escrito à mão aqui. Quando o contador revisar uma regra no
 * domínio, esta tela reflete a mudança sozinha.
 */
export function PainelPremissas() {
  const premissas = listarPremissas();
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
    <Painel>
      <PainelCabecalho
        titulo="Regras de cálculo"
        descricao="Cada linha é um parâmetro usado pelo motor. Abra para ver a justificativa e o que a premissa deixa de fora."
      />

      <div className="flex flex-wrap gap-1 border-b border-border-base px-3 py-2">
        {filtros.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filtro === f}
            onClick={() => setFiltro(f)}
            className={[
              "min-h-8 rounded-md px-2.5 text-[0.8125rem] transition-colors",
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

      <AreaRolavel>
        <table className="tabela-dados min-w-[44rem] text-[0.8125rem]">
          <caption className="sr-only">
            Premissas de cálculo com cenário, valor, status de validação e onde
            cada uma é utilizada.
          </caption>
          <thead>
            <tr>
              <th scope="col">Premissa</th>
              <th scope="col">Cenário</th>
              <th scope="col" className="num">
                Valor
              </th>
              <th scope="col">Status</th>
              <th scope="col">Utilização</th>
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
    </Painel>
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
            className="flex items-start gap-1.5 rounded-sm text-left text-ink"
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 shrink-0 text-ink-subtle transition-transform ${
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
        <td className="text-ink-muted">{premissa.ondeUsada}</td>
      </tr>

      {aberta && (
        <tr id={idDetalhe} className="bg-surface-muted">
          <td colSpan={5} className="px-4 py-3">
            <dl className="max-w-3xl space-y-2">
              <div>
                <dt className="rotulo-secao">O que representa</dt>
                <dd className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink">
                  {premissa.descricao}
                </dd>
              </div>
              <div>
                <dt className="rotulo-secao">Por que existe e o que simplifica</dt>
                <dd className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-muted">
                  {premissa.porQueExiste}
                </dd>
              </div>
            </dl>
          </td>
        </tr>
      )}
    </>
  );
}
