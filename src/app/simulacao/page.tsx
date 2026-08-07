import type { Metadata } from "next";
import { WizardSimulacao } from "@/features/simulacao/components/wizard-simulacao";

export const metadata: Metadata = {
  title: "Nova simulação",
  description:
    "Responda quatro perguntas rápidas e veja quanto sobra do seu faturamento como Pessoa Física ou com CNPJ.",
  alternates: { canonical: "/simulacao" },
};

export default function SimulacaoPage() {
  return <WizardSimulacao />;
}
