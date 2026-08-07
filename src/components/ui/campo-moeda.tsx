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
}

/**
 * Campo de moeda com máscara pt-BR.
 * Os dígitos digitados são interpretados como centavos (padrão de apps
 * financeiros), o que dispensa o usuário de digitar vírgula.
 */
export function CampoMoeda({
  rotulo,
  valor,
  onChange,
  ajuda,
  erro,
  autoFocus,
}: Props) {
  const id = useId();
  const idAjuda = `${id}-ajuda`;
  const idErro = `${id}-erro`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {rotulo}
      </label>

      <div
        className={[
          "mt-2 flex items-center gap-2 rounded-xl border bg-surface px-3.5",
          "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent",
          erro ? "border-negative" : "border-border-strong",
        ].join(" ")}
      >
        <span aria-hidden="true" className="text-ink-subtle">
          R$
        </span>
        <input
          id={id}
          /* inputMode numérico abre o teclado certo no celular. */
          inputMode="numeric"
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
          className="campo-composto tnum min-h-13 w-full bg-transparent py-3 text-lg font-medium text-ink placeholder:font-normal placeholder:text-ink-subtle"
        />
      </div>

      {ajuda && !erro && (
        <p id={idAjuda} className="mt-1.5 text-sm text-ink-muted">
          {ajuda}
        </p>
      )}
      {erro && (
        /* Ícone + texto: o erro não depende apenas da cor. */
        <p
          id={idErro}
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-sm text-negative"
        >
          <span aria-hidden="true">⚠</span>
          <span>{erro}</span>
        </p>
      )}
    </div>
  );
}
