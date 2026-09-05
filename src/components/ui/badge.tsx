import type { ReactNode } from "react";

export type TomBadge =
  | "neutro"
  | "atencao"
  | "positivo"
  | "acento"
  | "negativo";

/*
 * Cada tom traz FUNDO e BORDA. A borda não é enfeite: sem ela, uma
 * etiqueta neutra colocada sobre `surface-muted` — o que acontece o
 * tempo todo no bloco de enquadramento e nos totais de tabela — some
 * dentro do próprio fundo e deixa de parecer uma etiqueta.
 */
const TONS: Record<TomBadge, string> = {
  neutro: "bg-surface border-border-strong text-ink-muted",
  atencao: "bg-atencao-soft border-atencao-borda text-atencao",
  positivo: "bg-accent-soft border-accent-borda text-accent-ink",
  acento: "bg-accent border-accent text-sobre-acento",
  negativo: "bg-negativo-soft border-negativo-borda text-negativo",
};

/**
 * Etiqueta de status. Sempre acompanhada de texto legível — a cor
 * reforça o significado, nunca é o único portador da informação.
 *
 * Métrica única em todo o produto: 20px de altura mínima, raio
 * pequeno, 11px semibold. Um status não muda de forma conforme a tela
 * em que aparece.
 *
 * `min-h` e não `h`: dentro da tabela de premissas, "Validada
 * tecnicamente" ocupa duas linhas na coluna estreita. Com altura fixa
 * a segunda linha vazava para fora da etiqueta — o rótulo mais
 * importante do painel de auditoria aparecia cortado.
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
      className={`inline-flex min-h-5 items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-[0.6875rem] font-semibold leading-4 ${TONS[tom]}`}
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
