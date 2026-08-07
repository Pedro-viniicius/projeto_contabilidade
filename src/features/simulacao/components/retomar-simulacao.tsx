"use client";

import Link from "next/link";
import { useValorLocal } from "@/lib/armazenamento-reativo";
import { formatarData, formatarMoeda } from "@/lib/format";
import {
  CHAVE_ATUAL,
  lerSimulacaoAtual,
} from "../services/simulacao-storage";

/**
 * Atalho para a última simulação guardada no dispositivo.
 * Some quando não há histórico — a home continua limpa para quem chega
 * pela primeira vez.
 */
export function RetomarSimulacao() {
  const salva = useValorLocal(CHAVE_ATUAL, lerSimulacaoAtual);

  if (!salva) return null;

  return (
    <Link
      href="/resultado"
      className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-border-base bg-surface p-4 transition-colors hover:bg-surface-muted"
    >
      <span>
        <span className="block text-sm font-medium text-ink">
          Retomar última simulação
        </span>
        <span className="tnum mt-0.5 block text-sm text-ink-muted">
          {formatarMoeda(salva.entrada.receitaMensal)} por mês ·{" "}
          {formatarData(salva.criadaEm)}
        </span>
      </span>
      <span aria-hidden="true" className="text-ink-subtle">
        →
      </span>
    </Link>
  );
}
