import type { ComponentProps, ReactNode } from "react";

/**
 * Superfície de conteúdo — o degrau entre o fundo da aplicação e o
 * dado.
 *
 * Borda + fundo branco + uma sombra de 1px. A sombra é o menor valor
 * que ainda faz o painel pousar sobre o fundo cinza em vez de flutuar:
 * conteúdo normal não levita neste produto, e elevação de verdade fica
 * reservada ao que é transitório (painel lateral, menu).
 */
export function Painel({
  className,
  children,
  ...props
}: ComponentProps<"section"> & { children: ReactNode }) {
  return (
    <section
      className={[
        "rounded-lg border border-border-base bg-surface shadow-sutil",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </section>
  );
}

/**
 * Cabeçalho de painel: identificação à esquerda, ações à direita.
 *
 * O `rotulo` em caixa alta é opcional e existe para dar à zona de
 * resultado a mesma marcação de seção que o formulário já tem — é ele
 * que faz as duas colunas parecerem partes do mesmo sistema.
 */
export function PainelCabecalho({
  rotulo,
  titulo,
  descricao,
  acoes,
  as: Tag = "h2",
}: {
  rotulo?: string;
  titulo: ReactNode;
  descricao?: ReactNode;
  acoes?: ReactNode;
  as?: "h2" | "h3";
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 border-b border-border-base px-4 py-3">
      <div className="min-w-0">
        {rotulo && <p className="rotulo-secao mb-1">{rotulo}</p>}
        <Tag className="titulo-bloco">{titulo}</Tag>
        {descricao && (
          <p className="mt-1 text-[0.8125rem] leading-snug text-ink-muted">
            {descricao}
          </p>
        )}
      </div>
      {acoes && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {acoes}
        </div>
      )}
    </div>
  );
}

/** Corpo padrão de painel. */
export function PainelCorpo({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={["px-4 py-3.5", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

/** Agrupador de campos dentro do formulário, sem virar cartão. */
export function GrupoCampos({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="border-t border-border-base pt-4 first:border-t-0 first:pt-0">
      <legend className="rotulo-secao mb-2.5">{titulo}</legend>
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}
