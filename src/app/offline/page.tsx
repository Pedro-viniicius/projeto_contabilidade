import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Você está offline",
  description: "Esta página do Clareza ainda não está disponível offline.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Você está offline
      </h1>
      <p className="mt-3 leading-relaxed text-ink-muted">
        Não conseguimos carregar esta página sem conexão. As telas que você já
        visitou continuam funcionando, e suas simulações estão salvas neste
        aparelho.
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/" tamanho="lg">
          Ir para o início
        </ButtonLink>
        <ButtonLink href="/resultado" variante="secundaria" tamanho="lg">
          Ver última simulação
        </ButtonLink>
      </div>
    </div>
  );
}
