import { Badge } from "@/components/ui/badge";
import { formatarMoeda, formatarPercentual } from "@/lib/format";
import {
  listarPremissas,
  ROTULO_STATUS,
  type StatusPremissa,
} from "../domain/calculation-rules";
import type { ResultadoCenario } from "../types";

const TOM_STATUS: Record<StatusPremissa, "atencao" | "neutro" | "positivo"> = {
  "hipotese-temporaria": "atencao",
  "a-validar": "neutro",
  "validada-tecnicamente": "positivo",
  "nao-aplicavel": "neutro",
};

/**
 * Composição dos encargos de um cenário.
 *
 * Mostra base × alíquota = resultado direto da tabela, sem modal e sem
 * clique extra além de abrir a seção: é a informação que o contador
 * mais precisa conferir.
 */
export function DetalheEncargos({ cenario }: { cenario: ResultadoCenario }) {
  const premissas = listarPremissas();

  return (
    <div className="overflow-x-auto">
      <table className="tabela-dados min-w-[36rem] text-[0.8125rem]">
        <caption className="sr-only">
          Composição dos encargos do cenário {cenario.nome}, com base de
          cálculo, alíquota e status de validação de cada premissa.
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
          {cenario.encargos.map((encargo) => {
            const premissa = premissas.find((p) => p.chave === encargo.premissa);
            return (
              <tr key={encargo.rotulo}>
                <th scope="row" className="font-normal text-ink">
                  {encargo.rotulo}
                  {encargo.parcelaADeduzir !== undefined &&
                    encargo.parcelaADeduzir > 0 && (
                      <span className="block text-[0.75rem] text-ink-subtle">
                        parcela a deduzir: {formatarMoeda(encargo.parcelaADeduzir)}
                      </span>
                    )}
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
            );
          })}
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
    </div>
  );
}

/** Passo a passo da conta, para conferência linha a linha. */
export function PassosCalculo({ cenario }: { cenario: ResultadoCenario }) {
  return (
    <div className="overflow-x-auto">
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
    </div>
  );
}
