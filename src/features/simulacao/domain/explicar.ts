/**
 * EXPLICAÇÕES DETERMINÍSTICAS
 *
 * Traduz o resultado numérico para linguagem de negócio, sem IA.
 * São templates baseados em regras — previsíveis, testáveis e sem custo.
 * Quando a lógica contábil estiver validada, este arquivo é o candidato
 * natural para ganhar uma camada de IA opcional.
 */

import { formatarMoeda, formatarPercentual } from "@/lib/format";
import {
  compararEncargos,
  maioresContribuintes,
  type LinhaEncargoComparada,
} from "./comparar-encargos";
import { NOME_CURTO } from "./diferenca-semantica";
import type { Simulacao, TipoAtuacao } from "../types";

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

/* ------------------------------------------------------------------
 * CONCLUSÃO DO COMPARATIVO
 * ------------------------------------------------------------------ */

export interface ConclusaoComparacao {
  /** Frase de conclusão. Nunca uma recomendação de enquadramento. */
  readonly titulo: string;
  /** Cenário de maior líquido. `null` no empate. */
  readonly vencedor: TipoAtuacao | null;
  /** "R$ 2.001,97 a mais por mês", já com o sentido explícito. */
  readonly mensal: string;
  readonly anual: string;
}

/**
 * O veredito do comparativo, em uma frase.
 *
 * "MAIOR RESULTADO ESTIMADO" acima de um nome de cenário obriga o
 * contador a montar a frase de cabeça antes de repeti-la ao cliente.
 * Aqui a frase já vem pronta — e vem CONDICIONADA às premissas, porque
 * é isso que ela é: uma estimativa sob hipóteses declaradas, não uma
 * indicação de regime.
 */
export function concluirComparacao(simulacao: Simulacao): ConclusaoComparacao {
  const { comparacao } = simulacao;

  if (comparacao.vencedor === null) {
    return {
      titulo:
        "Nas premissas atuais, os dois cenários chegam ao mesmo resultado líquido estimado.",
      vencedor: null,
      mensal: "Sem diferença mensal",
      anual: "Sem diferença anual",
    };
  }

  const nome = NOME_CURTO[comparacao.vencedor];
  return {
    titulo: `Nas premissas atuais, ${nome} apresenta maior resultado líquido estimado.`,
    vencedor: comparacao.vencedor,
    mensal: `${formatarMoeda(comparacao.diferencaMensal)} a mais por mês`,
    anual: `${formatarMoeda(comparacao.diferencaAnual)} a mais por ano`,
  };
}

/* ------------------------------------------------------------------
 * O QUE EXPLICA A DIFERENÇA
 * ------------------------------------------------------------------ */

export interface ExplicacaoDiferenca {
  /** Frases factuais, da mais relevante para a menos. */
  readonly motivos: readonly string[];
  /** Linhas de encargo que mais pesam, para destacar na composição. */
  readonly contribuintes: readonly LinhaEncargoComparada[];
}

function pesoDe(linha: LinhaEncargoComparada): number {
  return Math.abs(
    (linha.cnpj?.valorMensal ?? 0) - (linha.pessoaFisica?.valorMensal ?? 0),
  );
}

/**
 * Por que os dois cenários diferem — derivado do cálculo, nunca fixo.
 *
 * É o texto que o contador repete ao cliente. Por isso cada frase cita
 * números que estão na tabela logo acima: quem conferir, encontra.
 * Quando não há diferença material, o módulo diz isso em vez de
 * inventar um motivo.
 */
export function explicarDiferenca(simulacao: Simulacao): ExplicacaoDiferenca {
  const { comparacao } = simulacao;
  const { pessoaFisica: pf, cnpj } = comparacao;
  const composicao = compararEncargos(comparacao);
  const contribuintes = maioresContribuintes(composicao);
  const motivos: string[] = [];

  /*
   * Receita e custos são iguais por construção nos dois cenários — é o
   * que torna a comparação justa. Logo, TODA a diferença de líquido
   * vem dos encargos. Dizer isso primeiro evita que o contador procure
   * a causa no lugar errado.
   */
  motivos.push(
    `Receita e custos são os mesmos nos dois cenários, então a diferença de resultado vem inteiramente dos encargos: ${formatarPercentual(
      pf.cargaSobreReceita,
    )} da receita na Pessoa Física contra ${formatarPercentual(
      cnpj.cargaSobreReceita,
    )} no CNPJ.`,
  );

  for (const linha of contribuintes) {
    const valorPf = linha.pessoaFisica?.valorMensal ?? 0;
    const valorCnpj = linha.cnpj?.valorMensal ?? 0;

    if (linha.apenasEm === "cnpj") {
      motivos.push(
        `${linha.rotulo} pesa ${formatarMoeda(
          valorCnpj,
        )} por mês no CNPJ e não tem equivalente na Pessoa Física.`,
      );
      continue;
    }
    if (linha.apenasEm === "pessoa-fisica") {
      motivos.push(
        `${linha.rotulo} pesa ${formatarMoeda(
          valorPf,
        )} por mês na Pessoa Física e não tem equivalente no CNPJ.`,
      );
      continue;
    }
    motivos.push(
      `${linha.rotulo}: ${formatarMoeda(valorPf)} na Pessoa Física contra ${formatarMoeda(
        valorCnpj,
      )} no CNPJ — ${linha.diferenca.texto.toLowerCase()}.`,
    );
  }

  if (contribuintes.length === 0) {
    motivos.push(
      "Nenhum encargo isolado responde pela diferença: os valores praticamente empatam linha a linha.",
    );
  }

  return {
    motivos,
    contribuintes: contribuintes.slice().sort((a, b) => pesoDe(b) - pesoDe(a)),
  };
}
