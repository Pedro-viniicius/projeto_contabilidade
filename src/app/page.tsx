import { redirect } from "next/navigation";

/**
 * A raiz entra direto na área de trabalho. Quem não tiver sessão local
 * é levado de lá para `/login` — a decisão depende do armazenamento do
 * aparelho, que só existe no cliente.
 */
export default function RaizPage() {
  redirect("/workspace");
}
