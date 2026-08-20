import type { ReactNode } from "react";

export type TomBadge = "neutro" | "atencao" | "positivo" | "acento";

const TONS: Record<TomBadge, string> = {
  neutro: "bg-neutro-soft text-ink-muted",
  atencao: "bg-atencao-soft text-atencao",
  positivo: "bg-accent-soft text-accent-ink",
  acento: "bg-accent text-sobre-acento",
};

/**
 * Etiqueta de status. Sempre acompanhada de texto legível — a cor
 * reforça o significado, nunca é o único portador da informação.
 */
export function Badge({
  tom = "neutro",
  children,
  ponto,
}: {
  tom?: TomBadge;
  children: ReactNode;
  /** Marcador circular à esquerda, para status de sistema. */
  ponto?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[0.6875rem] font-medium leading-4 ${TONS[tom]}`}
    >
      {ponto && (
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full bg-current"
        />
      )}
      {children}
    </span>
  );
}
