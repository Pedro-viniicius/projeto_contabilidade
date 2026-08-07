import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Painel } from "@/components/ui/painel";

export const metadata: Metadata = {
  title: "Sem conexão",
  description: "Esta tela do Clareza ainda não está disponível offline.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-6">
      <Painel className="px-4 py-12 text-center">
        <h1 className="text-base font-semibold tracking-tight text-ink">
          Sem conexão
        </h1>
        <p className="mx-auto mt-1.5 max-w-md text-[0.8125rem] leading-relaxed text-ink-muted">
          Esta tela não estava em cache. As telas já visitadas seguem
          funcionando, e as simulações continuam salvas neste aparelho.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <ButtonLink href="/">Visão geral</ButtonLink>
          <ButtonLink href="/simulacao" variante="secundaria">
            Simulação
          </ButtonLink>
        </div>
      </Painel>
    </div>
  );
}
