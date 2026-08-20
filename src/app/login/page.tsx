import type { Metadata } from "next";
import { TelaLogin } from "@/features/sessao/components/tela-login";

export const metadata: Metadata = {
  title: "Acesso",
  description:
    "Acesse a área de trabalho do Clareza. Ambiente demonstrativo: não há autenticação em servidor nesta versão.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return <TelaLogin />;
}
