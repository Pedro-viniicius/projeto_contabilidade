import type { Metadata } from "next";
import { Painel } from "@/components/ui/painel";
import { ButtonLink } from "@/components/ui/button";
import { PainelPremissas } from "@/features/simulacao/components/painel-premissas";
import {
  resumoValidacao,
  VERSAO_REGRAS,
} from "@/features/simulacao/domain/calculation-rules";

export const metadata: Metadata = {
  title: "Premissas",
  description:
    "Painel de auditoria das regras de cálculo do Clareza: alíquotas, bases, justificativas e status de validação de cada premissa.",
  alternates: { canonical: "/premissas" },
};

export default function PremissasPage() {
  const { total, pendentes, porStatus } = resumoValidacao();

  const indicadores = [
    { rotulo: "Premissas no modelo", valor: total },
    { rotulo: "Hipóteses temporárias", valor: porStatus["hipotese-temporaria"] },
    { rotulo: "A validar", valor: porStatus["a-validar"] },
    { rotulo: "Validadas", valor: porStatus["validada-tecnicamente"] },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-4 px-4 py-5 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">
            Premissas de cálculo
          </h1>
          <p className="mt-0.5 text-[0.8125rem] text-ink-muted">
            Auditoria das regras usadas pelo motor · versão {VERSAO_REGRAS}
          </p>
        </div>
        <ButtonLink href="/feedback" variante="secundaria">
          Registrar divergência
        </ButtonLink>
      </header>

      <Painel>
        <dl className="grid grid-cols-2 sm:grid-cols-4">
          {indicadores.map((ind, i) => (
            <div
              key={ind.rotulo}
              className={[
                "px-4 py-3",
                i % 2 === 1 ? "border-l border-border-base" : "",
                i >= 2 ? "border-t border-border-base sm:border-t-0" : "",
                i === 2 ? "sm:border-l" : "",
              ].join(" ")}
            >
              <dt className="rotulo-secao">{ind.rotulo}</dt>
              <dd className="tnum mt-1 text-xl font-semibold text-ink">
                {ind.valor}
              </dd>
            </div>
          ))}
        </dl>
      </Painel>

      {pendentes > 0 && (
        <Painel className="border-l-2 border-l-atencao bg-atencao-soft px-4 py-3">
          <p className="text-[0.8125rem] leading-relaxed text-ink">
            <strong className="font-semibold">
              {pendentes} de {total} premissas ainda não foram revisadas por um
              contador.
            </strong>{" "}
            Os valores são referências escolhidas para tornar o modelo
            compreensível e fácil de corrigir — não constituem apuração fiscal.
            A simplificação mais relevante é a alíquota efetiva única sobre o
            faturamento no cenário CNPJ, no lugar das tabelas do Simples
            Nacional.
          </p>
        </Painel>
      )}

      <PainelPremissas />
    </div>
  );
}
