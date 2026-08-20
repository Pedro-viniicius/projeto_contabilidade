/**
 * Validação da entrada do simulador.
 * Fronteira entre o formulário (dados crus) e o motor de cálculo
 * (dados confiáveis). Mensagens em pt-BR, prontas para a interface.
 */

import { z } from "zod";
import { REGRAS } from "../domain/calculation-rules";
import type { EntradaSimulacao } from "../types";

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

/** Tamanho máximo do rótulo livre da análise. */
export const TAMANHO_MAX_REFERENCIA = 60;

/**
 * Campos da entrada, na ordem do schema. Fonte única para comparar
 * duas entradas sem depender de serialização.
 */
const CAMPOS_ENTRADA = [
  "tipoAtuacao",
  "receitaMensal",
  "custosMensais",
  "proLabore",
  "custoContabilidade",
] as const satisfies readonly (keyof EntradaSimulacao)[];

/**
 * Compara duas entradas campo a campo.
 *
 * Substitui `JSON.stringify(a) === JSON.stringify(b)`, que dependia da
 * ordem das chaves e de nenhuma chave extra ter sobrevivido ao
 * localStorage. É o que decide se o resultado exibido está
 * desatualizado — um falso negativo aqui mostraria número velho como
 * se fosse atual.
 */
export function mesmaEntrada(
  a: EntradaSimulacao,
  b: EntradaSimulacao,
): boolean {
  return CAMPOS_ENTRADA.every((campo) => a[campo] === b[campo]);
}

/**
 * Data em texto que o `Date` do navegador consegue interpretar.
 *
 * Não basta ser string: `Intl.DateTimeFormat.format` lança
 * `RangeError` em data inválida, e uma exceção durante o render
 * derruba a área de trabalho inteira. A validação acontece aqui, na
 * fronteira, e não no componente.
 */
const dataInterpretavel = z
  .string({ error: "Data ausente no registro." })
  .min(1, { message: "Data ausente no registro." })
  .refine((v) => Number.isFinite(new Date(v).getTime()), {
    message: "Data do registro é inválida.",
  });

/**
 * Registro persistido completo.
 *
 * Tudo que vem do localStorage é `unknown` até passar por aqui —
 * inclusive os campos fora de `entrada`, que antes atravessavam a
 * fronteira sem validação nenhuma.
 */
export const simulacaoSalvaSchema = z.object({
  id: z.string().min(1).max(120),
  criadaEm: dataInterpretavel,
  /* Ausente nos registros gravados antes da v2.1.1. */
  atualizadaEm: dataInterpretavel.optional(),
  entrada: simulacaoSchema,
  /** Versão vigente quando a análise foi criada — nunca reescrita. */
  versaoRegras: z.string().min(1).max(60),
  referencia: z.string().max(TAMANHO_MAX_REFERENCIA).optional(),
});

export type SimulacaoSalvaValidada = z.infer<typeof simulacaoSalvaSchema>;
