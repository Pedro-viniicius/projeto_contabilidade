import { Card, CardTitulo } from "@/components/ui/card";
import { formatarMoeda } from "@/lib/format";
import { explicarComparacao } from "../domain/explicar";
import type { ResultadoCenario, Simulacao } from "../types";

export function ComparativoCenarios({ simulacao }: { simulacao: Simulacao }) {
  const { comparacao, entrada } = simulacao;

  return (
    <Card>
      <CardTitulo>Pessoa Física ou CNPJ?</CardTitulo>
      <p className="mt-1 text-sm text-ink-muted">
        Mesmos valores de receita e custos, aplicados nos dois cenários.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <ColunaCenario
          cenario={comparacao.pessoaFisica}
          destaque={comparacao.vencedor === "pessoa-fisica"}
          escolhido={entrada.tipoAtuacao === "pessoa-fisica"}
        />
        <ColunaCenario
          cenario={comparacao.cnpj}
          destaque={comparacao.vencedor === "cnpj"}
          escolhido={entrada.tipoAtuacao === "cnpj"}
        />
      </div>

      <div className="mt-5 rounded-xl bg-surface-muted p-4">
        <p className="text-sm leading-relaxed text-ink">
          {explicarComparacao(simulacao)}
        </p>
        {comparacao.vencedor !== null && (
          <dl className="tnum mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <dt className="text-ink-muted">Diferença por mês</dt>
              <dd className="font-semibold text-ink">
                {formatarMoeda(comparacao.diferencaMensal)}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Diferença por ano</dt>
              <dd className="font-semibold text-ink">
                {formatarMoeda(comparacao.diferencaAnual)}
              </dd>
            </div>
          </dl>
        )}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink-muted">
        A escolha entre PF e CNPJ não depende só de imposto: envolve tipo de
        cliente, previdência, contratos e planos futuros. Use este número como
        ponto de partida da conversa com um contador, não como decisão final.
      </p>
    </Card>
  );
}

function ColunaCenario({
  cenario,
  destaque,
  escolhido,
}: {
  cenario: ResultadoCenario;
  destaque: boolean;
  escolhido: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border p-4",
        destaque
          ? "border-accent bg-accent-soft"
          : "border-border-base bg-surface",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-ink">{cenario.nome}</h3>
        {destaque && (
          <span className="shrink-0 rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-white dark:text-[#06120f]">
            Sobra mais
          </span>
        )}
      </div>

      <p className="tnum mt-3 text-2xl font-semibold tracking-tight text-ink">
        {formatarMoeda(cenario.liquidoMensal)}
      </p>
      <p className="text-xs text-ink-muted">líquido por mês</p>

      <dl className="tnum mt-4 space-y-1.5 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-ink-muted">No ano</dt>
          <dd className="text-ink">{formatarMoeda(cenario.liquidoAnual)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-ink-muted">Encargos/mês</dt>
          <dd className="text-ink">
            {formatarMoeda(cenario.encargosMensais)}
          </dd>
        </div>
      </dl>

      {escolhido && (
        <p className="mt-3 text-xs text-ink-subtle">Cenário escolhido por você</p>
      )}
    </div>
  );
}
