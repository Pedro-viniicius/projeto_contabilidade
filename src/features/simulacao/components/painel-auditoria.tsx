"use client";

import { resumoValidacao, VERSAO_REGRAS } from "../domain/calculation-rules";

/**
 * ÍNDICE DE AUDITORIA — o que sustenta o número, sob demanda.
 *
 * Até a v2.3 isto ocupava uma coluna permanente de 19,5rem à direita.
 * Era espaço horizontal gasto o dia inteiro com informação que o
 * contador consulta pontualmente — e que saía justamente do lugar onde
 * ele trabalha, o preenchimento e a comparação.
 *
 * Agora abre em painel sobreposto, com a análise visível atrás. Nada
 * foi removido: o estágio de validação continua também no resultado,
 * colado ao número que ele qualifica.
 */
export function PainelAuditoria({
  onAbrirPremissas,
  onAbrirEscopo,
  onAbrirFeedback,
}: {
  onAbrirPremissas: () => void;
  onAbrirEscopo: () => void;
  onAbrirFeedback: () => void;
}) {
  const { total, validadas, pendentes } = resumoValidacao();
  const tudoValidado = pendentes === 0;

  return (
    <div className="space-y-4">
      <section>
        <h3 className="rotulo-secao">Modelo de cálculo</h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-[0.875rem] font-medium text-ink">
          <span
            aria-hidden="true"
            className={`size-2 shrink-0 rounded-full ${
              tudoValidado ? "bg-positivo" : "bg-atencao"
            }`}
          />
          {tudoValidado ? "Revisado" : "Em validação"}
        </p>
        <p className="tnum mt-1 text-[0.8125rem] leading-snug text-ink-muted">
          {validadas} de {total} premissas validadas tecnicamente
          {tudoValidado ? "." : ` · ${pendentes} aguardam revisão contábil.`}
        </p>
        <p className="mt-1.5 text-[0.75rem] text-ink-subtle">
          Versão das regras: {VERSAO_REGRAS}
        </p>
        <p className="mt-1.5 max-w-prose text-[0.75rem] leading-snug text-ink-subtle">
          &ldquo;Validada tecnicamente&rdquo; significa conferida contra a fonte
          legal citada na premissa — não é aprovação contábil da análise.
        </p>
      </section>

      <section className="border-t border-border-base pt-3">
        <h3 className="rotulo-secao mb-1">Abrir detalhamento</h3>
        <div className="-mx-2">
          <AcaoAuditoria
            onClick={onAbrirPremissas}
            titulo="Premissas do modelo"
            descricao="Alíquotas, bases, fontes e estágio de validação, uma a uma."
          />
          <AcaoAuditoria
            onClick={onAbrirEscopo}
            titulo="Escopo do modelo"
            descricao="O que o cálculo cobre e o que ficou explicitamente de fora."
          />
          <AcaoAuditoria
            onClick={onAbrirFeedback}
            titulo="Registrar observação"
            descricao="Divergências apontadas orientam a próxima revisão das regras."
          />
        </div>
      </section>
    </div>
  );
}

/**
 * Entrada de auditoria: abre outro painel sobreposto.
 *
 * `aria-haspopup="dialog"` e a seta à direita dizem, antes do clique,
 * que ali abre um painel — sem isso a linha se parecia com um item de
 * lista informativo.
 */
function AcaoAuditoria({
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
      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface-hover"
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
