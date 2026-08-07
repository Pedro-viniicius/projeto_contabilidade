/**
 * Persistência local das simulações.
 * A entrada validada é o que guardamos — o resultado é sempre recalculado,
 * assim uma correção nas premissas se reflete nas simulações antigas.
 */

import { gerarId, gravarJson, lerJson, remover } from "@/lib/storage";
import { simulacaoSchema } from "../schemas/simulacao-schema";
import { VERSAO_REGRAS } from "../domain/calculation-rules";
import type { EntradaSimulacao, SimulacaoSalva } from "../types";

export const CHAVE_ATUAL = "clareza:simulacao:atual";
const CHAVE_HISTORICO = "clareza:simulacao:historico";
const LIMITE_HISTORICO = 5;

export function salvarSimulacao(entrada: EntradaSimulacao): SimulacaoSalva {
  const registro: SimulacaoSalva = {
    id: gerarId(),
    criadaEm: new Date().toISOString(),
    entrada,
    versaoRegras: VERSAO_REGRAS,
  };

  gravarJson(CHAVE_ATUAL, registro);

  const historico = lerHistorico();
  gravarJson(
    CHAVE_HISTORICO,
    [registro, ...historico].slice(0, LIMITE_HISTORICO),
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

export function limparSimulacoes(): void {
  remover(CHAVE_ATUAL);
  remover(CHAVE_HISTORICO);
}
