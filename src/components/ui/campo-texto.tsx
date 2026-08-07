"use client";

import { useId } from "react";

/** Campo de texto curto, no mesmo padrão compacto do campo de moeda. */
export function CampoTexto({
  rotulo,
  valor,
  onChange,
  ajuda,
  placeholder,
  opcional,
  maxLength,
}: {
  rotulo: string;
  valor: string;
  onChange: (valor: string) => void;
  ajuda?: string;
  placeholder?: string;
  opcional?: boolean;
  maxLength?: number;
}) {
  const id = useId();
  const idAjuda = `${id}-ajuda`;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[0.8125rem] font-medium text-ink"
      >
        {rotulo}
        {opcional && (
          <span className="ml-1 font-normal text-ink-subtle">(opcional)</span>
        )}
      </label>
      <input
        id={id}
        type="text"
        value={valor}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={ajuda ? idAjuda : undefined}
        className="mt-1 min-h-9 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-[0.875rem] text-ink placeholder:text-ink-subtle"
      />
      {ajuda && (
        <p id={idAjuda} className="mt-1 text-[0.75rem] leading-snug text-ink-subtle">
          {ajuda}
        </p>
      )}
    </div>
  );
}
