import type { Metadata } from "next";
import { FormularioFeedback } from "@/features/feedback/components/formulario-feedback";

export const metadata: Metadata = {
  title: "Enviar feedback",
  description:
    "Aponte cálculos incorretos, termos confusos ou premissas contábeis erradas para orientar a próxima versão do Clareza.",
  alternates: { canonical: "/feedback" },
};

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Seu feedback orienta a próxima versão
        </h1>
        <p className="mt-3 leading-relaxed text-ink-muted">
          Esta é uma versão em validação. Se algum número parece errado, um
          termo ficou confuso ou falta uma informação importante, registre
          aqui — é isso que vai virar pauta na revisão com o contador.
        </p>
      </header>

      <FormularioFeedback />
    </div>
  );
}
