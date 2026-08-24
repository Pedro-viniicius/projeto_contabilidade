/**
 * Validação da entrada do simulador.
 * Fronteira entre o formulário (dados crus) e o motor de cálculo
 * (dados confiáveis). Mensagens em pt-BR, prontas para a interface.
 */

import { z } from "zod";
import { REGRAS } from "../domain/calculation-rules";
import { CATALOGO_ATIVIDADES } from "../domain/catalogo-atividades";
import type { EntradaSimulacao } from "../types";

/** Limite defensivo: acima disso o número quase certamente é erro de digitação. */
export const RECEITA_MAXIMA = 10_000_000;

/**
 * Teto dos campos acumulados de 12 meses.
 *
 * Não é o teto do Simples (esse mora nas regras e produz um aviso de
 * enquadramento, não um erro de digitação): é a fronteira defensiva do
 * formulário, um zero a mais que o teto anual.
 */
export const ACUMULADO_MAXIMO = RECEITA_MAXIMA * 12;

export const anexoSchema = z.enum(["I", "II", "III", "IV", "V"], {
  error: "Anexo inválido.",
});

/**
 * Id de atividade que EXISTE no catálogo.
 *
 * Validar contra a lista é o que impede um registro antigo — ou um
 * localStorage editado à mão — de ressuscitar uma atividade que saiu
 * do catálogo e sair classificado por ela.
 */
const atividadeIdSchema = z
  .string()
  .refine((id) => CATALOGO_ATIVIDADES.some((a) => a.id === id), {
    message: "Atividade não consta no catálogo desta versão.",
  });

/** Tamanho máximo da justificativa da escolha manual de anexo. */
export const TAMANHO_MAX_MOTIVO = 140;

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
    atividadeId: atividadeIdSchema.nullable(),
    anexoManual: anexoSchema.nullable(),
    motivoAnexoManual: z.string().max(TAMANHO_MAX_MOTIVO).optional(),
    tipoAtuacao: tipoAtuacaoSchema,
    receitaMensal: dinheiro("a receita mensal").refine((v) => v > 0, {
      message: "Informe uma receita mensal maior que zero.",
    }),
    custosMensais: dinheiro("os custos mensais"),
    proLabore: dinheiro("o pró-labore"),
    honorariosContabeisPf: dinheiro(
      "os honorários contábeis do autônomo",
      100_000,
    ),
    honorariosContabeisPj: dinheiro(
      "os honorários contábeis da empresa",
      100_000,
    ),
    rbt12: dinheiro("a receita dos últimos 12 meses", ACUMULADO_MAXIMO),
    folha12m: dinheiro("a folha dos últimos 12 meses", ACUMULADO_MAXIMO),
  })
  .refine((d) => d.custosMensais <= d.receitaMensal, {
    path: ["custosMensais"],
    message:
      "Os custos ficaram maiores que a receita. Se isso estiver certo, ajuste a receita.",
  })
  .refine((d) => d.tipoAtuacao !== "cnpj" || d.proLabore <= d.receitaMensal, {
    path: ["proLabore"],
    message: "O pró-labore não pode ser maior que a receita mensal.",
  })
  /*
   * Folha maior que a receita acumulada não é apenas improvável: daria
   * Fator R acima de 100% e classificaria no Anexo III por engano de
   * digitação. Só vale quando a RBT12 foi informada — em branco, o
   * motor projeta e a comparação aqui não teria com o que comparar.
   */
  .refine((d) => d.rbt12 === 0 || d.folha12m <= d.rbt12, {
    path: ["folha12m"],
    message:
      "A folha de 12 meses ficou maior que a receita de 12 meses. Confira os valores.",
  });

export type EntradaSimulacaoValidada = z.infer<typeof simulacaoSchema>;

/**
 * Valores iniciais do formulário.
 *
 * Honorários contábeis de PF e PJ partem de premissas SEPARADAS, e a
 * da PF é zero de propósito: não temos referência profissional para o
 * custo contábil do autônomo, e chutar um valor inclinaria a
 * comparação sem que ninguém percebesse.
 */
export function valoresPadrao(): EntradaSimulacaoValidada {
  return {
    atividadeId: null,
    anexoManual: null,
    tipoAtuacao: "pessoa-fisica",
    receitaMensal: 0,
    custosMensais: 0,
    proLabore: 0,
    honorariosContabeisPf: REGRAS.pessoaFisica.custoContabilidadeMensal.valor,
    honorariosContabeisPj: REGRAS.cnpj.custoContabilidadeMensal.valor,
    rbt12: 0,
    folha12m: 0,
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
  "atividadeId",
  "anexoManual",
  "motivoAnexoManual",
  "tipoAtuacao",
  "receitaMensal",
  "custosMensais",
  "proLabore",
  "honorariosContabeisPf",
  "honorariosContabeisPj",
  "rbt12",
  "folha12m",
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
 * Migração de entrada gravada antes da v2.2.0.
 *
 * Até a v2.1.1 a entrada tinha um único `custoContabilidade`, aplicado
 * só ao cenário CNPJ, e não tinha atividade, RBT12 nem folha. Sem esta
 * conversão o schema rejeitaria todo registro antigo e o contador
 * perderia o histórico do aparelho numa atualização — apagando trabalho
 * que ele não pediu para apagar.
 *
 * As análises antigas voltam com `atividadeId: null`, ou seja,
 * CLASSIFICAÇÃO PENDENTE. Isso é deliberado: ninguém informou atividade
 * naquela época, e atribuir uma agora seria inventar um dado que o
 * contador nunca deu.
 */
function migrarEntrada(bruto: unknown): unknown {
  if (typeof bruto !== "object" || bruto === null) return bruto;
  const entrada = bruto as Record<string, unknown>;

  /* Nada a migrar: o registro já tem todos os campos desta versão. */
  if (CAMPOS_NOVOS.every((campo) => campo in entrada)) return entrada;

  const legado = entrada.custoContabilidade;
  return {
    ...entrada,
    /*
     * Ausente vira o padrão HONESTO do campo, nunca um palpite:
     * atividade indefinida é classificação pendente, e RBT12 e folha
     * zeradas fazem o motor projetar e avisar que projetou.
     */
    atividadeId: entrada.atividadeId ?? null,
    anexoManual: entrada.anexoManual ?? null,
    /* O honorário único da v2.1 era o da EMPRESA; o do autônomo nunca
       existiu, e por isso entra zerado — não replicado. */
    honorariosContabeisPf: entrada.honorariosContabeisPf ?? 0,
    honorariosContabeisPj:
      entrada.honorariosContabeisPj ?? (typeof legado === "number" ? legado : 0),
    rbt12: entrada.rbt12 ?? 0,
    folha12m: entrada.folha12m ?? 0,
  };
}

/** Campos introduzidos na v2.2.0 — a marca de que o registro é atual. */
const CAMPOS_NOVOS = [
  "atividadeId",
  "anexoManual",
  "honorariosContabeisPf",
  "honorariosContabeisPj",
  "rbt12",
  "folha12m",
] as const;

/** Entrada vinda do armazenamento, migrada antes de ser validada. */
export const entradaPersistidaSchema = z.preprocess(
  migrarEntrada,
  simulacaoSchema,
);

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
  entrada: entradaPersistidaSchema,
  /** Versão vigente quando a análise foi criada — nunca reescrita. */
  versaoRegras: z.string().min(1).max(60),
  referencia: z.string().max(TAMANHO_MAX_REFERENCIA).optional(),
});

export type SimulacaoSalvaValidada = z.infer<typeof simulacaoSalvaSchema>;
