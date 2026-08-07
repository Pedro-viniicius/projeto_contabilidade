import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variante = "primaria" | "secundaria" | "sutil";
type Tamanho = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-45 " +
  "select-none text-center whitespace-nowrap";

const VARIANTES: Record<Variante, string> = {
  primaria: "bg-accent text-white hover:bg-accent-hover dark:text-[#06120f]",
  secundaria:
    "bg-surface text-ink border border-border-strong hover:bg-surface-hover",
  sutil: "text-ink-muted hover:text-ink hover:bg-surface-muted",
};

/*
 * Controles mais compactos que na V1 (52px → 36/40px): densidade
 * profissional. O mínimo de 36px continua confortável para toque e
 * atende ao alvo mínimo recomendado quando há espaçamento ao redor.
 */
const TAMANHOS: Record<Tamanho, string> = {
  sm: "min-h-8 px-2.5 text-[0.8125rem]",
  md: "min-h-9 px-3.5 text-sm",
  lg: "min-h-10 px-4 text-sm",
};

function classes(variante: Variante, tamanho: Tamanho, extra?: string) {
  return [BASE, VARIANTES[variante], TAMANHOS[tamanho], extra]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variante = "primaria",
  tamanho = "md",
  className,
  children,
  ...props
}: ComponentProps<"button"> & {
  variante?: Variante;
  tamanho?: Tamanho;
  children: ReactNode;
}) {
  return (
    <button className={classes(variante, tamanho, className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variante = "primaria",
  tamanho = "md",
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & {
  variante?: Variante;
  tamanho?: Tamanho;
  children: ReactNode;
}) {
  return (
    <Link className={classes(variante, tamanho, className)} {...props}>
      {children}
    </Link>
  );
}
