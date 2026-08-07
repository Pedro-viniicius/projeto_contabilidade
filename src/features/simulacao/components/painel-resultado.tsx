"use client";

import Link from "next/link";
import { useState } from "react";
import { Painel, PainelCabecalho } from "@/components/ui/painel";
import { Badge } from "@/components/ui/badge";
import { formatarMoeda } from "@/lib/format";
import { registrarEvento } from "@/lib/analytics";
import { TabelaComparativa } from "./tabela-comparativa";
import { DetalheEncargos, PassosCalculo } from "./detalhe-encargos";
import type { Simulacao } from "../types";

type Aba = "pessoa-fisica" | "cnpj";

export function PainelResultado({
  simulacao,
  desatualizado,
}: {
  simulacao: Simulacao;
  /** Os campos mudaram desde o último cálculo. */
  desatualizado: boolean;
}) {
  const { comparacao } = simulacao;
  const [aba, setAba] = useState<Aba>(simulacao.entrada.tipoAtuacao);

  const melhor =
    comparacao.vencedor === "cnpj"
      ? comparacao.cnpj
      : comparacao.vencedor === "pessoa-fisica"
        ? comparacao.pessoaFisica
        : null;

  const cenarioDaAba =
    aba === "cnpj" ? comparacao.cnpj : comparacao.pessoaFisica;

  return (
    <div className="space-y-3">
      {/* Resumo: a resposta em uma frase, antes do detalhamento. */}
      <Painel
        className={desatualizado ? "opacity-60 transition-opacity" : undefined}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5">
          <div className="min-w-0">
            <span className="rotulo-secao">Diferença estimada</span>
            {melhor ? (
              <>
                <p className="mt-1.5 text-[0.9375rem] leading-snug text-ink">
                  <strong className="font-semibold">{melhor.nome}</strong>{" "}
                  apresenta resultado líquido estimado{" "}
                  <strong className="tnum font-semibold">
                    {formatarMoeda(comparacao.diferencaMensal)}
                  </strong>{" "}
                  maior por mês.
                </p>
                <p className="tnum mt-1 text-[0.8125rem] text-ink-muted">
                  Impacto anual estimado:{" "}
                  <span className="font-medium text-ink">
                    {formatarMoeda(comparacao.diferencaAnual)}
                  </span>
                </p>
              </>
            ) : (
              <p className="mt-1.5 text-[0.9375rem] text-ink">
                Os dois cenários apresentam o mesmo resultado líquido estimado.
              </p>
            )}
          </div>

          {desatualizado && (
            <Badge tom="atencao" ponto>
              Valores alterados
            </Badge>
          )}
        </div>

        <div className="border-t border-border-base">
          <TabelaComparativa comparacao={comparacao} />
        </div>

        <p className="border-t border-border-base px-4 py-2.5 text-[0.75rem] leading-snug text-ink-subtle">
          Estimativa baseada em premissas simplificadas e ainda não validadas
          por profissional de contabilidade. Um resultado maior não constitui
          recomendação de enquadramento.
        </p>
      </Painel>

      {/* Auditoria: composição por cenário e passo a passo. */}
      <Painel>
        <PainelCabecalho
          titulo="Composição do cálculo"
          descricao="Base de cálculo, alíquota aplicada e status de validação de cada premissa."
          acoes={
            <Link
              href="/premissas"
              className="rounded-sm text-[0.8125rem] text-accent hover:underline"
            >
              Painel de premissas
            </Link>
          }
        />

        {/* Um seletor só: escolhe o cenário e mostra tudo dele de uma vez. */}
        <div
          role="tablist"
          aria-label="Cenário detalhado"
          className="flex gap-1 border-b border-border-base px-2 pt-2"
        >
          {(
            [
              ["pessoa-fisica", "Pessoa Física"],
              ["cnpj", "CNPJ"],
            ] as const
          ).map(([id, rotulo]) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={aba === id}
              onClick={() => {
                setAba(id);
                registrarEvento("assumptions_viewed", { cenario: id });
              }}
              className={[
                "min-h-8 rounded-t-md px-2.5 text-[0.8125rem] transition-colors",
                aba === id
                  ? "border-b-2 border-accent font-medium text-ink"
                  : "border-b-2 border-transparent text-ink-muted hover:text-ink",
              ].join(" ")}
            >
              {rotulo}
            </button>
          ))}
        </div>

        <DetalheEncargos cenario={cenarioDaAba} />

        <p className="rotulo-secao border-t border-border-base px-4 pb-1.5 pt-3">
          Passo a passo — {cenarioDaAba.nome}
        </p>
        <PassosCalculo cenario={cenarioDaAba} />
      </Painel>
    </div>
  );
}
