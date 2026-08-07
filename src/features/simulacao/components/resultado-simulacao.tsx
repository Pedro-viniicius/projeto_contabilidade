"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { Card, CardTitulo } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { AvisoContabil } from "@/components/ui/aviso-contabil";
import { formatarMoeda, formatarPercentual } from "@/lib/format";
import { registrarEvento } from "@/lib/analytics";
import { useHidratado, useValorLocal } from "@/lib/armazenamento-reativo";
import { simular } from "../domain/calcular";
import { explicarResultado } from "../domain/explicar";
import {
  CHAVE_ATUAL,
  lerSimulacaoAtual,
} from "../services/simulacao-storage";
import { BarraComposicao } from "./barra-composicao";
import { ComparativoCenarios } from "./comparativo-cenarios";
import { TransparenciaCalculo } from "./transparencia-calculo";

export function ResultadoSimulacao() {
  const hidratado = useHidratado();
  const salva = useValorLocal(CHAVE_ATUAL, lerSimulacaoAtual);

  /*
   * O resultado é sempre recalculado a partir da entrada salva.
   * Assim, uma correção nas premissas vale também para simulações antigas.
   */
  const simulacao = useMemo(
    () => (salva ? simular(salva.entrada) : null),
    [salva],
  );

  useEffect(() => {
    if (!simulacao) return;
    registrarEvento("scenario_compared", {
      vencedor: simulacao.comparacao.vencedor ?? "empate",
    });
  }, [simulacao]);

  if (!hidratado) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <p className="text-ink-muted" role="status">
          Carregando sua simulação…
        </p>
      </div>
    );
  }

  if (!simulacao) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Nenhuma simulação por aqui
        </h1>
        <p className="mt-3 leading-relaxed text-ink-muted">
          Não encontramos uma simulação salva neste dispositivo. Leva menos de
          um minuto para fazer uma.
        </p>
        <ButtonLink href="/simulacao" tamanho="lg" className="mt-6">
          Fazer uma simulação
        </ButtonLink>
      </div>
    );
  }

  const { principal } = simulacao;
  const explicacao = explicarResultado(simulacao);
  const negativo = principal.liquidoMensal < 0;

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <p className="text-sm font-medium text-accent">{principal.nome}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Resultado da simulação
        </h1>
      </header>

      {/* Número herói: a resposta que o usuário veio buscar. */}
      <Card>
        <p className="text-sm text-ink-muted">Resultado líquido estimado</p>
        <p
          className={`tnum mt-1 text-[2.5rem] font-semibold leading-none tracking-tight sm:text-5xl ${
            negativo ? "text-negative" : "text-positive"
          }`}
        >
          {formatarMoeda(principal.liquidoMensal)}
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          por mês ·{" "}
          <span className="tnum text-ink">
            {formatarMoeda(principal.liquidoAnual)}
          </span>{" "}
          projetados em 12 meses
        </p>

        <dl className="tnum mt-6 divide-y divide-[var(--border)] border-t border-border-base">
          <LinhaValor
            rotulo="Receita mensal"
            valor={principal.receitaMensal}
          />
          <LinhaValor
            rotulo="Custos do negócio"
            valor={principal.custosMensais}
            sinal="-"
          />
          <LinhaValor
            rotulo="Encargos estimados"
            valor={principal.encargosMensais}
            sinal="-"
            detalhe={`${formatarPercentual(principal.cargaSobreReceita, 1)} da receita`}
          />
          <LinhaValor
            rotulo="Resultado líquido"
            valor={principal.liquidoMensal}
            destaque
            detalhe={`margem de ${formatarPercentual(principal.margemLiquida, 1)}`}
          />
        </dl>

        <div className="mt-6 border-t border-border-base pt-5">
          <BarraComposicao cenario={principal} />
        </div>
      </Card>

      <Card>
        <CardTitulo>{explicacao.titulo}</CardTitulo>
        <div className="mt-3 space-y-3">
          {explicacao.paragrafos.map((p, i) => (
            <p key={i} className="leading-relaxed text-ink-muted">
              {p}
            </p>
          ))}
        </div>
      </Card>

      <ComparativoCenarios simulacao={simulacao} />

      <TransparenciaCalculo simulacao={simulacao} />

      <Card className="bg-surface-muted">
        <CardTitulo as="h2">E agora?</CardTitulo>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <ButtonLink
            href="/simulacao"
            tamanho="lg"
            className="flex-1"
            onClick={() => registrarEvento("simulation_edited")}
          >
            Editar e recalcular
          </ButtonLink>
          <ButtonLink href="/feedback" variante="secundaria" tamanho="lg">
            Enviar feedback
          </ButtonLink>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink-muted">
          Achou algum número estranho ou um termo confuso? O{" "}
          <Link
            href="/feedback"
            className="text-accent underline underline-offset-4"
          >
            feedback
          </Link>{" "}
          é o que vai orientar a revisão das regras com um contador.
        </p>
      </Card>

      <AvisoContabil className="px-1 pt-2" />
    </div>
  );
}

function LinhaValor({
  rotulo,
  valor,
  sinal,
  detalhe,
  destaque,
}: {
  rotulo: string;
  valor: number;
  sinal?: "-";
  detalhe?: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <div className="min-w-0">
        <dt
          className={
            destaque
              ? "font-medium text-ink"
              : "text-sm text-ink-muted sm:text-base"
          }
        >
          {rotulo}
        </dt>
        {detalhe && <p className="text-xs text-ink-subtle">{detalhe}</p>}
      </div>
      <dd
        className={`shrink-0 ${
          destaque ? "text-lg font-semibold text-ink" : "font-medium text-ink"
        }`}
      >
        {sinal && valor > 0 && (
          <span aria-hidden="true" className="text-ink-subtle">
            −{" "}
          </span>
        )}
        {formatarMoeda(valor)}
      </dd>
    </div>
  );
}
