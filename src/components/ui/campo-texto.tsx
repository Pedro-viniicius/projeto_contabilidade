"use client";

import { useId, type ReactNode } from "react";
import { useAjuda } from "./ajuda-campo";

/**
 * Campo de texto curto, no mesmo padrão compacto do campo de moeda —
 * inclusive na ajuda, que abre sob demanda em vez de ocupar uma linha
 * permanente abaixo do campo.
 */
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
  ajuda?: ReactNode;
  placeholder?: string;
  opcional?: boolean;
  maxLength?: number;
}) {
  const id = useId();
  const { botao, painel, idAjuda } = useAjuda(rotulo, ajuda);

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <label htmlFor={id} className="text-[0.8125rem] font-medium text-ink">
          {rotulo}
          {opcional && (
            <span className="ml-1 font-normal text-ink-subtle">(opcional)</span>
          )}
        </label>
        {botao}
      </div>
      <input
        id={id}
        type="text"
        value={valor}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={idAjuda}
        className="mt-1 min-h-9 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-[0.875rem] text-ink placeholder:text-ink-subtle"
      />
      {painel}
    </div>
  );
}
