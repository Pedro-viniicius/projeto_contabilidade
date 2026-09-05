import type { TomBadge } from "@/components/ui/badge";
import type { StatusPremissa } from "../domain/calculation-rules";

/**
 * Tom da etiqueta para cada estágio de validação.
 *
 * Fonte única: até a v2.3 o mesmo mapa existia em dois componentes, e
 * bastava um deles ser editado para o mesmo status aparecer âmbar num
 * painel e neutro no outro — dizendo coisas diferentes sobre a mesma
 * premissa.
 *
 * "A validar" é NEUTRO de propósito: é o estado normal de uma premissa
 * em revisão, não um alerta. Âmbar fica reservado à hipótese
 * temporária, que é onde o número pode realmente mudar.
 */
export const TOM_STATUS: Record<StatusPremissa, TomBadge> = {
  "hipotese-temporaria": "atencao",
  "a-validar": "neutro",
  "validada-tecnicamente": "positivo",
  "nao-aplicavel": "neutro",
};
