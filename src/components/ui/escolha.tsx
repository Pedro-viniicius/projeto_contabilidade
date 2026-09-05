"use client";

import { useId } from "react";

export interface OpcaoEscolha<T extends string> {
  valor: T;
  rotulo: string;
  descricao?: string;
}

/**
 * Seletor segmentado. Substitui os cartões de rádio da V1: mesma
 * semântica nativa (radio), mas ocupa uma linha em vez de meia tela.
 * Navegação por setas e leitura por leitor de tela seguem funcionando.
 */
export function Escolha<T extends string>({
  legenda,
  opcoes,
  valor,
  onChange,
  apoio,
}: {
  legenda: string;
  opcoes: readonly OpcaoEscolha<T>[];
  valor: T;
  onChange: (valor: T) => void;
  /**
   * Texto único do grupo, exibido sob as opções.
   *
   * Preferível a repetir a mesma frase na `descricao` de cada opção:
   * quando o que precisa ser dito vale para todas, dizer uma vez faz o
   * contador ler uma vez.
   */
  apoio?: string;
}) {
  const nome = useId();
  const selecionada = opcoes.find((o) => o.valor === valor);

  return (
    <fieldset>
      <legend className="text-[0.8125rem] font-medium text-ink">
        {legenda}
      </legend>

      <div className="mt-1 grid grid-cols-2 gap-1 rounded-md border border-border-strong bg-surface-muted p-1">
        {opcoes.map((opcao) => {
          const ativa = opcao.valor === valor;
          return (
            <label
              key={opcao.valor}
              className={[
                "cursor-pointer rounded-sm px-2 py-1.5 text-center text-[0.8125rem] font-medium transition-colors",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
                ativa
                  ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  : "text-ink-muted hover:text-ink",
              ].join(" ")}
            >
              <input
                type="radio"
                name={nome}
                value={opcao.valor}
                checked={ativa}
                onChange={() => onChange(opcao.valor)}
                className="sr-only"
              />
              {opcao.rotulo}
            </label>
          );
        })}
      </div>

      {(apoio ?? selecionada?.descricao) && (
        <p className="mt-1 text-[0.75rem] leading-snug text-ink-subtle">
          {apoio ?? selecionada?.descricao}
        </p>
      )}
    </fieldset>
  );
}
