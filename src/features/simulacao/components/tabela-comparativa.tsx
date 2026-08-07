import { formatarMoeda, formatarPercentual } from "@/lib/format";
import type { Comparacao, TipoAtuacao } from "../types";
import { AreaRolavel } from "@/components/ui/area-rolavel";

interface Linha {
  indicador: string;
  pf: string;
  cnpj: string;
  diferenca: string;
  /** Linha de fechamento, com peso visual maior. */
  destaque?: boolean;
  /** Aponta o cenário de maior valor, quando isso é informativo. */
  favorece?: TipoAtuacao | null;
}

/** Diferença em pontos percentuais, para margens. */
function pontosPercentuais(a: number, b: number): string {
  const dif = (b - a) * 100;
  const sinal = dif > 0 ? "+" : "";
  return `${sinal}${dif.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} p.p.`;
}

function moedaComSinal(a: number, b: number): string {
  const dif = b - a;
  const sinal = dif > 0 ? "+" : dif < 0 ? "−" : "";
  return `${sinal}${formatarMoeda(Math.abs(dif))}`;
}

/**
 * Comparação PF × CNPJ em tabela.
 *
 * Cor é usada com parcimônia: apenas a linha de resultado líquido
 * recebe destaque, e mesmo assim de forma neutra. Um resultado maior
 * não é recomendação — as premissas ainda não foram validadas.
 */
export function TabelaComparativa({ comparacao }: { comparacao: Comparacao }) {
  const { pessoaFisica: pf, cnpj } = comparacao;

  const linhas: Linha[] = [
    {
      indicador: "Receita bruta",
      pf: formatarMoeda(pf.receitaMensal),
      cnpj: formatarMoeda(cnpj.receitaMensal),
      diferenca: "—",
    },
    {
      indicador: "Custos do negócio",
      pf: formatarMoeda(pf.custosMensais),
      cnpj: formatarMoeda(cnpj.custosMensais),
      diferenca: "—",
    },
    {
      indicador: "Encargos estimados",
      pf: formatarMoeda(pf.encargosMensais),
      cnpj: formatarMoeda(cnpj.encargosMensais),
      diferenca: moedaComSinal(pf.encargosMensais, cnpj.encargosMensais),
    },
    {
      indicador: "Carga sobre a receita",
      pf: formatarPercentual(pf.cargaSobreReceita),
      cnpj: formatarPercentual(cnpj.cargaSobreReceita),
      diferenca: pontosPercentuais(pf.cargaSobreReceita, cnpj.cargaSobreReceita),
    },
    {
      indicador: "Resultado líquido mensal",
      pf: formatarMoeda(pf.liquidoMensal),
      cnpj: formatarMoeda(cnpj.liquidoMensal),
      diferenca: moedaComSinal(pf.liquidoMensal, cnpj.liquidoMensal),
      destaque: true,
      favorece: comparacao.vencedor,
    },
    {
      indicador: "Margem líquida",
      pf: formatarPercentual(pf.margemLiquida),
      cnpj: formatarPercentual(cnpj.margemLiquida),
      diferenca: pontosPercentuais(pf.margemLiquida, cnpj.margemLiquida),
    },
    {
      indicador: "Projeção anual",
      pf: formatarMoeda(pf.liquidoAnual),
      cnpj: formatarMoeda(cnpj.liquidoAnual),
      diferenca: moedaComSinal(pf.liquidoAnual, cnpj.liquidoAnual),
    },
  ];

  return (
    /* Rolagem própria: a tabela nunca empurra a página no mobile. */
    <AreaRolavel>
      <table className="tabela-dados min-w-[34rem] text-[0.8125rem]">
        <caption className="sr-only">
          Comparação entre os cenários Pessoa Física e CNPJ, com valores
          mensais, margem e projeção anual.
        </caption>
        <thead>
          <tr>
            <th scope="col">Indicador</th>
            <th scope="col" className="num">
              Pessoa Física
            </th>
            <th scope="col" className="num">
              CNPJ
            </th>
            <th scope="col" className="num">
              Diferença
            </th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr
              key={linha.indicador}
              className={linha.destaque ? "bg-surface-muted" : undefined}
            >
              <th
                scope="row"
                className={`font-normal ${
                  linha.destaque ? "font-medium text-ink" : "text-ink-muted"
                }`}
              >
                {linha.indicador}
              </th>
              <td
                className={`num ${
                  linha.destaque ? "font-semibold text-ink" : "text-ink"
                }`}
              >
                {linha.pf}
                {linha.favorece === "pessoa-fisica" && <MarcadorMaior />}
              </td>
              <td
                className={`num ${
                  linha.destaque ? "font-semibold text-ink" : "text-ink"
                }`}
              >
                {linha.cnpj}
                {linha.favorece === "cnpj" && <MarcadorMaior />}
              </td>
              <td
                className={`num ${
                  linha.destaque
                    ? "font-semibold text-ink"
                    : "text-ink-muted"
                }`}
              >
                {linha.diferenca}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AreaRolavel>
  );
}

/**
 * Marcador do maior resultado. Símbolo + texto acessível, sem cor de
 * julgamento: sinaliza magnitude, não recomendação.
 */
function MarcadorMaior() {
  return (
    <>
      <span aria-hidden="true" className="ml-1 text-ink-subtle">
        ▲
      </span>
      <span className="sr-only"> — maior resultado estimado</span>
    </>
  );
}
