"use client";

import { Card, CardTitulo } from "@/components/ui/card";
import { formatarMoeda } from "@/lib/format";
import { registrarEvento } from "@/lib/analytics";
import { listarPremissas, ROTULO_STATUS } from "../domain/calculation-rules";
import { TabelaPremissas } from "./tabela-premissas";
import type { Simulacao } from "../types";

/**
 * "Como chegamos a esse resultado?"
 * Usa <details> nativo: acessível por teclado, funciona sem JS e não
 * carrega estado desnecessário.
 */
export function TransparenciaCalculo({ simulacao }: { simulacao: Simulacao }) {
  const { principal, entrada } = simulacao;
  const premissasDoCenario = listarPremissas().filter(
    (p) =>
      p.grupo === "Geral" ||
      (entrada.tipoAtuacao === "cnpj" ? p.grupo === "CNPJ" : p.grupo === "Pessoa Física"),
  );

  return (
    <Card>
      <CardTitulo>Como chegamos a esse resultado?</CardTitulo>
      <p className="mt-1 text-sm text-ink-muted">
        Nada é caixa-preta. Abaixo estão os valores que você informou, a conta
        feita e as premissas usadas.
      </p>

      <Bloco titulo="Valores que você informou" aberto>
        <dl className="tnum divide-y divide-[var(--border)]">
          <Linha rotulo="Cenário em destaque" valor={principal.nome} />
          <Linha
            rotulo="Receita mensal"
            valor={formatarMoeda(entrada.receitaMensal)}
          />
          <Linha
            rotulo="Custos do negócio"
            valor={formatarMoeda(entrada.custosMensais)}
          />
          {entrada.tipoAtuacao === "cnpj" && (
            <>
              <Linha
                rotulo="Pró-labore"
                valor={formatarMoeda(entrada.proLabore)}
              />
              <Linha
                rotulo="Contabilidade"
                valor={formatarMoeda(entrada.custoContabilidade)}
              />
            </>
          )}
        </dl>
      </Bloco>

      <Bloco titulo="Passo a passo do cálculo">
        <ol className="tnum divide-y divide-[var(--border)]">
          {principal.passos.map((passo) => (
            <li
              key={passo.rotulo}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{passo.rotulo}</p>
                <p className="text-sm text-ink-muted">{passo.formula}</p>
                {passo.premissa && (
                  <p className="mt-0.5 text-xs text-ink-subtle">
                    Premissa: {passo.premissa}
                  </p>
                )}
              </div>
              <p className="shrink-0 font-medium text-ink">
                {formatarMoeda(passo.valor)}
              </p>
            </li>
          ))}
        </ol>
      </Bloco>

      <Bloco titulo="Encargos considerados">
        <ul className="tnum divide-y divide-[var(--border)]">
          {principal.encargos.map((encargo) => (
            <li key={encargo.rotulo} className="py-3">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-sm font-medium text-ink">{encargo.rotulo}</p>
                <p className="shrink-0 font-medium text-ink">
                  {formatarMoeda(encargo.valorMensal)}
                </p>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                {encargo.explicacao}
              </p>
            </li>
          ))}
        </ul>
      </Bloco>

      <Bloco
        titulo="Premissas usadas nesta simulação"
        onAbrir={() => registrarEvento("assumptions_viewed")}
      >
        <TabelaPremissas premissas={premissasDoCenario} />
        <p className="mt-4 text-xs text-ink-subtle">
          Versão das regras: {simulacao.versaoRegras}. Status possíveis:{" "}
          {Object.values(ROTULO_STATUS).join(", ")}.
        </p>
      </Bloco>
    </Card>
  );
}

function Bloco({
  titulo,
  children,
  aberto,
  onAbrir,
}: {
  titulo: string;
  children: React.ReactNode;
  aberto?: boolean;
  onAbrir?: () => void;
}) {
  return (
    <details
      open={aberto}
      onToggle={(e) => {
        if ((e.currentTarget as HTMLDetailsElement).open) onAbrir?.();
      }}
      className="group mt-4 border-t border-border-base pt-4 first-of-type:mt-5"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-1 font-medium text-ink">
        {titulo}
        <span
          aria-hidden="true"
          className="text-ink-subtle transition-transform group-open:rotate-180"
        >
          ▾
        </span>
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-sm text-ink-muted">{rotulo}</dt>
      <dd className="text-sm font-medium text-ink">{valor}</dd>
    </div>
  );
}
