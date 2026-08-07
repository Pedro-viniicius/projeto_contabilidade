/**
 * Validação da entrada do simulador.
 * Fronteira entre o formulário (dados crus) e o motor de cálculo
 * (dados confiáveis). Mensagens em pt-BR, prontas para a interface.
 */

import { z } from "zod";
import { REGRAS } from "../domain/calculation-rules";

/** Limite defensivo: acima disso o número quase certamente é erro de digitação. */
export const RECEITA_MAXIMA = 10_000_000;

const dinheiro = (rotulo: string, maximo = RECEITA_MAXIMA) =>
  z
    .number({ error: `Informe ${rotulo} em reais.` })
    .refine((v) => Number.isFinite(v), { message: `Informe ${rotulo} válido.` })
    .min(0, { message: `${rotulo} não pode ser negativo.` })
    .max(maximo, {
      message: `${rotulo} acima do limite desta simulação. Confira o valor digitado.`,
    });

export const tipoAtuacaoSchema = z.enum(["pessoa-fisica", "cnpj"], {
  error: "Escolha como você atua hoje.",
});

export const simulacaoSchema = z
  .object({
    tipoAtuacao: tipoAtuacaoSchema,
    receitaMensal: dinheiro("a receita mensal").refine((v) => v > 0, {
      message: "Informe uma receita mensal maior que zero.",
    }),
    custosMensais: dinheiro("os custos mensais"),
    proLabore: dinheiro("o pró-labore"),
    custoContabilidade: dinheiro("o custo contábil", 100_000),
  })
  .refine((d) => d.custosMensais <= d.receitaMensal, {
    path: ["custosMensais"],
    message:
      "Os custos ficaram maiores que a receita. Se isso estiver certo, ajuste a receita.",
  })
  .refine((d) => d.tipoAtuacao !== "cnpj" || d.proLabore <= d.receitaMensal, {
    path: ["proLabore"],
    message: "O pró-labore não pode ser maior que a receita mensal.",
  });

export type EntradaSimulacaoValidada = z.infer<typeof simulacaoSchema>;

/** Valores iniciais do formulário. Pró-labore e contabilidade partem das premissas. */
export function valoresPadrao(): EntradaSimulacaoValidada {
  return {
    tipoAtuacao: "pessoa-fisica",
    receitaMensal: 0,
    custosMensais: 0,
    proLabore: 0,
    custoContabilidade: REGRAS.cnpj.custoContabilidadeMensal.valor,
  };
}

/** Pró-labore sugerido a partir da receita, conforme premissa configurada. */
export function proLaboreSugerido(receitaMensal: number): number {
  const bruto =
    receitaMensal * REGRAS.cnpj.proLaborePercentualSugerido.valor;
  return Math.round(bruto * 100) / 100;
}
