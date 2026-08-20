/**
 * Persistência local das simulações.
 *
 * Guardamos a entrada validada, nunca o resultado: assim uma correção
 * nas premissas se reflete também nas simulações antigas.
 */

import { gerarId, gravarJson, lerJson, remover } from "@/lib/storage";
import { simulacaoSchema } from "../schemas/simulacao-schema";
import { VERSAO_REGRAS } from "../domain/calculation-rules";
import type { EntradaSimulacao, SimulacaoSalva } from "../types";

export const CHAVE_ATUAL = "clareza:simulacao:atual";
export const CHAVE_HISTORICO = "clareza:simulacao:historico";

/**
 * O histórico existe para o uso repetido dentro de uma mesma sessão de
 * trabalho — alternar entre cenários de um cliente sem redigitar. Não é
 * um cadastro de clientes: fica no aparelho e é descartável.
 */
const LIMITE_HISTORICO = 12;
const TAMANHO_MAX_REFERENCIA = 60;

function normalizarReferencia(referencia?: string): string | undefined {
  const limpa = referencia?.trim().slice(0, TAMANHO_MAX_REFERENCIA);
  return limpa ? limpa : undefined;
}

export function salvarSimulacao(
  entrada: EntradaSimulacao,
  referencia?: string,
): SimulacaoSalva {
  const registro: SimulacaoSalva = {
    id: gerarId(),
    criadaEm: new Date().toISOString(),
    entrada,
    versaoRegras: VERSAO_REGRAS,
    referencia: normalizarReferencia(referencia),
  };

  gravarJson(CHAVE_ATUAL, registro);
  gravarJson(
    CHAVE_HISTORICO,
    [registro, ...lerHistorico()].slice(0, LIMITE_HISTORICO),
  );

  return registro;
}

/** Lê e revalida — dados de localStorage nunca são confiáveis. */
export function lerSimulacaoAtual(): SimulacaoSalva | null {
  const bruto = lerJson<SimulacaoSalva>(CHAVE_ATUAL);
  if (!bruto) return null;
  const resultado = simulacaoSchema.safeParse(bruto.entrada);
  if (!resultado.success) {
    remover(CHAVE_ATUAL);
    return null;
  }
  return { ...bruto, entrada: resultado.data };
}

export function lerHistorico(): SimulacaoSalva[] {
  const bruto = lerJson<SimulacaoSalva[]>(CHAVE_HISTORICO);
  if (!Array.isArray(bruto)) return [];
  return bruto.filter((r) => simulacaoSchema.safeParse(r?.entrada).success);
}

/** Promove um registro do histórico a simulação em edição. */
export function abrirDoHistorico(id: string): SimulacaoSalva | null {
  const registro = lerHistorico().find((r) => r.id === id);
  if (!registro) return null;
  gravarJson(CHAVE_ATUAL, registro);
  return registro;
}

export function removerDoHistorico(id: string): void {
  gravarJson(
    CHAVE_HISTORICO,
    lerHistorico().filter((r) => r.id !== id),
  );
}

/** Fecha a análise em edição sem tocar no histórico. */
export function descartarSimulacaoAtual(): void {
  remover(CHAVE_ATUAL);
}

export function limparSimulacoes(): void {
  remover(CHAVE_ATUAL);
  remover(CHAVE_HISTORICO);
}
