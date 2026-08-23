import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * Hierarquia de ação, declarada no tipo.
 *
 * - `primaria`   — o próximo passo do contexto. Uma por zona.
 * - `secundaria` — ação de apoio, visível mas subordinada.
 * - `sutil`      — ação de baixa frequência, sem peso visual.
 * - `destrutiva` — perda de dado que não volta. Nunca se parece com as
 *                  demais: é a única com o tom negativo.
 */
type Variante = "primaria" | "secundaria" | "sutil" | "destrutiva";
type Tamanho = "sm" | "md" | "lg";

const BASE =
  "alvo-toque inline-flex items-center justify-center gap-1.5 rounded-md " +
  "font-medium transition-colors disabled:cursor-not-allowed " +
  "disabled:opacity-45 select-none text-center whitespace-nowrap";

const VARIANTES: Record<Variante, string> = {
  primaria: "bg-accent text-sobre-acento hover:bg-accent-hover",
  secundaria:
    "bg-surface text-ink border border-border-strong hover:bg-surface-hover",
  /*
   * Borda transparente, e não ausência de borda: mantém a mesma caixa
   * das demais variantes, e o hover revela o contorno — o controle
   * ainda parece clicável antes de ser tocado.
   */
  sutil:
    "border border-transparent text-ink-muted hover:border-border-strong " +
    "hover:bg-surface-muted hover:text-ink",
  destrutiva:
    "border border-negativo/60 text-negativo hover:bg-negativo-soft " +
    "hover:border-negativo",
};

/*
 * Controles mais compactos que na V1 (52px → 36/40px): densidade
 * profissional. O alvo real de toque é ampliado para 44px pela classe
 * `alvo-toque`, com pseudo-elemento e só em ponteiro grosso — o
 * desenho continua denso, o dedo continua acertando.
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

/**
 * Controle só de ícone.
 *
 * Reservado ao que é universalmente entendido e de baixo risco —
 * fechar um painel, alternar o tema. Ação importante nunca vem só de
 * ícone. O `rotulo` é obrigatório *no tipo*: vira o nome acessível, e
 * não há como criar um botão anônimo por esquecimento.
 */
export function BotaoIcone({
  rotulo,
  className,
  children,
  ...props
}: Omit<ComponentProps<"button">, "aria-label"> & {
  rotulo: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={[
        "alvo-toque inline-flex size-8 shrink-0 items-center justify-center",
        "rounded-md text-ink-muted transition-colors hover:bg-surface-muted",
        "hover:text-ink",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
      <span className="sr-only">{rotulo}</span>
    </button>
  );
}
