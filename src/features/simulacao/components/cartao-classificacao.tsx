"use client";

import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROTULO_STATUS, type Anexo } from "../domain/calculation-rules";
import {
  explicarBloqueio,
  resumoBloqueio,
  type Classificacao,
} from "../domain/classificacao";
import {
  acaoDoEnquadramento,
  rotuloDetalhe,
  textoAnexosPossiveis,
  textoFatorR,
  type CampoPendente,
} from "./acao-enquadramento";
import { EtiquetaAnexo } from "./seletor-atividade";

/**
 * Anexos oferecidos na definição manual.
 *
 * Só os de serviço, que é o escopo do produto. Comércio e indústria
 * têm tabela no domínio, mas nenhuma atividade no catálogo e nenhum
 * cálculo suportado: oferecê-los aqui levaria o contador a um beco sem
 * saída — anexo escolhido, cálculo bloqueado, nada resolvido.
 */
const ANEXOS_MANUAIS: readonly Anexo[] = ["III", "IV", "V"];

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
 * O bloco responde, nesta ordem: o que está acontecendo → por quê →
 * o que fazer agora → existe alternativa → detalhe técnico. Quando há
 * pendência, a AÇÃO vem antes do resumo; quando o anexo está
 * resolvido, o resumo é o conteúdo principal e a definição manual
 * recolhe-se atrás de um botão.
 *
 * Nada é decidido aqui. Todos os campos vêm prontos do domínio,
 * inclusive o motivo — o que garante que o anexo exibido é exatamente
 * o que produziu o resultado ao lado.
 */
export function CartaoClassificacao({
  classificacao,
  onAnexoManual,
  onMotivoManual,
  onIrPara,
  onVoltarAoAutomatico,
}: {
  classificacao: Classificacao;
  onAnexoManual: (anexo: Anexo | null) => void;
  onMotivoManual: (motivo: string) => void;
  /** Leva o foco ao campo que resolve a pendência. */
  onIrPara: (campo: CampoPendente) => void;
  /**
   * Limpa anexo E motivo numa ÚNICA atualização. Duas chamadas
   * separadas se anulariam: ambas leem a mesma entrada do closure.
   */
  onVoltarAoAutomatico: () => void;
}) {
  const id = useId();
  const [detalheAberto, setDetalhe] = useState(false);
  const [manualAberto, setManual] = useState(false);

  const { atividade, anexo, fatorR, bloqueio, manual } = classificacao;
  const pendencia = acaoDoEnquadramento(classificacao);

  return (
    <section
      aria-label="Enquadramento tributário"
      className="rounded-md border border-border-strong bg-surface-muted"
    >
      {/* ---------- NÍVEL 1 · status ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-2">
        <div className="flex items-center gap-1.5">
          <span className="rotulo-secao">Enquadramento</span>
          {anexo ? (
            <EtiquetaAnexo anexo={anexo} manual={manual} />
          ) : (
            /* Ponto + texto: o status nunca depende só da cor. */
            <Badge tom="atencao" ponto>
              Pendente
            </Badge>
          )}
        </div>

        {atividade && (
          <Badge tom="neutro">{ROTULO_STATUS[atividade.status]}</Badge>
        )}
      </div>

      {/* ---------- NÍVEL 1 · motivo curto + ação principal ---------- */}
      {pendencia && (
        <div className="space-y-2 border-t border-border-base px-2.5 py-2.5">
          <p className="text-[0.8125rem] leading-snug text-ink">
            {pendencia.motivo}
          </p>

          <Button
            type="button"
            tamanho="md"
            onClick={() => onIrPara(pendencia.campo)}
            className="w-full sm:w-auto"
          >
            {pendencia.rotulo}
          </Button>

          {bloqueio && (
            /*
              Consequência em uma linha, abaixo da ação — informa sem
              disputar a atenção com o próximo passo. O detalhe fica no
              "Por que o enquadramento está pendente?".
            */
            <p className="flex items-start gap-1.5 text-[0.75rem] leading-snug text-ink-muted">
              <span aria-hidden="true" className="text-atencao">
                ⚠
              </span>
              <span>{resumoBloqueio(bloqueio)}</span>
            </p>
          )}
        </div>
      )}

      {/* ---------- NÍVEL 2 · resumo da classificação ---------- */}
      <dl className="grid gap-1 border-t border-border-base px-2.5 py-2 text-[0.75rem]">
        <Linha
          termo={anexo ? "Anexos possíveis" : "Anexo aplicável"}
          valor={textoAnexosPossiveis(classificacao)}
        />
        <Linha termo="Fator R" valor={textoFatorR(classificacao)} />
      </dl>

      {/* Bloqueio de anexo resolvido: aqui não há ação principal acima. */}
      {bloqueio && !pendencia && (
        <p
          role="status"
          className="flex items-start gap-1.5 border-t border-border-base px-2.5 py-2 text-[0.75rem] leading-snug text-atencao"
        >
          <span aria-hidden="true">⚠</span>
          <span>{resumoBloqueio(bloqueio)}</span>
        </p>
      )}

      {/* ---------- NÍVEL 3 · enquadramento manual ---------- */}
      <div className="border-t border-border-base px-2.5 py-2.5">
        {manual ? (
          <ManualAtivo
            classificacao={classificacao}
            onAnexoManual={onAnexoManual}
            onMotivoManual={onMotivoManual}
            onVoltarAoAutomatico={onVoltarAoAutomatico}
          />
        ) : pendencia || manualAberto ? (
          /*
            Com a classificação pendente a definição manual é uma
            alternativa REAL, e fica aberta. Com o anexo já resolvido
            ela é sobreposição rara e permanece atrás de um botão.
          */
          <ManualDisponivel
            aoAplicar={onAnexoManual}
            aoDesistir={pendencia ? undefined : () => setManual(false)}
          />
        ) : (
          <Button
            type="button"
            variante="sutil"
            tamanho="sm"
            onClick={() => setManual(true)}
          >
            Definir anexo manualmente
          </Button>
        )}
      </div>

      {/* ---------- NÍVEL 4 · detalhe técnico ---------- */}
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
          {rotuloDetalhe(classificacao)}
        </button>

        {detalheAberto && (
          <div
            id={`${id}-detalhe`}
            className="space-y-2 border-t border-border-base px-2.5 py-2 text-[0.75rem] leading-relaxed text-ink-muted"
          >
            <p>{classificacao.motivo}</p>

            {bloqueio && <p>{explicarBloqueio(bloqueio, anexo)}</p>}

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
    </section>
  );
}

/**
 * Definição manual disponível — seleção EM RASCUNHO.
 *
 * A troca só vale depois de "Aplicar": antes, navegar o `<select>`
 * pelas setas dispararia `change` a cada opção e trocaria o anexo do
 * cenário — e o resultado inteiro — sem que ninguém tivesse decidido
 * nada. O que se confirma aqui é a passagem de automático para manual.
 */
function ManualDisponivel({
  aoAplicar,
  aoDesistir,
}: {
  aoAplicar: (anexo: Anexo) => void;
  /** Ausente quando a seção é permanente (classificação pendente). */
  aoDesistir?: () => void;
}) {
  const id = useId();
  const [rascunho, setRascunho] = useState<Anexo | "">("");

  return (
    <div className="space-y-2">
      <p className="text-[0.8125rem] font-medium text-ink">
        Enquadramento manual
      </p>
      <p className="text-[0.75rem] leading-snug text-ink-muted">
        Se você já sabe o anexo aplicável, defina-o aqui. A análise fica
        marcada como classificação manual.
      </p>

      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label
            htmlFor={id}
            className="block text-[0.75rem] font-medium text-ink"
          >
            Anexo para enquadramento manual
          </label>
          <select
            id={id}
            value={rascunho}
            onChange={(e) => setRascunho(e.target.value as Anexo)}
            className="alvo-toque mt-1 min-h-9 rounded-md border border-border-strong bg-surface px-2 py-1 text-[0.8125rem] text-ink"
          >
            <option value="">Selecione um anexo</option>
            {ANEXOS_MANUAIS.map((a) => (
              <option key={a} value={a}>
                Anexo {a}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          variante="secundaria"
          tamanho="md"
          /*
            `aria-disabled` em vez de `disabled`: o botão continua na
            tabulação e o leitor de tela o anuncia, com o motivo ligado
            pelo `aria-describedby`. O clique é barrado na mão.
          */
          aria-disabled={rascunho === ""}
          aria-describedby={rascunho === "" ? `${id}-ajuda` : undefined}
          onClick={() => {
            if (rascunho === "") return;
            aoAplicar(rascunho);
          }}
        >
          Aplicar anexo manualmente
        </Button>

        {aoDesistir && (
          <Button
            type="button"
            variante="sutil"
            tamanho="md"
            onClick={aoDesistir}
          >
            Manter classificação automática
          </Button>
        )}
      </div>

      {rascunho === "" && (
        <p id={`${id}-ajuda`} className="text-[0.75rem] text-ink-subtle">
          Selecione um anexo para poder aplicar.
        </p>
      )}
    </div>
  );
}

/**
 * Definição manual já ativa.
 *
 * Aqui a troca é imediata, e de propósito: o contador já declarou que
 * está no manual, a etiqueta diz isso em toda a tela, e exigir
 * confirmação a cada ajuste criaria o descompasso de o `<select>`
 * mostrar um anexo e o cálculo usar outro. O que se confirma é a
 * ENTRADA no modo manual, não cada edição dentro dele.
 */
function ManualAtivo({
  classificacao,
  onAnexoManual,
  onMotivoManual,
  onVoltarAoAutomatico,
}: {
  classificacao: Classificacao;
  onAnexoManual: (anexo: Anexo | null) => void;
  onMotivoManual: (motivo: string) => void;
  onVoltarAoAutomatico: () => void;
}) {
  const id = useId();

  return (
    <div className="space-y-2">
      <p className="text-[0.8125rem] font-medium text-ink">
        Enquadramento manual
      </p>
      <p className="text-[0.75rem] leading-snug text-ink-muted">
        Anexo definido por você. A análise fica marcada como classificação
        manual, no histórico e na auditoria.
      </p>

      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label
            htmlFor={id}
            className="block text-[0.75rem] font-medium text-ink"
          >
            Anexo para enquadramento manual
          </label>
          <select
            id={id}
            value={classificacao.anexo ?? ""}
            onChange={(e) => onAnexoManual(e.target.value as Anexo)}
            className="alvo-toque mt-1 min-h-9 rounded-md border border-border-strong bg-surface px-2 py-1 text-[0.8125rem] text-ink"
          >
            {ANEXOS_MANUAIS.map((a) => (
              <option key={a} value={a}>
                Anexo {a}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          variante="sutil"
          tamanho="md"
          onClick={onVoltarAoAutomatico}
        >
          Voltar ao automático
        </Button>
      </div>

      <label className="block">
        <span className="text-[0.75rem] text-ink-muted">Motivo (opcional)</span>
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
