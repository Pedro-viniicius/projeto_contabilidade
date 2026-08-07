"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/ui/logo";
import { BotaoInstalar } from "@/components/pwa/botao-instalar";

/**
 * Itens reais da aplicação. Não criamos entradas para funcionalidades
 * inexistentes (Clientes, Relatórios, Financeiro) — menu vazio destrói
 * a confiança numa ferramenta profissional.
 */
const SECOES = [
  { href: "/", rotulo: "Visão geral" },
  { href: "/simulacao", rotulo: "Nova simulação" },
  { href: "/premissas", rotulo: "Premissas" },
  { href: "/feedback", rotulo: "Feedback" },
  { href: "/como-funciona", rotulo: "Escopo do modelo" },
] as const;

function ehAtivo(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Shell profissional: navegação lateral persistente no desktop,
 * barra superior com gaveta no mobile.
 *
 * `statusModelo` é injetado pelo layout (componente de servidor), para
 * que o shell continue sendo apenas apresentação.
 */
export function AppShell({
  children,
  statusModelo,
}: {
  children: ReactNode;
  statusModelo: ReactNode;
}) {
  const pathname = usePathname();
  const [gavetaAberta, setGavetaAberta] = useState(false);
  /* Fechar no clique, e não reagindo à rota: o evento é a navegação. */
  const fecharGaveta = () => setGavetaAberta(false);

  return (
    <div className="lg:flex lg:min-h-dvh">
      {/* Barra superior — apenas mobile/tablet. */}
      <header className="sticky top-0 z-40 flex h-12 items-center gap-2 border-b border-border-base bg-background/95 px-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setGavetaAberta((a) => !a)}
          aria-expanded={gavetaAberta}
          aria-controls="navegacao-principal"
          className="inline-flex size-9 items-center justify-center rounded-md text-ink-muted hover:bg-surface-muted hover:text-ink"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            {gavetaAberta ? "✕" : "☰"}
          </span>
          <span className="sr-only">
            {gavetaAberta ? "Fechar menu" : "Abrir menu"}
          </span>
        </button>
        <Link
          href="/"
          onClick={fecharGaveta}
          className="flex items-center gap-2 rounded-md"
        >
          <Logo className="size-6" />
          <span className="text-sm font-semibold tracking-tight text-ink">
            Clareza
          </span>
        </Link>
      </header>

      {/* Navegação lateral. */}
      <nav
        id="navegacao-principal"
        aria-label="Navegação principal"
        className={[
          "shrink-0 border-border-base bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-56 lg:flex-col lg:border-r",
          gavetaAberta ? "block border-b" : "hidden lg:flex",
        ].join(" ")}
      >
        <div className="hidden items-center gap-2 px-4 py-3.5 lg:flex">
          <Logo className="size-7" />
          <span className="text-[0.9375rem] font-semibold tracking-tight text-ink">
            Clareza
          </span>
          <span className="ml-auto text-[0.6875rem] font-medium text-ink-subtle">
            v2
          </span>
        </div>

        <ul className="space-y-0.5 p-2 lg:flex-1 lg:px-2 lg:py-0">
          {SECOES.map((secao) => {
            const ativo = ehAtivo(pathname, secao.href);
            return (
              <li key={secao.href}>
                <Link
                  href={secao.href}
                  onClick={fecharGaveta}
                  aria-current={ativo ? "page" : undefined}
                  className={[
                    "flex min-h-9 items-center rounded-md px-2.5 text-[0.8125rem] transition-colors",
                    ativo
                      ? "bg-accent-soft font-medium text-accent-ink"
                      : "text-ink-muted hover:bg-surface-muted hover:text-ink",
                  ].join(" ")}
                >
                  {secao.rotulo}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="space-y-2 border-t border-border-base p-2 lg:border-t-0 lg:p-3">
          {statusModelo}
          <BotaoInstalar />
        </div>
      </nav>

      {/* Área de trabalho. */}
      <div className="min-w-0 flex-1">
        <main id="conteudo">{children}</main>
      </div>
    </div>
  );
}
