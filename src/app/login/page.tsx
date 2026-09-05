import type { Metadata } from "next";
import { TelaLogin } from "@/features/sessao/components/tela-login";

export const metadata: Metadata = {
  title: "Acesso",
  description:
    "Entre na área de trabalho do Clareza e compare cenários Pessoa Física e CNPJ. Ambiente de demonstração: as análises ficam salvas apenas neste navegador.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return <TelaLogin />;
}
