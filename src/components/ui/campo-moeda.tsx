"use client";

import { useId, type RefObject } from "react";
import { centavosParaTexto, textoParaCentavos } from "@/lib/format";

interface Props {
  rotulo: string;
  valor: number;
  onChange: (valor: number) => void;
  ajuda?: string;
  erro?: string;
  autoFocus?: boolean;
  /** Sugestão clicável exibida ao lado do rótulo. */
  sugestao?: { texto: string; onAplicar: () => void };
  /** Permite que outra parte da tela traga o foco para este campo. */
  campoRef?: RefObject<HTMLInputElement | null>;
}

/**
 * Campo de moeda com máscara pt-BR.
 * Os dígitos digitados são interpretados como centavos, o que dispensa
 * o contador de digitar vírgula ao lançar valores em sequência.
 *
 * Layout compacto: rótulo e campo na mesma linha em telas maiores,
 * para caber toda a simulação em uma coluna sem rolagem.
 */
export function CampoMoeda({
  rotulo,
  valor,
  onChange,
  ajuda,
  erro,
  autoFocus,
  sugestao,
  campoRef,
}: Props) {
  const id = useId();
  const idAjuda = `${id}-ajuda`;
  const idErro = `${id}-erro`;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[0.8125rem] font-medium text-ink">
          {rotulo}
        </label>
        {/*
          A sugestão preenche o campo — é ação, não link. Ganhou
          contorno para parecer clicável, alvo de toque de 44px e um
          nome acessível que diz em qual campo o valor entra: fora de
          contexto, "Aplicar R$ 8.400,00" não identifica o destino.
        */}
        {sugestao && (
          <button
            type="button"
            onClick={sugestao.onAplicar}
            className="alvo-toque shrink-0 rounded-sm border border-border-base px-1.5 py-0.5 text-[0.75rem] text-accent transition-colors hover:border-border-strong hover:bg-surface-muted"
          >
            {sugestao.texto}
            <span className="sr-only"> em {rotulo}</span>
          </button>
        )}
      </div>

      <div
        className={[
          "mt-1 flex items-center gap-1.5 rounded-md border bg-surface px-2.5",
          "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent",
          erro ? "border-negativo" : "border-border-strong",
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
            [ajuda ? idAjuda : null, erro ? idErro : null]
              .filter(Boolean)
              .join(" ") || undefined
          }
          aria-invalid={erro ? true : undefined}
          className="campo-composto tnum min-h-9 w-full bg-transparent py-1.5 text-right text-[0.9375rem] font-medium text-ink placeholder:font-normal placeholder:text-ink-subtle"
        />
      </div>

      {ajuda && !erro && (
        <p id={idAjuda} className="mt-1 text-[0.75rem] leading-snug text-ink-subtle">
          {ajuda}
        </p>
      )}
      {erro && (
        /* Ícone + texto: o erro não depende apenas da cor. */
        <p
          id={idErro}
          role="alert"
          className="mt-1 flex items-start gap-1 text-[0.75rem] leading-snug text-negativo"
        >
          <span aria-hidden="true">⚠</span>
          <span>{erro}</span>
        </p>
      )}
    </div>
  );
}
