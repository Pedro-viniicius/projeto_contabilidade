"use client";

import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";
import { BotaoIcone } from "./button";
import { IconeFechar } from "./icone";

const FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Painel lateral sobreposto — o mecanismo que mantém o contador na
 * mesma tela.
 *
 * Premissas, escopo, feedback e histórico abrem aqui, por cima da
 * análise em andamento, em vez de trocar de rota. A simulação continua
 * visível atrás do painel e o estado do formulário nunca é perdido.
 *
 * Acessibilidade: diálogo modal com rótulo, foco levado para dentro na
 * abertura, foco preso enquanto aberto (Tab circula), Escape fecha e o
 * foco volta para o elemento que abriu.
 */
export function PainelLateral({
  aberto,
  titulo,
  descricao,
  largura = "media",
  onFechar,
  children,
}: {
  aberto: boolean;
  titulo: string;
  descricao?: string;
  /** `larga` para tabelas de auditoria; `media` para formulários. */
  largura?: "media" | "larga";
  onFechar: () => void;
  children: ReactNode;
}) {
  const idTitulo = useId();
  const idDescricao = useId();
  const painelRef = useRef<HTMLDivElement>(null);
  const origemFocoRef = useRef<HTMLElement | null>(null);

  const fechar = useCallback(() => onFechar(), [onFechar]);

  useEffect(() => {
    if (!aberto) return;

    origemFocoRef.current = document.activeElement as HTMLElement | null;

    /* Trava a rolagem do documento: só o painel rola enquanto aberto. */
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const painel = painelRef.current;
    /* Foco no primeiro controle; se não houver nenhum, no próprio painel. */
    const primeiroFocavel = painel?.querySelector<HTMLElement>(FOCAVEIS);
    if (primeiroFocavel) primeiroFocavel.focus();
    else painel?.focus();

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        fechar();
        return;
      }
      if (e.key !== "Tab" || !painel) return;

      const focaveis = Array.from(
        painel.querySelectorAll<HTMLElement>(FOCAVEIS),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focaveis.length === 0) return;

      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener("keydown", aoTeclar, true);
    return () => {
      document.removeEventListener("keydown", aoTeclar, true);
      document.body.style.overflow = overflowAnterior;
      origemFocoRef.current?.focus?.();
    };
  }, [aberto, fechar]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Véu: clicar fora fecha. Não é foco de teclado — o Escape cobre isso. */}
      <div
        aria-hidden="true"
        onClick={fechar}
        className="absolute inset-0 bg-veu"
      />

      <div
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={descricao ? idDescricao : undefined}
        tabIndex={-1}
        className={[
          "relative flex h-dvh w-full flex-col border-l border-border-base bg-background shadow-[-8px_0_24px_rgba(0,0,0,0.10)]",
          largura === "larga" ? "sm:max-w-[52rem]" : "sm:max-w-[34rem]",
        ].join(" ")}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border-base px-4 py-3">
          <div className="min-w-0">
            <h2
              id={idTitulo}
              className="text-sm font-semibold tracking-tight text-ink"
            >
              {titulo}
            </h2>
            {descricao && (
              <p
                id={idDescricao}
                className="mt-0.5 text-[0.8125rem] leading-snug text-ink-muted"
              >
                {descricao}
              </p>
            )}
          </div>
          {/* Ícone sozinho só onde o gesto é universal e de baixo
              risco. O nome acessível é obrigatório no tipo. */}
          <BotaoIcone rotulo="Fechar painel" onClick={fechar}>
            <IconeFechar />
          </BotaoIcone>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3.5">
          {children}
        </div>
      </div>
    </div>
  );
}
