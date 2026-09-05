import { formatarMoeda, formatarPercentual } from "@/lib/format";
import { AreaRolavel } from "@/components/ui/area-rolavel";
import {
  diferencaMoeda,
  diferencaPontos,
  semComparacao,
  type DiferencaSemantica,
} from "../domain/diferenca-semantica";
import type { Comparacao } from "../types";

interface Linha {
  indicador: string;
  pf: string;
  cnpj: string;
  diferenca: DiferencaSemantica;
  /** Linha de fechamento, com peso visual maior. */
  destaque?: boolean;
}

/**
 * Comparação PF × CNPJ em tabela.
 *
 * A coluna de diferença não usa sinal: cada célula NOMEIA o cenário e
 * a direção — "CNPJ: R$ 2.001,97 a mais". O sinal sozinho obrigaria o
 * contador a lembrar, linha a linha, se "+" é vantagem (resultado) ou
 * custo (encargos), e essa inferência é onde a leitura rápida erra.
 *
 * Cor entra só como reforço, e apenas na linha de fechamento: um
 * resultado maior não é recomendação — as premissas ainda estão em
 * validação.
 */
export function TabelaComparativa({ comparacao }: { comparacao: Comparacao }) {
  const { pessoaFisica: pf, cnpj } = comparacao;
  const custo = { maiorEhMelhor: false };
  const ganho = { maiorEhMelhor: true };

  const linhas: Linha[] = [
    {
      indicador: "Receita bruta",
      pf: formatarMoeda(pf.receitaMensal),
      cnpj: formatarMoeda(cnpj.receitaMensal),
      diferenca: semComparacao(),
    },
    {
      indicador: "Custos do negócio",
      pf: formatarMoeda(pf.custosMensais),
      cnpj: formatarMoeda(cnpj.custosMensais),
      diferenca: semComparacao(),
    },
    {
      indicador: "Encargos estimados",
      pf: formatarMoeda(pf.encargosMensais),
      cnpj: formatarMoeda(cnpj.encargosMensais),
      diferenca: diferencaMoeda(pf.encargosMensais, cnpj.encargosMensais, custo),
    },
    {
      indicador: "Carga sobre a receita",
      pf: formatarPercentual(pf.cargaSobreReceita),
      cnpj: formatarPercentual(cnpj.cargaSobreReceita),
      diferenca: diferencaPontos(
        pf.cargaSobreReceita,
        cnpj.cargaSobreReceita,
        custo,
      ),
    },
    {
      indicador: "Resultado líquido mensal",
      pf: formatarMoeda(pf.liquidoMensal),
      cnpj: formatarMoeda(cnpj.liquidoMensal),
      diferenca: diferencaMoeda(pf.liquidoMensal, cnpj.liquidoMensal, ganho),
      destaque: true,
    },
    {
      indicador: "Margem líquida",
      pf: formatarPercentual(pf.margemLiquida),
      cnpj: formatarPercentual(cnpj.margemLiquida),
      diferenca: diferencaPontos(pf.margemLiquida, cnpj.margemLiquida, ganho),
    },
    {
      indicador: "Projeção anual",
      pf: formatarMoeda(pf.liquidoAnual),
      cnpj: formatarMoeda(cnpj.liquidoAnual),
      diferenca: diferencaMoeda(
        pf.liquidoAnual,
        cnpj.liquidoAnual,
        ganho,
        " por ano",
      ),
    },
  ];

  return (
    /* Rolagem própria: a tabela nunca empurra a página no mobile. */
    <AreaRolavel>
      <table className="tabela-dados min-w-[36rem] text-[0.8125rem]">
        <caption className="sr-only">
          Comparação entre os cenários Pessoa Física e CNPJ, com valores
          mensais, margem e projeção anual. A coluna de diferença nomeia o
          cenário de maior valor.
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
            <th scope="col">Diferença</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr
              key={linha.indicador}
              /* `data-total` carrega o estilo de fechamento definido em
                 `globals.css` — a mesma forma em toda tabela do produto. */
              data-total={linha.destaque ? "" : undefined}
              className={
                linha.destaque ? undefined : "transition-colors hover:bg-surface-hover"
              }
            >
              <th
                scope="row"
                className={`font-normal ${
                  linha.destaque ? "font-medium text-ink" : "text-ink-muted"
                }`}
              >
                {linha.indicador}
              </th>
              <Valor
                texto={linha.pf}
                destaque={linha.destaque}
                marcado={linha.diferenca.vantagemPara === "pessoa-fisica"}
              />
              <Valor
                texto={linha.cnpj}
                destaque={linha.destaque}
                marcado={linha.diferenca.vantagemPara === "cnpj"}
              />
              <td
                className={`text-[0.75rem] leading-snug ${
                  linha.destaque
                    ? "font-medium text-ink"
                    : linha.diferenca.empate
                      ? "text-ink-subtle"
                      : "text-ink-muted"
                }`}
              >
                {linha.diferenca.texto}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AreaRolavel>
  );
}

/**
 * Célula numérica.
 *
 * `marcado` aponta o cenário que leva vantagem NAQUELA linha — que no
 * resultado é quem tem o maior número e nos encargos é quem tem o
 * menor. Marcador gráfico com texto acessível, nunca cor sozinha.
 */
function Valor({
  texto,
  destaque,
  marcado,
}: {
  texto: string;
  destaque?: boolean;
  marcado?: boolean;
}) {
  return (
    <td
      className={`num ${destaque ? "font-semibold text-ink" : "text-ink"}`}
    >
      {texto}
      {marcado && (
        <>
          <span aria-hidden="true" className="ml-1 text-ink-subtle">
            ▲
          </span>
          <span className="sr-only"> — cenário mais vantajoso nesta linha</span>
        </>
      )}
    </td>
  );
}
