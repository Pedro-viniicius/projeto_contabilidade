import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Painel } from "@/components/ui/painel";
import { HistoricoSimulacoes } from "@/features/simulacao/components/historico-simulacoes";
import {
  resumoValidacao,
  VERSAO_REGRAS,
} from "@/features/simulacao/domain/calculation-rules";

export const metadata: Metadata = {
  title: "Visão geral",
  description:
    "Área de trabalho do Clareza: inicie uma simulação, retome as recentes e acompanhe o estágio de validação do modelo de cálculo.",
  alternates: { canonical: "/" },
};

const ACESSOS = [
  {
    href: "/premissas",
    titulo: "Premissas de cálculo",
    descricao: "Auditar alíquotas, bases e status de validação.",
  },
  {
    href: "/como-funciona",
    titulo: "Escopo do modelo",
    descricao: "O que o cálculo cobre e o que está fora desta versão.",
  },
  {
    href: "/feedback",
    titulo: "Feedback",
    descricao: "Registrar divergências e exportar para revisão.",
  },
];

export default function VisaoGeralPage() {
  const { pendentes, total } = resumoValidacao();

  return (
    <div className="mx-auto max-w-[1500px] space-y-4 px-4 py-5 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">
            Visão geral
          </h1>
          <p className="mt-0.5 text-[0.8125rem] text-ink-muted">
            Compare cenários tributários com base nos dados informados.
          </p>
        </div>
        <ButtonLink href="/simulacao" tamanho="lg">
          Nova simulação
        </ButtonLink>
      </header>

      <HistoricoSimulacoes />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Painel>
          <div className="grid sm:grid-cols-3">
            {ACESSOS.map((acesso, i) => (
              <Link
                key={acesso.href}
                href={acesso.href}
                className={[
                  "px-4 py-3.5 transition-colors hover:bg-surface-hover",
                  i > 0 ? "border-t border-border-base sm:border-l sm:border-t-0" : "",
                ].join(" ")}
              >
                <span className="block text-[0.875rem] font-medium text-ink">
                  {acesso.titulo}
                </span>
                <span className="mt-0.5 block text-[0.8125rem] leading-snug text-ink-muted">
                  {acesso.descricao}
                </span>
              </Link>
            ))}
          </div>
        </Painel>

        <Painel className="px-4 py-3.5">
          <span className="rotulo-secao">Estágio do modelo</span>
          <p className="mt-1.5 flex items-center gap-1.5 text-[0.875rem] font-medium text-ink">
            <span
              aria-hidden="true"
              className={`size-2 shrink-0 rounded-full ${
                pendentes === 0 ? "bg-positivo" : "bg-atencao"
              }`}
            />
            {pendentes === 0 ? "Validado" : "Em validação"}
          </p>
          <p className="mt-1 text-[0.8125rem] leading-snug text-ink-muted">
            {pendentes === 0
              ? `As ${total} premissas foram revisadas.`
              : `${pendentes} de ${total} premissas aguardam revisão contábil. Os resultados são estimativas, não apuração fiscal.`}
          </p>
          <p className="mt-2 text-[0.75rem] text-ink-subtle">
            Regras: {VERSAO_REGRAS}
          </p>
          <ButtonLink
            href="/premissas"
            variante="secundaria"
            tamanho="sm"
            className="mt-3"
          >
            Abrir painel de premissas
          </ButtonLink>
        </Painel>
      </div>
    </div>
  );
}
