/**
 * Armazenamento local do feedback.
 *
 * O formato do registro já é o payload que uma API futura receberia
 * (`POST /api/feedback`), então migrar para servidor é trocar a
 * implementação de `salvarFeedback` — nada mais.
 */

import { gerarId, gravarJson, lerJson, remover } from "@/lib/storage";
import { VERSAO_REGRAS } from "@/features/simulacao/domain/calculation-rules";
import { feedbackSchema, type EntradaFeedback } from "../schemas/feedback-schema";
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

export function salvarFeedback(
  entrada: EntradaFeedback,
  contexto: { rota: string; entradaSimulacao: EntradaSimulacao | null },
): FeedbackRegistrado {
  const registro: FeedbackRegistrado = {
    id: gerarId(),
    criadoEm: new Date().toISOString(),
    categoria: entrada.categoria,
    mensagem: entrada.mensagem,
    contato: entrada.contato || undefined,
    contexto: { versaoRegras: VERSAO_REGRAS, ...contexto },
  };

  const anteriores = lerFeedbacks();
  gravarJson(CHAVE, [registro, ...anteriores].slice(0, LIMITE));
  return registro;
}

export function lerFeedbacks(): FeedbackRegistrado[] {
  const bruto = lerJson<FeedbackRegistrado[]>(CHAVE);
  if (!Array.isArray(bruto)) return [];
  return bruto.filter(
    (f) =>
      feedbackSchema.safeParse({
        categoria: f?.categoria,
        mensagem: f?.mensagem,
        contato: f?.contato ?? "",
      }).success,
  );
}

export function limparFeedbacks(): void {
  remover(CHAVE);
}

/** Exportação em JSON para levar o material à conversa com o contador. */
export function exportarFeedbacks(): string {
  return JSON.stringify(lerFeedbacks(), null, 2);
}
