/**
 * Persistência local das simulações.
 *
 * Guardamos a entrada validada, nunca o resultado: assim uma correção
 * nas premissas se reflete também nas simulações antigas.
 *
 * IDENTIDADE DA ANÁLISE
 * ---------------------
 * Uma análise tem identidade estável. Recalcular ATUALIZA o registro
 * existente; só "Nova análise" gera `id` novo. Até a v2.1.0 cada
 * clique em Recalcular inseria um registro, e doze cliques consumiam
 * o histórico inteiro — apagando as análises de outros clientes.
 *
 * O rótulo (`referencia`) é etiqueta do contador, não identidade:
 * trocá-lo não cria análise nova.
 */

import {
  gerarId,
  gravarJson,
  lerJson,
  remover,
} from "@/lib/storage";
import {
  simulacaoSalvaSchema,
  TAMANHO_MAX_REFERENCIA,
} from "../schemas/simulacao-schema";
import { VERSAO_REGRAS } from "../domain/calculation-rules";
import type { EntradaSimulacao, SimulacaoSalva } from "../types";

export const CHAVE_ATUAL = "clareza:simulacao:atual";
export const CHAVE_HISTORICO = "clareza:simulacao:historico";

/**
 * O histórico existe para o uso repetido dentro de uma mesma sessão de
 * trabalho — alternar entre cenários de um cliente sem redigitar. Não é
 * um cadastro de clientes: fica no aparelho e é descartável.
 *
 * O limite conta ANÁLISES DISTINTAS, não cliques em Recalcular.
 */
export const LIMITE_HISTORICO = 12;

/** Leitura do histórico, com quantos registros foram descartados. */
export interface LeituraHistorico {
  readonly registros: readonly SimulacaoSalva[];
  /** Registros ilegíveis ou fora do schema, ignorados sem apagar o resto. */
  readonly descartados: number;
}

/** Leitura da análise em edição. */
export interface LeituraAtual {
  readonly registro: SimulacaoSalva | null;
  /** O registro existia mas estava corrompido, e foi descartado. */
  readonly descartado: boolean;
}

/** Resultado de gravar uma análise. */
export interface GravacaoSimulacao {
  readonly registro: SimulacaoSalva;
  /** `false` quando o aparelho recusou a escrita — o cálculo continua válido. */
  readonly persistido: boolean;
  readonly motivo?: "sem-espaco" | "indisponivel";
}

function normalizarReferencia(referencia?: string): string | undefined {
  const limpa = referencia?.trim().slice(0, TAMANHO_MAX_REFERENCIA);
  return limpa ? limpa : undefined;
}

/** Valida um registro cru vindo do aparelho. `null` quando não serve. */
function validar(bruto: unknown): SimulacaoSalva | null {
  const resultado = simulacaoSalvaSchema.safeParse(bruto);
  return resultado.success ? resultado.data : null;
}

/**
 * Lê e revalida o histórico.
 *
 * Um registro corrompido é ignorado; os demais sobrevivem. Nada é
 * apagado na leitura — a lista só é reescrita, já limpa, na próxima
 * gravação.
 */
export function lerHistorico(): LeituraHistorico {
  const bruto = lerJson<unknown>(CHAVE_HISTORICO);
  if (!Array.isArray(bruto)) return { registros: [], descartados: 0 };

  const registros: SimulacaoSalva[] = [];
  let descartados = 0;
  for (const item of bruto) {
    const valido = validar(item);
    if (valido) registros.push(valido);
    else descartados += 1;
  }
  return { registros, descartados };
}

/**
 * Lê e revalida a análise em edição.
 *
 * Função PURA de propósito: ela é o snapshot de `useSyncExternalStore`
 * e apagar a chave aqui seria efeito colateral durante o render. Quem
 * lê recebe `descartado: true` e faz a limpeza fora do render.
 */
export function lerSimulacaoAtual(): LeituraAtual {
  const bruto = lerJson<unknown>(CHAVE_ATUAL);
  if (bruto === null) return { registro: null, descartado: false };

  const valido = validar(bruto);
  if (!valido) return { registro: null, descartado: true };
  return { registro: valido, descartado: false };
}

/** Procura um registro por id, no histórico e na análise em edição. */
function encontrarRegistro(id: string): SimulacaoSalva | null {
  const noHistorico = lerHistorico().registros.find((r) => r.id === id);
  if (noHistorico) return noHistorico;
  const atual = lerSimulacaoAtual().registro;
  return atual && atual.id === id ? atual : null;
}

/**
 * Grava a análise.
 *
 * Com `id` de uma análise existente, ATUALIZA aquele registro:
 * `criadaEm` e `versaoRegras` são preservados, `atualizadaEm` passa a
 * marcar o recálculo. Sem `id`, cria uma análise nova.
 */
export function salvarSimulacao(
  entrada: EntradaSimulacao,
  referencia?: string,
  id?: string | null,
): GravacaoSimulacao {
  const agora = new Date().toISOString();
  const anterior = id ? encontrarRegistro(id) : null;

  const registro: SimulacaoSalva = anterior
    ? {
        id: anterior.id,
        criadaEm: anterior.criadaEm,
        atualizadaEm: agora,
        entrada,
        versaoRegras: anterior.versaoRegras,
        referencia: normalizarReferencia(referencia),
      }
    : {
        /* Identidade preservada mesmo se o registro tiver saído do histórico. */
        id: id ?? gerarId(),
        criadaEm: agora,
        entrada,
        versaoRegras: VERSAO_REGRAS,
        referencia: normalizarReferencia(referencia),
      };

  const semEste = lerHistorico().registros.filter((r) => r.id !== registro.id);
  const historico = [registro, ...semEste].slice(0, LIMITE_HISTORICO);

  const atual = gravarJson(CHAVE_ATUAL, registro);
  const lista = gravarJson(CHAVE_HISTORICO, historico);

  const falha = !atual.sucesso ? atual : !lista.sucesso ? lista : null;
  if (falha && !falha.sucesso) {
    return { registro, persistido: false, motivo: falha.motivo };
  }
  return { registro, persistido: true };
}

/** Promove um registro do histórico a análise em edição. */
export function abrirDoHistorico(id: string): SimulacaoSalva | null {
  const registro = lerHistorico().registros.find((r) => r.id === id);
  if (!registro) return null;
  gravarJson(CHAVE_ATUAL, registro);
  return registro;
}

export function removerDoHistorico(id: string): void {
  const restantes = lerHistorico().registros.filter((r) => r.id !== id);
  gravarJson(CHAVE_HISTORICO, restantes);
  /* Se a análise removida era a que estava aberta, fecha junto. */
  if (lerSimulacaoAtual().registro?.id === id) remover(CHAVE_ATUAL);
}

/** Fecha a análise em edição sem tocar no histórico. */
export function descartarSimulacaoAtual(): void {
  remover(CHAVE_ATUAL);
}

export function limparSimulacoes(): void {
  remover(CHAVE_ATUAL);
  remover(CHAVE_HISTORICO);
}
