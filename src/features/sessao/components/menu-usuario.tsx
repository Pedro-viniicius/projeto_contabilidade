"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { encerrarSessaoDemo, nomeExibido } from "../services/sessao-demo";
import type { SessaoDemo } from "../schemas/sessao-schema";

/**
 * Controle de conta na barra superior.
 *
 * Deixa explícito, no único lugar onde a informação é relevante, que a
 * sessão é demonstrativa — em vez de espalhar avisos técnicos por toda
 * a interface do contador.
 */
export function MenuUsuario({ sessao }: { sessao: SessaoDemo }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const gatilhoRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aberto) return;

    const aoClicarFora = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setAberto(false);
    };
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAberto(false);
        gatilhoRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  const nome = nomeExibido(sessao.email);
  const iniciais = nome
    .split(" ")
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join("")
    .toLocaleUpperCase("pt-BR");

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={gatilhoRef}
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-haspopup="menu"
        className="alvo-toque flex min-h-8 items-center gap-2 rounded-md px-1.5 text-[0.8125rem] text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
      >
        <span
          aria-hidden="true"
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[0.6875rem] font-semibold text-accent-ink"
        >
          {iniciais || "C"}
        </span>
        <span className="hidden max-w-[9rem] truncate font-medium text-ink sm:inline">
          {nome}
        </span>
        <span aria-hidden="true" className="hidden text-ink-subtle sm:inline">
          ▾
        </span>
        <span className="sr-only">Conta e sessão</span>
      </button>

      {aberto && (
        <div
          role="menu"
          aria-label="Conta"
          className="absolute right-0 top-[calc(100%+0.375rem)] z-50 w-64 rounded-md border border-border-base bg-surface py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        >
          <div className="border-b border-border-base px-3 py-2">
            <p className="truncate text-[0.8125rem] font-medium text-ink">
              {nome}
            </p>
            <p className="truncate text-[0.75rem] text-ink-subtle">
              {sessao.email}
            </p>
          </div>

          <p className="px-3 py-2 text-[0.75rem] leading-snug text-ink-muted">
            <span className="font-medium text-ink">Modo demonstração.</span> Não
            há autenticação nem servidor: o acesso vale apenas neste navegador.
          </p>

          <div className="border-t border-border-base pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                encerrarSessaoDemo();
                router.replace("/login");
              }}
              className="alvo-toque flex min-h-9 w-full items-center px-3 text-left text-[0.8125rem] text-ink transition-colors hover:bg-surface-hover"
            >
              Encerrar sessão
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
