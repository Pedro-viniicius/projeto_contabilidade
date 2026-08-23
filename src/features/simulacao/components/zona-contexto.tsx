"use client";

import { HistoricoSimulacoes } from "./historico-simulacoes";
import { BotaoNovaAnalise } from "./botao-nova-analise";
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
 *
 * As ações estão agrupadas por propósito — começar uma análise,
 * retomar uma anterior, auditar o modelo — em vez de enfileiradas numa
 * régua única de botões equivalentes.
 */
export function ZonaContexto({
  idAtual,
  jaCalculou,
  desatualizado,
  temValoresPreenchidos,
  onAbrirRegistro,
  onNovaAnalise,
  onAbrirPremissas,
  onAbrirEscopo,
  onAbrirFeedback,
}: {
  idAtual?: string | null;
  jaCalculou: boolean;
  desatualizado: boolean;
  temValoresPreenchidos: boolean;
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
      {/*
        Ação de análise, sozinha e no topo: é a que o contador procura
        ao trocar de cliente, e não deve disputar espaço com a leitura
        do status do modelo.
      */}
      <div className="px-3 py-3">
        <BotaoNovaAnalise
          jaCalculou={jaCalculou}
          desatualizado={desatualizado}
          temValoresPreenchidos={temValoresPreenchidos}
          onNovaAnalise={onNovaAnalise}
          tamanho="md"
          className="w-full"
        />
        <p className="mt-1.5 text-[0.6875rem] leading-snug text-ink-subtle">
          Começa uma análise separada. A atual continua no histórico.
        </p>
      </div>

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
        <h2 className="rotulo-secao px-3 py-2">Análises recentes</h2>
        <HistoricoSimulacoes idAtual={idAtual} onAbrir={onAbrirRegistro} />
      </section>

      <section className="py-1">
        <h2 className="rotulo-secao px-3 py-1.5">Auditoria e revisão</h2>
        <AcaoContexto
          onClick={onAbrirPremissas}
          titulo="Ver premissas do modelo"
          descricao="Alíquotas, bases e status de validação."
        />
        <AcaoContexto
          onClick={onAbrirEscopo}
          titulo="Ver escopo do modelo"
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

/**
 * Ação de auditoria: abre um painel sobreposto.
 *
 * `aria-haspopup="dialog"` e a seta à direita dizem, antes do clique,
 * que ali abre um painel — sem isso a linha se parecia com um item de
 * lista informativo.
 */
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
      aria-haspopup="dialog"
      className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-surface-hover"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[0.8125rem] font-medium text-ink">
          {titulo}
        </span>
        <span className="mt-0.5 block text-[0.75rem] leading-snug text-ink-muted">
          {descricao}
        </span>
      </span>
      <span aria-hidden="true" className="shrink-0 text-ink-subtle">
        ›
      </span>
    </button>
  );
}
