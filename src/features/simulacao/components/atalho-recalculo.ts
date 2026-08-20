/**
 * Regra do atalho de recálculo (Ctrl/Cmd + Enter).
 *
 * Módulo separado, sem React e sem DOM, porque a decisão precisa ser
 * testável: até a v2.1.0 o listener global disparava o cálculo mesmo
 * com o painel de feedback aberto e o foco no textarea. Ctrl+Enter ali
 * é o gesto de "enviar este formulário" — não o de recalcular a
 * análise que está atrás do painel — e cada disparo acidental ainda
 * gravava no histórico.
 *
 * O atalho vale na área de trabalho inteira e em nenhum painel
 * sobreposto. As duas condições são verificadas de forma independente:
 * `gavetaAberta` cobre os nossos painéis, `dentroDeDialogo` cobre
 * qualquer diálogo, inclusive um que venha a existir depois.
 */
export interface ContextoAtalho {
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly key: string;
  /** O alvo do evento está dentro de um `[role="dialog"]`. */
  readonly dentroDeDialogo: boolean;
  /** Há painel lateral aberto na área de trabalho. */
  readonly gavetaAberta: boolean;
}

export function atalhoDeveCalcular(evento: ContextoAtalho): boolean {
  const combinacao =
    (evento.metaKey || evento.ctrlKey) && evento.key === "Enter";
  return combinacao && !evento.dentroDeDialogo && !evento.gavetaAberta;
}
