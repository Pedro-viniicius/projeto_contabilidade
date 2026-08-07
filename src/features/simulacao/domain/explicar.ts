/**
 * EXPLICAÇÕES DETERMINÍSTICAS
 *
 * Traduz o resultado numérico para linguagem de negócio, sem IA.
 * São templates baseados em regras — previsíveis, testáveis e sem custo.
 * Quando a lógica contábil estiver validada, este arquivo é o candidato
 * natural para ganhar uma camada de IA opcional.
 */

import { formatarMoeda, formatarPercentual } from "@/lib/format";
import type { Simulacao } from "../types";

export interface Explicacao {
  readonly titulo: string;
  readonly paragrafos: readonly string[];
  readonly tom: "positivo" | "atencao" | "negativo";
}

/** Classifica a saúde do resultado a partir da margem líquida. */
function classificarMargem(margem: number): "positivo" | "atencao" | "negativo" {
  if (margem <= 0) return "negativo";
  if (margem < 0.3) return "atencao";
  return "positivo";
}

export function explicarResultado(simulacao: Simulacao): Explicacao {
  const { principal, comparacao, entrada } = simulacao;
  const tom = classificarMargem(principal.margemLiquida);
  const paragrafos: string[] = [];

  if (principal.receitaMensal === 0) {
    return {
      titulo: "Sem receita informada",
      paragrafos: [
        "Você não informou receita mensal, então não há resultado a analisar. Volte e preencha um valor estimado de faturamento para ver a simulação.",
      ],
      tom: "atencao",
    };
  }

  paragrafos.push(
    `Com os valores informados, atuando como ${principal.nome}, sua operação gera aproximadamente ${formatarMoeda(
      principal.liquidoMensal,
    )} de resultado líquido por mês, o que equivale a ${formatarMoeda(
      principal.liquidoAnual,
    )} ao longo de um ano. Esse valor já considera os custos do negócio e os encargos estimados, mas não desconta suas despesas pessoais.`,
  );

  paragrafos.push(
    `De cada R$ 100 que entram, cerca de ${formatarPercentual(
      principal.cargaSobreReceita,
      0,
    ).replace("%", "")} vão para encargos e tributos estimados e ${formatarPercentual(
      principal.margemLiquida,
      0,
    ).replace("%", "")} sobram como resultado líquido.`,
  );

  if (tom === "negativo") {
    paragrafos.push(
      "Nesse cenário, os custos e encargos consomem tudo o que entra — e o resultado fica negativo. Vale revisar se os custos informados estão corretos ou se o preço praticado cobre a operação.",
    );
  } else if (tom === "atencao") {
    paragrafos.push(
      "A margem está apertada. Uma variação pequena de receita ou um custo inesperado pode comprometer o mês. Simular um aumento de preço ou uma redução de custos ajuda a enxergar a folga necessária.",
    );
  }

  if (comparacao.vencedor === null) {
    paragrafos.push(
      "Nesta simulação, os dois cenários — Pessoa Física e CNPJ — chegam ao mesmo resultado líquido. A decisão passa a depender de fatores que esta versão ainda não considera.",
    );
  } else {
    const melhor =
      comparacao.vencedor === "cnpj" ? comparacao.cnpj : comparacao.pessoaFisica;
    const ehOEscolhido = comparacao.vencedor === entrada.tipoAtuacao;
    paragrafos.push(
      ehOEscolhido
        ? `O cenário que você escolheu é também o mais vantajoso nesta simulação: a diferença a favor dele é de ${formatarMoeda(
            comparacao.diferencaMensal,
          )} por mês (${formatarMoeda(comparacao.diferencaAnual)} por ano).`
        : `Vale olhar o comparativo: no cenário ${melhor.nome} o resultado líquido seria ${formatarMoeda(
            comparacao.diferencaMensal,
          )} maior por mês, ou ${formatarMoeda(
            comparacao.diferencaAnual,
          )} por ano.`,
    );
  }

  return {
    titulo: "O que isso significa?",
    paragrafos,
    tom,
  };
}

/** Frase curta que resume a comparação, usada no card comparativo. */
export function explicarComparacao(simulacao: Simulacao): string {
  const { comparacao } = simulacao;
  if (comparacao.vencedor === null) {
    return "Os dois cenários empatam com os valores informados.";
  }
  const melhor =
    comparacao.vencedor === "cnpj" ? comparacao.cnpj : comparacao.pessoaFisica;
  return `Com estes números, ${melhor.nome} deixa ${formatarMoeda(
    comparacao.diferencaMensal,
  )} a mais por mês — ${formatarMoeda(comparacao.diferencaAnual)} no ano.`;
}
