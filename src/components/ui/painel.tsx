import type { ComponentProps, ReactNode } from "react";

/**
 * Superfície de conteúdo. Substitui o "Card" da V1: bordas retas,
 * raio menor e sem sombra — evita a "sopa de cartões" e deixa o
 * agrupamento por espaçamento fazer o trabalho.
 */
export function Painel({
  className,
  children,
  ...props
}: ComponentProps<"section"> & { children: ReactNode }) {
  return (
    <section
      className={[
        "rounded-lg border border-border-base bg-surface",
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

/** Cabeçalho de painel: título à esquerda, ações à direita. */
export function PainelCabecalho({
  titulo,
  descricao,
  acoes,
  as: Tag = "h2",
}: {
  titulo: ReactNode;
  descricao?: ReactNode;
  acoes?: ReactNode;
  as?: "h2" | "h3";
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-base px-4 py-3">
      <div className="min-w-0">
        <Tag className="text-sm font-semibold tracking-tight text-ink">
          {titulo}
        </Tag>
        {descricao && (
          <p className="mt-0.5 text-[0.8125rem] leading-snug text-ink-muted">
            {descricao}
          </p>
        )}
      </div>
      {acoes && <div className="flex shrink-0 items-center gap-2">{acoes}</div>}
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
    <fieldset className="border-t border-border-base pt-3.5 first:border-t-0 first:pt-0">
      <legend className="rotulo-secao mb-2.5">{titulo}</legend>
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}
