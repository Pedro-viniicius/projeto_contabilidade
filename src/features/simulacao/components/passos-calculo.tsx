"use client";

import { AreaRolavel } from "@/components/ui/area-rolavel";
import { formatarMoeda } from "@/lib/format";
import type { ResultadoCenario } from "../types";

/**
 * Passo a passo da conta de UM cenário, linha a linha.
 *
 * Visão secundária de auditoria: a composição comparada responde
 * "quanto e por quê" para os dois cenários juntos; aqui o contador
 * confere a ordem exata das operações de um deles, na sequência em que
 * o motor as executou. Fica recolhida por padrão.
 */
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
