import { redirect } from "next/navigation";

/**
 * Na V2 a simulação tinha rota própria. Na V2.1 ela é a área de
 * trabalho inteira. A rota permanece como redirecionamento para não
 * quebrar endereços salvos, atalhos do PWA instalado e a casca em cache.
 */
export default function SimulacaoPage() {
  redirect("/workspace");
}
