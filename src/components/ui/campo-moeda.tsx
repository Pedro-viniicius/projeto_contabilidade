"use client";

import { useId } from "react";
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
        {sugestao && (
          <button
            type="button"
            onClick={sugestao.onAplicar}
            className="rounded-sm text-[0.75rem] text-accent hover:underline"
          >
            {sugestao.texto}
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
