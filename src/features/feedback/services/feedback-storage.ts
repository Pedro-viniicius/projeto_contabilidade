/**
 * Armazenamento local do feedback.
 *
 * O formato do registro já é o payload que uma API futura receberia
 * (`POST /api/feedback`), então migrar para servidor é trocar a
 * implementação de `salvarFeedback` — nada mais.
 */

import { gerarId, gravarJson, lerJson, remover } from "@/lib/storage";
import { VERSAO_REGRAS } from "@/features/simulacao/domain/calculation-rules";
import {
  feedbackRegistradoSchema,
  type EntradaFeedback,
} from "../schemas/feedback-schema";
import type { EntradaSimulacao } from "@/features/simulacao/types";

export const CHAVE_FEEDBACK = "clareza:feedback";
const CHAVE = CHAVE_FEEDBACK;
const LIMITE = 50;

export interface FeedbackRegistrado {
  readonly id: string;
  readonly criadoEm: string;
  readonly categoria: string;
  readonly mensagem: string;
  readonly contato?: string;
  /** Contexto técnico que ajuda a reproduzir o problema relatado. */
  readonly contexto: {
    readonly versaoRegras: string;
    readonly rota: string;
    /** Entrada da simulação vigente, quando existir. */
    readonly entradaSimulacao: EntradaSimulacao | null;
  };
}

/** Resultado de registrar uma observação neste aparelho. */
export type GravacaoFeedback =
  | { readonly sucesso: true; readonly registro: FeedbackRegistrado }
  | { readonly sucesso: false; readonly motivo: "sem-espaco" | "indisponivel" };

/**
 * Registra a observação.
 *
 * Devolve falha quando o aparelho recusa a escrita — não faz sentido
 * dizer "observação registrada" para um material que existe só para
 * ser levado à revisão contábil depois.
 */
export function salvarFeedback(
  entrada: EntradaFeedback,
  contexto: { rota: string; entradaSimulacao: EntradaSimulacao | null },
): GravacaoFeedback {
  const registro: FeedbackRegistrado = {
    id: gerarId(),
    criadoEm: new Date().toISOString(),
    categoria: entrada.categoria,
    mensagem: entrada.mensagem,
    contato: entrada.contato || undefined,
    contexto: { versaoRegras: VERSAO_REGRAS, ...contexto },
  };

  const anteriores = lerFeedbacks();
  const gravacao = gravarJson(CHAVE, [registro, ...anteriores].slice(0, LIMITE));
  if (!gravacao.sucesso) return { sucesso: false, motivo: gravacao.motivo };
  return { sucesso: true, registro };
}

/** Lê e revalida o registro inteiro — não só os campos de formulário. */
export function lerFeedbacks(): FeedbackRegistrado[] {
  const bruto = lerJson<unknown>(CHAVE);
  if (!Array.isArray(bruto)) return [];

  const validos: FeedbackRegistrado[] = [];
  for (const item of bruto) {
    const resultado = feedbackRegistradoSchema.safeParse(item);
    if (resultado.success) {
      validos.push(resultado.data as FeedbackRegistrado);
    }
  }
  return validos;
}

export function limparFeedbacks(): void {
  remover(CHAVE);
}

/** Exportação em JSON para levar o material à conversa com o contador. */
export function exportarFeedbacks(): string {
  return JSON.stringify(lerFeedbacks(), null, 2);
}
