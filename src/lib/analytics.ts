/**
 * Abstração mínima de analytics.
 *
 * O V1 NÃO integra nenhuma plataforma externa — não há custo, cookie
 * nem dependência. O que existe aqui é o contrato de eventos: quando
 * quisermos PostHog, GA ou um endpoint próprio, basta implementar
 * `enviar` abaixo. Nada no resto do app muda.
 */

export type EventoAnalytics =
  | "simulation_started"
  | "simulation_completed"
  | "simulation_edited"
  | "scenario_compared"
  | "assumptions_viewed"
  | "pwa_install_clicked"
  | "feedback_submitted";

type Propriedades = Record<string, string | number | boolean | null>;

const DEBUG =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true";

export function registrarEvento(
  evento: EventoAnalytics,
  propriedades: Propriedades = {},
): void {
  if (typeof window === "undefined") return;
  if (DEBUG) {
    console.info("[analytics]", evento, propriedades);
  }
  /*
   * Ponto de extensão: aqui entra o envio real.
   * Nunca envie valores financeiros identificáveis do usuário —
   * prefira faixas ou booleanos.
   */
}
