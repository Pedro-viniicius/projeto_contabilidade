import type { Metadata } from "next";
import { FormularioFeedback } from "@/features/feedback/components/formulario-feedback";

export const metadata: Metadata = {
  title: "Feedback",
  description:
    "Registre divergências de cálculo, premissas incorretas e problemas de terminologia para orientar a revisão do modelo.",
  alternates: { canonical: "/feedback" },
};

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-4 px-4 py-5 sm:px-6">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-ink">
          Feedback
        </h1>
        <p className="mt-0.5 text-[0.8125rem] text-ink-muted">
          Divergências apontadas aqui orientam a próxima revisão das premissas.
        </p>
      </header>
      <FormularioFeedback />
    </div>
  );
}
