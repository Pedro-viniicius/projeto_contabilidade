import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variante = "primaria" | "secundaria" | "sutil";
type Tamanho = "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-50 " +
  "select-none text-center";

const VARIANTES: Record<Variante, string> = {
  primaria:
    "bg-accent text-white hover:bg-accent-hover dark:text-[#06120f] shadow-sm",
  secundaria:
    "bg-surface text-ink border border-border-strong hover:bg-surface-muted",
  sutil: "text-ink-muted hover:text-ink hover:bg-surface-muted",
};

/* Altura mínima de 44px: alvo de toque confortável no mobile. */
const TAMANHOS: Record<Tamanho, string> = {
  md: "min-h-11 px-4 py-2.5 text-[0.95rem]",
  lg: "min-h-13 px-6 py-3.5 text-base",
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
