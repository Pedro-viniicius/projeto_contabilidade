import { redirect } from "next/navigation";

/**
 * Na V1 o resultado era uma página separada. Na V2 ele vive na área de
 * trabalho, junto do formulário. A rota permanece para não quebrar
 * links salvos, o atalho instalado do PWA e a casca em cache.
 */
export default function ResultadoPage() {
  redirect("/simulacao");
}
