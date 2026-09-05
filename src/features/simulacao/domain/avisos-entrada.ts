/**
 * CONFERÊNCIA DA ENTRADA — funções puras.
 *
 * Divisão de trabalho com `simulacao-schema`:
 *
 *   - o SCHEMA barra o que impede o cálculo (negativo, receita zero,
 *     folha maior que a receita de 12 meses). É ERRO: o botão não
 *     passa;
 *   - este módulo aponta o que é ESTRANHO mas pode estar certo. Nunca
 *     bloqueia nada, nunca altera um valor e nunca entra no motor.
 *
 * Por isso todo texto daqui é redigido como CONFERÊNCIA, não como
 * correção: um custo de 84% da receita é raro, e é perfeitamente
 * possível. Dizer "está errado" a um contador que sabe o que digitou
 * ensina a ignorar avisos.
 *
 * IMPORTANTE — os limiares abaixo NÃO são parâmetros tributários. São
 * faixas de estranheza para decidir quando perguntar, não têm efeito
 * sobre nenhum valor calculado e por isso não moram em
 * `calculation-rules.ts`, cuja lista é a auditoria das regras fiscais.
 */

import type { EntradaSimulacao } from "../types";

/** Gravidade do apontamento. O erro pertence ao schema, não a este módulo. */
export type NivelAviso = "atencao" | "informacao";

export interface AvisoEntrada {
  /** Identificador estável, para teste e para chave de lista. */
  readonly chave: string;
  /** Campo ao qual o apontamento se refere. `null` = geral. */
  readonly campo: keyof EntradaSimulacao | null;
  readonly nivel: NivelAviso;
  /** Texto pronto, em pt-BR, redigido como pedido de conferência. */
  readonly texto: string;
}

/**
 * Faixas de estranheza. Não são alíquotas, tetos nem faixas fiscais:
 * são o ponto a partir do qual vale a pena perguntar.
 */
const LIMIARES = {
  /** Custos acima desta fração da receita pedem confirmação. */
  custoSobreReceita: 0.7,
  /** RBT12 abaixo desta fração da receita anualizada parece defasada. */
  rbt12Minima: 0.5,
  /** RBT12 acima deste múltiplo da receita anualizada parece de outro cliente. */
  rbt12Maxima: 2,
  /** Folha abaixo desta fração do pró-labore anual é incoerente. */
  folhaSobreProLaboreAnual: 0.9,
  meses: 12,
} as const;

/** Contexto de classificação que muda o que vale a pena conferir. */
export interface ContextoConferencia {
  /** A atividade transita entre anexos conforme o Fator R. */
  readonly sujeitaFatorR: boolean;
}

const pct = (v: number) =>
  `${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`;

const brl = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

/**
 * Aponta o que merece um segundo olhar antes do cálculo.
 *
 * Determinística e ordenada: o mesmo formulário produz sempre a mesma
 * lista, na mesma ordem — do que mais distorce o resultado para o que
 * apenas convém saber.
 */
export function conferirEntrada(
  entrada: EntradaSimulacao,
  { sujeitaFatorR }: ContextoConferencia,
): readonly AvisoEntrada[] {
  const avisos: AvisoEntrada[] = [];
  const { receitaMensal: receita } = entrada;

  /* Sem receita não há proporção a avaliar: o schema já cobra o campo. */
  if (receita <= 0) return avisos;

  const receitaAnualizada = receita * LIMIARES.meses;

  if (entrada.custosMensais / receita >= LIMIARES.custoSobreReceita) {
    avisos.push({
      chave: "custos-altos",
      campo: "custosMensais",
      nivel: "atencao",
      texto: `Custos representam ${pct(
        entrada.custosMensais / receita,
      )} da receita informada. Confirme se deseja manter este valor.`,
    });
  }

  if (entrada.rbt12 === 0) {
    avisos.push({
      chave: "rbt12-ausente",
      campo: "rbt12",
      nivel: "informacao",
      texto: `Sem RBT12 informada, o modelo projeta a receita mensal por 12 (${brl(
        receitaAnualizada,
      )}) para encontrar a faixa do Simples. Informe o acumulado real para um enquadramento confiável.`,
    });
  } else if (entrada.rbt12 < receitaAnualizada * LIMIARES.rbt12Minima) {
    avisos.push({
      chave: "rbt12-baixa",
      campo: "rbt12",
      nivel: "atencao",
      texto: `Confira este valor. A RBT12 informada é menos da metade da receita mensal projetada para 12 meses (${brl(
        receitaAnualizada,
      )}). Ela define a faixa do Simples.`,
    });
  } else if (entrada.rbt12 > receitaAnualizada * LIMIARES.rbt12Maxima) {
    avisos.push({
      chave: "rbt12-alta",
      campo: "rbt12",
      nivel: "atencao",
      texto: `Confira este valor. A RBT12 informada passa do dobro da receita mensal projetada para 12 meses (${brl(
        receitaAnualizada,
      )}).`,
    });
  }

  if (entrada.proLabore === 0) {
    avisos.push({
      chave: "pro-labore-zero",
      campo: "proLabore",
      nivel: "atencao",
      texto:
        "Pró-labore zerado. O cenário CNPJ sai sem INSS nem IRRF sobre pró-labore, e a folha de 12 meses perde a parcela do sócio.",
    });
  }

  if (sujeitaFatorR && entrada.folha12m === 0) {
    avisos.push({
      chave: "folha-ausente",
      campo: "folha12m",
      nivel: "atencao",
      texto:
        "Esta atividade depende do Fator R e a folha de 12 meses está zerada. Confirme se o cliente não teve pró-labore nem salários no período.",
    });
  } else if (
    sujeitaFatorR &&
    entrada.proLabore > 0 &&
    entrada.folha12m <
      entrada.proLabore * LIMIARES.meses * LIMIARES.folhaSobreProLaboreAnual
  ) {
    avisos.push({
      chave: "folha-menor-que-pro-labore",
      campo: "folha12m",
      nivel: "atencao",
      texto: `Confira este valor. A folha de 12 meses é menor que o pró-labore mensal projetado para o mesmo período (${brl(
        entrada.proLabore * LIMIARES.meses,
      )}), e o pró-labore compõe a folha do Fator R.`,
    });
  }

  if (entrada.honorariosContabeisPf === 0) {
    avisos.push({
      chave: "honorarios-pf-zero",
      campo: "honorariosContabeisPf",
      nivel: "informacao",
      texto:
        "Honorários do autônomo em zero — é o padrão do modelo, que não arbitra esse custo. Se o cliente paga contabilidade como pessoa física, informe o valor.",
    });
  }

  return avisos;
}

/** Avisos de um campo específico, para exibir junto dele. */
export function avisosDoCampo(
  avisos: readonly AvisoEntrada[],
  campo: keyof EntradaSimulacao,
): readonly AvisoEntrada[] {
  return avisos.filter((a) => a.campo === campo);
}
