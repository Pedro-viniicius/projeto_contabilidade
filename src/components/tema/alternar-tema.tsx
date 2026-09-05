"use client";

import { useSyncExternalStore } from "react";
import {
  aplicarTema,
  inscreverTema,
  temaEfetivo,
  temaEfetivoNoServidor,
  type Tema,
} from "./preferencia-tema";

const OPCOES = [
  { valor: "claro", glifo: "☀", nome: "Tema claro" },
  { valor: "escuro", glifo: "☾", nome: "Tema escuro" },
] as const satisfies readonly { valor: Tema; glifo: string; nome: string }[];

/**
 * ALTERNÂNCIA DE TEMA — as duas opções à vista.
 *
 * Até a v2.6 isto era um botão único de ícone: quem estava no escuro
 * via uma lua, e para descobrir que o clique levava ao claro precisava
 * passar o mouse e ler o `title`. O caminho de volta para o modo claro
 * — que é o padrão do produto — ficava escondido atrás de uma
 * inferência.
 *
 * Virou um seletor de dois estados, no mesmo desenho do `Escolha` do
 * formulário: trilho fosco, pastilha branca na opção ativa. As duas
 * alternativas ficam visíveis o tempo todo, e o contador reconhece
 * qual está no ar sem ter que interpretar um símbolo.
 *
 * Cada opção é um botão com nome acessível e `aria-pressed` — o glifo
 * reforça, nunca carrega o significado sozinho.
 */
export function AlternarTema({ className }: { className?: string } = {}) {
  const efetivo = useSyncExternalStore(
    inscreverTema,
    temaEfetivo,
    temaEfetivoNoServidor,
  );

  return (
    <div
      role="group"
      aria-label="Tema da interface"
      className={[
        "inline-flex shrink-0 items-center gap-0.5 rounded-md border",
        "border-border-strong bg-surface-muted p-0.5 shadow-sutil",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {OPCOES.map((opcao) => {
        const ativa = opcao.valor === efetivo;
        return (
          <button
            key={opcao.valor}
            type="button"
            aria-pressed={ativa}
            title={opcao.nome}
            onClick={() => aplicarTema(opcao.valor)}
            className={[
              "alvo-toque inline-flex h-6 w-7 items-center justify-center",
              "rounded-sm text-[0.8125rem] leading-none",
              "transition-colors duration-[140ms]",
              ativa
                ? "bg-surface text-ink shadow-sutil ring-1 ring-[var(--border)]"
                : "text-ink-muted hover:bg-surface-hover hover:text-ink",
            ].join(" ")}
          >
            <span aria-hidden="true">{opcao.glifo}</span>
            <span className="sr-only">
              {opcao.nome}
              {ativa ? " (em uso)" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
