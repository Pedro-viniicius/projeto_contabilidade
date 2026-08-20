"use client";

import { HistoricoSimulacoes } from "./historico-simulacoes";
import {
  resumoValidacao,
  VERSAO_REGRAS,
} from "../domain/calculation-rules";

/**
 * Coluna de contexto profissional.
 *
 * Reúne o que acompanha a análise sem competir com ela: estágio de
 * validação do modelo, análises recentes e os painéis de auditoria.
 * A partir de 1280px fica fixa à direita; abaixo disso, o mesmo
 * conteúdo abre como painel lateral pela barra superior.
 */
export function ZonaContexto({
  idAtual,
  onAbrirRegistro,
  onNovaAnalise,
  onAbrirPremissas,
  onAbrirEscopo,
  onAbrirFeedback,
}: {
  idAtual?: string | null;
  onAbrirRegistro: (id: string) => void;
  onNovaAnalise: () => void;
  onAbrirPremissas: () => void;
  onAbrirEscopo: () => void;
  onAbrirFeedback: () => void;
}) {
  const { pendentes, total } = resumoValidacao();
  const tudoValidado = pendentes === 0;

  return (
    <div className="divide-y divide-[var(--border)]">
      <section className="px-3 py-3">
        <h2 className="rotulo-secao">Modelo de cálculo</h2>
        <p className="mt-1.5 flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink">
          <span
            aria-hidden="true"
            className={`size-2 shrink-0 rounded-full ${
              tudoValidado ? "bg-positivo" : "bg-atencao"
            }`}
          />
          {tudoValidado ? "Validado" : "Em validação"}
        </p>
        <p className="mt-1 text-[0.75rem] leading-snug text-ink-muted">
          {tudoValidado
            ? `As ${total} premissas foram revisadas.`
            : `${pendentes} de ${total} premissas aguardam revisão contábil.`}
        </p>
        <p className="mt-1.5 text-[0.6875rem] text-ink-subtle">
          Regras {VERSAO_REGRAS}
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <h2 className="rotulo-secao">Análises recentes</h2>
          <button
            type="button"
            onClick={onNovaAnalise}
            className="rounded-sm text-[0.75rem] text-accent hover:underline"
          >
            Nova
          </button>
        </div>
        <HistoricoSimulacoes idAtual={idAtual} onAbrir={onAbrirRegistro} />
      </section>

      <section className="py-1">
        <h2 className="rotulo-secao px-3 py-1.5">Auditoria e revisão</h2>
        <AcaoContexto
          onClick={onAbrirPremissas}
          titulo="Premissas do modelo"
          descricao="Alíquotas, bases e status de validação."
        />
        <AcaoContexto
          onClick={onAbrirEscopo}
          titulo="Escopo do modelo"
          descricao="O que o cálculo cobre e o que ficou fora."
        />
        <AcaoContexto
          onClick={onAbrirFeedback}
          titulo="Registrar observação"
          descricao="Divergências apontadas orientam a revisão."
        />
      </section>
    </div>
  );
}

function AcaoContexto({
  titulo,
  descricao,
  onClick,
}: {
  titulo: string;
  descricao: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full px-3 py-2 text-left transition-colors hover:bg-surface-hover"
    >
      <span className="block text-[0.8125rem] font-medium text-ink">
        {titulo}
      </span>
      <span className="mt-0.5 block text-[0.75rem] leading-snug text-ink-muted">
        {descricao}
      </span>
    </button>
  );
}
