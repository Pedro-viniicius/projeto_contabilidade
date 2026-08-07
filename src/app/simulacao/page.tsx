import type { Metadata } from "next";
import { WorkspaceSimulacao } from "@/features/simulacao/components/workspace-simulacao";

export const metadata: Metadata = {
  title: "Simulação",
  description:
    "Área de trabalho da simulação: informe receita, custos e pró-labore e compare os cenários Pessoa Física e CNPJ lado a lado.",
  alternates: { canonical: "/simulacao" },
};

export default function SimulacaoPage() {
  return <WorkspaceSimulacao />;
}
