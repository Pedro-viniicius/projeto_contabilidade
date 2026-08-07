import type { Metadata } from "next";
import { ResultadoSimulacao } from "@/features/simulacao/components/resultado-simulacao";

export const metadata: Metadata = {
  title: "Resultado da simulação",
  description:
    "Resultado líquido estimado, comparativo entre Pessoa Física e CNPJ e o passo a passo do cálculo.",
  alternates: { canonical: "/resultado" },
  /* Página pessoal, dependente de dados locais: não faz sentido indexar. */
  robots: { index: false, follow: true },
};

export default function ResultadoPage() {
  return <ResultadoSimulacao />;
}
