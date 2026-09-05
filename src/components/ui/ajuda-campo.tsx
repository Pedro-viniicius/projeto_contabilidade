"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * AJUDA SOB DEMANDA.
 *
 * O texto explicativo fixo embaixo de cada campo ensina na primeira
 * análise e atrapalha em todas as seguintes: some da leitura, mas não
 * do layout — cada parágrafo custa altura, e altura custa rolagem em
 * quem faz dez análises por dia.
 *
 * A troca é por DIVULGAÇÃO PROGRESSIVA, não por tooltip de mouse:
 * um botão "?" ao lado do rótulo, alcançável por teclado e por toque,
 * que abre o texto no lugar. Enquanto aberto, o texto é ligado ao
 * campo por `aria-describedby` — a explicação continua sendo lida pelo
 * leitor de tela junto do campo, e não como um parágrafo solto.
 *
 * Nada crítico mora aqui. O que previne erro fica no rótulo, no aviso
 * ou na validação; a ajuda explica o conceito.
 */
export function useAjuda(rotulo: string, texto?: ReactNode) {
  const id = useId();
  const [aberto, setAberto] = useState(false);

  if (!texto) {
    return { botao: null, painel: null, idAjuda: undefined as string | undefined };
  }

  const botao = (
    <button
      type="button"
      onClick={() => setAberto((a) => !a)}
      aria-expanded={aberto}
      aria-controls={id}
      className="alvo-toque inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-border-strong text-[0.625rem] font-semibold leading-none text-ink-subtle transition-colors hover:border-accent hover:text-accent"
    >
      <span aria-hidden="true">?</span>
      <span className="sr-only">
        {aberto ? "Ocultar ajuda sobre" : "Ajuda sobre"} {rotulo}
      </span>
    </button>
  );

  const painel = aberto ? (
    <p
      id={id}
      className="mt-1 border-l-2 border-border-strong pl-2 text-[0.75rem] leading-snug text-ink-muted"
    >
      {texto}
    </p>
  ) : null;

  return { botao, painel, idAjuda: aberto ? id : undefined };
}
