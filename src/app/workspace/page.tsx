import type { Metadata } from "next";
import { AreaDeTrabalho } from "@/features/simulacao/components/area-de-trabalho";

export const metadata: Metadata = {
  title: "Área de trabalho",
  description:
    "Área de trabalho do contador: dados da análise, comparativo Pessoa Física × CNPJ, composição dos encargos, premissas e histórico em uma única tela.",
  alternates: { canonical: "/workspace" },
  robots: { index: false, follow: false },
};

export default function WorkspacePage() {
  return <AreaDeTrabalho />;
}
