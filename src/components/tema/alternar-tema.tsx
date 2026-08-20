"use client";

import { useSyncExternalStore } from "react";
import {
  aplicarTema,
  inscreverTema,
  temaEfetivo,
  temaEfetivoNoServidor,
} from "./preferencia-tema";

/**
 * Alternância de tema na barra superior.
 *
 * Dois estados visíveis (claro/escuro) em vez de três: o contador quer
 * clarear ou escurecer a tela, não configurar um sistema. "Sistema"
 * continua sendo o padrão de quem nunca clicou.
 */
export function AlternarTema() {
  const efetivo = useSyncExternalStore(
    inscreverTema,
    temaEfetivo,
    temaEfetivoNoServidor,
  );
  const proximo = efetivo === "escuro" ? "claro" : "escuro";

  return (
    <button
      type="button"
      onClick={() => aplicarTema(proximo)}
      title={proximo === "escuro" ? "Usar tema escuro" : "Usar tema claro"}
      className="inline-flex size-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
    >
      <span aria-hidden="true" className="text-[0.875rem] leading-none">
        {efetivo === "escuro" ? "☀" : "☾"}
      </span>
      <span className="sr-only">
        {proximo === "escuro"
          ? "Alternar para o tema escuro"
          : "Alternar para o tema claro"}
      </span>
    </button>
  );
}
