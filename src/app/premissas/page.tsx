import { redirect } from "next/navigation";

/**
 * As premissas deixaram de ser página e viraram painel lateral. O
 * parâmetro abre o painel já na chegada, preservando o atalho do PWA.
 */
export default function PremissasPage() {
  redirect("/workspace?painel=premissas");
}
