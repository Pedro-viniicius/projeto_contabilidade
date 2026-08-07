"use client";

import { useId } from "react";

export interface OpcaoEscolha<T extends string> {
  valor: T;
  rotulo: string;
  descricao: string;
}

interface Props<T extends string> {
  legenda: string;
  opcoes: readonly OpcaoEscolha<T>[];
  valor: T;
  onChange: (valor: T) => void;
}

/**
 * Grupo de opções em formato de cartão.
 * Usa radio nativo por baixo: navegação por setas e leitura por leitores
 * de tela funcionam sem ARIA extra.
 */
export function Escolha<T extends string>({
  legenda,
  opcoes,
  valor,
  onChange,
}: Props<T>) {
  const nome = useId();

  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink">{legenda}</legend>
      <div className="mt-3 grid gap-3">
        {opcoes.map((opcao) => {
          const selecionada = opcao.valor === valor;
          return (
            <label
              key={opcao.valor}
              className={[
                "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
                selecionada
                  ? "border-accent bg-accent-soft"
                  : "border-border-strong bg-surface hover:bg-surface-muted",
              ].join(" ")}
            >
              <input
                type="radio"
                name={nome}
                value={opcao.valor}
                checked={selecionada}
                onChange={() => onChange(opcao.valor)}
                className="mt-1 size-4 shrink-0 accent-[var(--accent)] outline-none"
              />
              <span>
                <span className="block font-medium text-ink">
                  {opcao.rotulo}
                </span>
                <span className="mt-0.5 block text-sm text-ink-muted">
                  {opcao.descricao}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
