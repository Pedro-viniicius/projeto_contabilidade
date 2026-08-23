"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AreaRolavel } from "@/components/ui/area-rolavel";
import { formatarMoeda, formatarPercentual } from "@/lib/format";
import {
  listarPremissas,
  ROTULO_STATUS,
  type StatusPremissa,
} from "../domain/calculation-rules";
import type { Encargo, ResultadoCenario } from "../types";

export const TOM_STATUS: Record<
  StatusPremissa,
  "atencao" | "neutro" | "positivo"
> = {
  "hipotese-temporaria": "atencao",
  "a-validar": "neutro",
  "validada-tecnicamente": "positivo",
  "nao-aplicavel": "neutro",
};

/**
 * Composição dos encargos de um cenário — a auditoria acontece aqui,
 * dentro da própria área de trabalho.
 *
 * Cada linha abre no lugar e mostra a conta (base × alíquota = valor)
 * ao lado da premissa que a originou, com a justificativa e o estágio
 * de validação. Era exatamente o que antes exigia sair para
 * `/premissas` e perder a simulação de vista.
 */
export function ComposicaoEncargos({ cenario }: { cenario: ResultadoCenario }) {
  const premissas = listarPremissas();
  const [aberta, setAberta] = useState<string | null>(null);

  return (
    <AreaRolavel>
      <table className="tabela-dados min-w-[34rem] text-[0.8125rem]">
        <caption className="sr-only">
          Composição dos encargos do cenário {cenario.nome}, com base de
          cálculo, alíquota e status de validação. Cada linha abre a premissa
          correspondente.
        </caption>
        <thead>
          <tr>
            <th scope="col">Encargo</th>
            <th scope="col" className="num">
              Base
            </th>
            <th scope="col" className="num">
              Alíquota
            </th>
            <th scope="col" className="num">
              Valor mensal
            </th>
            <th scope="col">Premissa</th>
          </tr>
        </thead>
        <tbody>
          {cenario.encargos.map((encargo) => (
            <LinhaEncargo
              key={encargo.rotulo}
              encargo={encargo}
              premissa={premissas.find((p) => p.chave === encargo.premissa)}
              aberta={aberta === encargo.rotulo}
              onAlternar={() =>
                setAberta(aberta === encargo.rotulo ? null : encargo.rotulo)
              }
            />
          ))}

          <tr className="bg-surface-muted">
            <th scope="row" className="font-medium text-ink">
              Total de encargos
            </th>
            <td className="num" />
            <td className="num text-ink-muted">
              {formatarPercentual(cenario.cargaSobreReceita)} da receita
            </td>
            <td className="num font-semibold text-ink">
              {formatarMoeda(cenario.encargosMensais)}
            </td>
            <td />
          </tr>
        </tbody>
      </table>
    </AreaRolavel>
  );
}

function LinhaEncargo({
  encargo,
  premissa,
  aberta,
  onAlternar,
}: {
  encargo: Encargo;
  premissa: ReturnType<typeof listarPremissas>[number] | undefined;
  aberta: boolean;
  onAlternar: () => void;
}) {
  const id = `encargo-${encargo.rotulo.replace(/\W+/g, "-")}`;

  return (
    <>
      <tr className="hover:bg-surface-hover">
        <th scope="row" className="font-normal">
          <button
            type="button"
            onClick={onAlternar}
            aria-expanded={aberta}
            aria-controls={id}
            className="alvo-toque flex w-full items-start gap-1.5 rounded-sm text-left text-ink"
          >
            <span
              aria-hidden="true"
              className={`mt-px shrink-0 text-ink-subtle transition-transform ${
                aberta ? "rotate-90" : ""
              }`}
            >
              ›
            </span>
            <span>{encargo.rotulo}</span>
          </button>
        </th>
        <td className="num text-ink-muted">
          {encargo.base !== undefined ? formatarMoeda(encargo.base) : "—"}
        </td>
        <td className="num text-ink-muted">
          {encargo.aliquota !== undefined
            ? formatarPercentual(encargo.aliquota)
            : "—"}
        </td>
        <td className="num font-medium text-ink">
          {formatarMoeda(encargo.valorMensal)}
        </td>
        <td>
          {premissa ? (
            <Badge tom={TOM_STATUS[premissa.status]}>
              {ROTULO_STATUS[premissa.status]}
            </Badge>
          ) : (
            <span className="text-ink-subtle">—</span>
          )}
        </td>
      </tr>

      {aberta && (
        <tr id={id} className="bg-surface-muted">
          <td colSpan={5} className="px-4 py-3">
            <div className="grid max-w-4xl gap-4 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
              <dl className="space-y-1.5">
                <p className="rotulo-secao">Como o valor foi obtido</p>
                <LinhaConta
                  rotulo="Base de cálculo"
                  valor={
                    encargo.base !== undefined
                      ? formatarMoeda(encargo.base)
                      : "—"
                  }
                />
                <LinhaConta
                  rotulo="Alíquota aplicada"
                  valor={
                    encargo.aliquota !== undefined
                      ? formatarPercentual(encargo.aliquota)
                      : "—"
                  }
                />
                {encargo.parcelaADeduzir !== undefined &&
                  encargo.parcelaADeduzir > 0 && (
                    <LinhaConta
                      rotulo="Parcela a deduzir"
                      valor={`− ${formatarMoeda(encargo.parcelaADeduzir)}`}
                    />
                  )}
                <LinhaConta
                  rotulo="Resultado"
                  valor={formatarMoeda(encargo.valorMensal)}
                  destaque
                />
              </dl>

              <div className="space-y-2">
                <div>
                  <p className="rotulo-secao">Premissa utilizada</p>
                  <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink">
                    {premissa?.descricao ?? encargo.explicacao}
                  </p>
                </div>

                {premissa && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="rotulo-secao">Status</span>
                      <Badge tom={TOM_STATUS[premissa.status]}>
                        {ROTULO_STATUS[premissa.status]}
                      </Badge>
                    </div>
                    <div>
                      <p className="rotulo-secao">
                        Por que existe e o que simplifica
                      </p>
                      <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-muted">
                        {premissa.porQueExiste}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function LinhaConta({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 ${
        destaque ? "border-t border-border-base pt-1.5" : ""
      }`}
    >
      <dt className="text-[0.8125rem] text-ink-muted">{rotulo}</dt>
      <dd
        className={`tnum text-[0.8125rem] ${
          destaque ? "font-semibold text-ink" : "text-ink"
        }`}
      >
        {valor}
      </dd>
    </div>
  );
}

/** Passo a passo da conta, para conferência linha a linha. */
export function PassosCalculo({ cenario }: { cenario: ResultadoCenario }) {
  return (
    <AreaRolavel>
      <table className="tabela-dados min-w-[30rem] text-[0.8125rem]">
        <caption className="sr-only">
          Passo a passo do cálculo do cenário {cenario.nome}.
        </caption>
        <thead>
          <tr>
            <th scope="col">Etapa</th>
            <th scope="col">Fórmula</th>
            <th scope="col" className="num">
              Resultado
            </th>
          </tr>
        </thead>
        <tbody>
          {cenario.passos.map((passo) => (
            <tr key={passo.rotulo}>
              <th scope="row" className="font-normal text-ink">
                {passo.rotulo}
              </th>
              <td className="tnum text-ink-muted">{passo.formula}</td>
              <td className="num font-medium text-ink">
                {formatarMoeda(passo.valor)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AreaRolavel>
  );
}
