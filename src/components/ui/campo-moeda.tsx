"use client";

import { useId, type ReactNode, type RefObject } from "react";
import { centavosParaTexto, formatarMoeda, textoParaCentavos } from "@/lib/format";
import { useAjuda } from "./ajuda-campo";
import { MensagemStatus } from "./mensagem-status";

/** Apontamento de conferência exibido junto do campo. */
export interface AvisoCampo {
  readonly chave: string;
  readonly nivel: "atencao" | "informacao";
  readonly texto: string;
}

/**
 * Sugestão de preenchimento.
 *
 * `origem` é obrigatória de propósito: "Aplicar R$ 14.000,00" sozinho
 * é um número mágico, e um número mágico num campo tributário é
 * exatamente o tipo de coisa que o contador precisa poder justificar
 * ao cliente. Quem sugere, explica de onde tirou.
 */
export interface SugestaoCampo {
  readonly valor: number;
  readonly origem: string;
  readonly onAplicar: () => void;
}

interface Props {
  rotulo: string;
  valor: number;
  onChange: (valor: number) => void;
  /** Explicação do conceito, aberta sob demanda pelo botão "?". */
  ajuda?: ReactNode;
  erro?: string;
  /** Conferências: o valor é incomum, mas pode estar certo. */
  avisos?: readonly AvisoCampo[];
  autoFocus?: boolean;
  sugestao?: SugestaoCampo;
  /** Permite que outra parte da tela traga o foco para este campo. */
  campoRef?: RefObject<HTMLInputElement | null>;
}

/**
 * Campo de moeda com máscara pt-BR.
 *
 * Os dígitos digitados são interpretados como centavos, o que dispensa
 * o contador de digitar vírgula ao lançar valores em sequência: 50000
 * vira 500,00 e 5000000 vira 50.000,00, sem que o cursor pule. O valor
 * é numérico e alinhado à direita, com numerais tabulares — colunas de
 * reais que alinham na vertical.
 *
 * A ajuda conceitual não fica permanentemente na tela: abre no botão
 * "?" ao lado do rótulo. O que previne erro — erro de validação e
 * conferência — continua sempre visível.
 */
export function CampoMoeda({
  rotulo,
  valor,
  onChange,
  ajuda,
  erro,
  avisos,
  autoFocus,
  sugestao,
  campoRef,
}: Props) {
  const id = useId();
  const idErro = `${id}-erro`;
  const idAvisos = `${id}-avisos`;
  const { botao, painel, idAjuda } = useAjuda(rotulo, ajuda);

  /* Sugerir o que já está no campo é ruído puro. */
  const sugestaoUtil =
    sugestao && Math.abs(sugestao.valor - valor) >= 0.005 ? sugestao : null;
  const temAvisos = (avisos?.length ?? 0) > 0;

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <label htmlFor={id} className="text-[0.8125rem] font-medium text-ink">
          {rotulo}
        </label>
        {botao}
      </div>

      <div
        className={[
          "mt-1 flex items-center gap-1.5 rounded-md border bg-surface px-2.5",
          "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent",
          erro
            ? "border-negativo"
            : temAvisos
              ? "border-atencao"
              : "border-border-strong",
        ].join(" ")}
      >
        <span aria-hidden="true" className="text-[0.8125rem] text-ink-subtle">
          R$
        </span>
        <input
          ref={campoRef}
          id={id}
          inputMode="decimal"
          type="text"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder="0,00"
          value={centavosParaTexto(valor)}
          onChange={(e) => onChange(textoParaCentavos(e.target.value))}
          aria-describedby={
            [
              idAjuda,
              erro ? idErro : null,
              temAvisos ? idAvisos : null,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
          aria-invalid={erro ? true : undefined}
          className="campo-composto tnum min-h-9 w-full bg-transparent py-1.5 text-right text-[0.9375rem] font-medium text-ink placeholder:font-normal placeholder:text-ink-subtle"
        />
      </div>

      {painel}

      {/*
        A sugestão vem ABAIXO do campo e diz de onde saiu antes de
        oferecer o clique. Nunca sobrescreve nada sozinha: aplicar é
        sempre um ato do contador.
      */}
      {sugestaoUtil && (
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="text-[0.75rem] leading-snug text-ink-subtle">
            <span className="tnum font-medium text-ink-muted">
              Sugestão: {formatarMoeda(sugestaoUtil.valor)}
            </span>{" "}
            — {sugestaoUtil.origem}
          </p>
          <button
            type="button"
            onClick={sugestaoUtil.onAplicar}
            className="alvo-toque shrink-0 rounded-sm border border-border-base px-1.5 py-0.5 text-[0.75rem] text-accent transition-colors hover:border-border-strong hover:bg-surface-muted"
          >
            Aplicar
            <span className="sr-only">
              {" "}
              sugestão de {formatarMoeda(sugestaoUtil.valor)} em {rotulo}
            </span>
          </button>
        </div>
      )}

      {erro && (
        <MensagemStatus
          id={idErro}
          nivel="erro"
          papel="alert"
          className="mt-1"
        >
          {erro}
        </MensagemStatus>
      )}

      {temAvisos && (
        <div id={idAvisos} className="mt-1 space-y-1">
          {avisos!.map((aviso) => (
            <MensagemStatus key={aviso.chave} nivel={aviso.nivel}>
              {aviso.texto}
            </MensagemStatus>
          ))}
        </div>
      )}
    </div>
  );
}
