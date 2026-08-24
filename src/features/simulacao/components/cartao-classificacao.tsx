"use client";

import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ROTULO_STATUS, type Anexo } from "../domain/calculation-rules";
import {
  explicarBloqueio,
  type Classificacao,
} from "../domain/classificacao";
import { EtiquetaAnexo } from "./seletor-atividade";

const ANEXOS: readonly Anexo[] = ["I", "II", "III", "IV", "V"];

const percentual = (v: number) =>
  `${(v * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;

const moeda = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

/**
 * RECONHECIMENTO — o que o sistema concluiu sobre o enquadramento.
 *
 * Fica entre a atividade e os valores porque é essa a ordem do
 * raciocínio: identificar, enquadrar, e só então perguntar números.
 *
 * Nada é decidido aqui. Todos os campos vêm prontos do domínio,
 * inclusive o motivo — o que garante que o anexo exibido é exatamente
 * o que produziu o resultado ao lado.
 */
export function CartaoClassificacao({
  classificacao,
  onAnexoManual,
  onMotivoManual,
}: {
  classificacao: Classificacao;
  onAnexoManual: (anexo: Anexo | null) => void;
  onMotivoManual: (motivo: string) => void;
}) {
  const id = useId();
  const [detalheAberto, setDetalhe] = useState(false);
  const [manualAberto, setManual] = useState(false);

  const { atividade, anexo, fatorR, bloqueio, manual } = classificacao;

  return (
    <section
      aria-label="Enquadramento tributário"
      className="rounded-md border border-border-strong bg-surface-muted"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-2">
        <div className="flex items-center gap-1.5">
          <span className="rotulo-secao">Enquadramento</span>
          {anexo ? (
            <EtiquetaAnexo anexo={anexo} manual={manual} />
          ) : (
            <Badge tom="atencao" ponto>
              Classificação pendente
            </Badge>
          )}
        </div>

        {atividade && (
          <Badge tom="neutro">{ROTULO_STATUS[atividade.status]}</Badge>
        )}
      </div>

      <dl className="grid gap-1 border-t border-border-base px-2.5 py-2 text-[0.75rem]">
        <Linha
          termo="Anexos possíveis"
          valor={
            classificacao.anexosPossiveis.length > 0
              ? classificacao.anexosPossiveis
                  .map((a) => `Anexo ${a}`)
                  .join(" ou ")
              : "Indeterminado"
          }
        />
        <Linha
          termo="Fator R"
          valor={
            !classificacao.sujeitaFatorR
              ? "Não se aplica"
              : fatorR?.valor === null || fatorR === null
                ? "Sem receita de 12 meses para apurar"
                : `${percentual(fatorR.valor)} — limite ${percentual(
                    fatorR.limite,
                  )}`
          }
        />
      </dl>

      {/*
        "Por que esta classificação?" é recurso de auditoria, não
        enfeite: é o que permite ao contador conferir a decisão antes de
        confiar no número. Recolhido por padrão para não competir com o
        preenchimento.
      */}
      <div className="border-t border-border-base">
        <button
          type="button"
          onClick={() => setDetalhe((a) => !a)}
          aria-expanded={detalheAberto}
          aria-controls={`${id}-detalhe`}
          className="alvo-toque flex min-h-9 w-full items-center gap-1.5 px-2.5 text-left text-[0.75rem] text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
        >
          <span
            aria-hidden="true"
            className={`shrink-0 text-ink-subtle transition-transform ${
              detalheAberto ? "rotate-90" : ""
            }`}
          >
            ›
          </span>
          Por que esta classificação?
        </button>

        {detalheAberto && (
          <div
            id={`${id}-detalhe`}
            className="space-y-2 border-t border-border-base px-2.5 py-2 text-[0.75rem] leading-relaxed text-ink-muted"
          >
            <p>{classificacao.motivo}</p>

            {manual && classificacao.motivoManual && (
              <p>
                <span className="font-medium text-ink">Justificativa: </span>
                {classificacao.motivoManual}
              </p>
            )}

            {fatorR && fatorR.valor !== null && (
              <dl className="grid gap-1 border-t border-border-base pt-2">
                <Linha
                  termo="Folha de 12 meses"
                  valor={moeda(fatorR.folha12m)}
                />
                <Linha
                  termo="Receita de 12 meses"
                  valor={`${moeda(fatorR.rbt12)}${
                    fatorR.rbt12Projetada ? " (projetada)" : ""
                  }`}
                />
              </dl>
            )}

            {fatorR?.rbt12Projetada && (
              <p className="text-atencao">
                A receita de 12 meses não foi informada: projetamos a receita
                mensal por 12. Informe a RBT12 real para um enquadramento
                confiável.
              </p>
            )}

            {atividade && (
              <p className="border-t border-border-base pt-2 text-ink-subtle">
                <span className="font-medium">Fonte: </span>
                {atividade.fonte.referencia} · conferência de{" "}
                {atividade.fonte.ano}.
              </p>
            )}
          </div>
        )}
      </div>

      {bloqueio && (
        <p
          role="status"
          className="flex items-start gap-1.5 border-t border-border-base px-2.5 py-2 text-[0.75rem] leading-snug text-atencao"
        >
          <span aria-hidden="true">⚠</span>
          <span>{explicarBloqueio(bloqueio, anexo)}</span>
        </p>
      )}

      {/* ---------- Classificação manual ---------- */}
      <div className="border-t border-border-base px-2.5 py-2">
        {manual ? (
          <div className="space-y-2">
            <p className="text-[0.75rem] leading-snug text-ink-muted">
              Anexo definido manualmente. A análise fica marcada como
              classificação manual, no histórico e na auditoria.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <SeletorAnexo
                valor={classificacao.anexo}
                onChange={(a) => onAnexoManual(a)}
              />
              <button
                type="button"
                onClick={() => {
                  onAnexoManual(null);
                  onMotivoManual("");
                  setManual(false);
                }}
                className="alvo-toque rounded-sm border border-border-base px-1.5 py-0.5 text-[0.75rem] text-ink-muted transition-colors hover:border-border-strong hover:bg-surface hover:text-ink"
              >
                Voltar ao automático
              </button>
            </div>
            <label className="block">
              <span className="text-[0.75rem] text-ink-muted">
                Motivo (opcional)
              </span>
              <input
                type="text"
                maxLength={140}
                value={classificacao.motivoManual ?? ""}
                onChange={(e) => onMotivoManual(e.target.value)}
                placeholder="Ex.: folha do cliente muda no próximo trimestre"
                className="mt-1 min-h-9 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-[0.8125rem] text-ink placeholder:text-ink-subtle"
              />
            </label>
          </div>
        ) : manualAberto ? (
          <div className="flex flex-wrap items-center gap-2">
            <SeletorAnexo valor={null} onChange={(a) => onAnexoManual(a)} />
            <button
              type="button"
              onClick={() => setManual(false)}
              className="alvo-toque rounded-sm border border-transparent px-1.5 py-0.5 text-[0.75rem] text-ink-muted transition-colors hover:border-border-strong hover:bg-surface"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setManual(true)}
            className="alvo-toque rounded-sm border border-border-base px-1.5 py-0.5 text-[0.75rem] text-ink-muted transition-colors hover:border-border-strong hover:bg-surface hover:text-ink"
          >
            Definir anexo manualmente
          </button>
        )}
      </div>
    </section>
  );
}

function Linha({ termo, valor }: { termo: string; valor: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="shrink-0 text-ink-subtle">{termo}:</dt>
      <dd className="tnum min-w-0 text-ink">{valor}</dd>
    </div>
  );
}

/** Escolha de anexo para a sobreposição manual. */
function SeletorAnexo({
  valor,
  onChange,
}: {
  valor: Anexo | null;
  onChange: (anexo: Anexo) => void;
}) {
  const id = useId();
  return (
    <span className="inline-flex items-center gap-1.5">
      <label htmlFor={id} className="text-[0.75rem] text-ink-muted">
        Anexo
      </label>
      <select
        id={id}
        value={valor ?? ""}
        onChange={(e) => onChange(e.target.value as Anexo)}
        className="alvo-toque min-h-9 rounded-md border border-border-strong bg-surface px-2 py-1 text-[0.8125rem] text-ink"
      >
        <option value="" disabled>
          Escolha
        </option>
        {ANEXOS.map((a) => (
          <option key={a} value={a}>
            Anexo {a}
          </option>
        ))}
      </select>
    </span>
  );
}
