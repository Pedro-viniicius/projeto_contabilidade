"use client";

import { Logo } from "@/components/ui/logo";
import { AlternarTema } from "@/components/tema/alternar-tema";
import { BotaoInstalar } from "@/components/pwa/botao-instalar";
import { MenuUsuario } from "@/features/sessao/components/menu-usuario";
import { resumoValidacao } from "@/features/simulacao/domain/calculation-rules";
import type { SessaoDemo } from "@/features/sessao/schemas/sessao-schema";

/**
 * Barra superior da área de trabalho.
 *
 * Substitui a navegação lateral da V2: como tudo passou a acontecer em
 * uma tela só, uma coluna de 224px de menu era espaço horizontal gasto
 * com links para lugar nenhum. Aqui ficam apenas identidade, contexto
 * da análise atual e controles de sessão.
 */
export function BarraSuperior({
  sessao,
  referencia,
  onAbrirPremissas,
  onAbrirContexto,
}: {
  sessao: SessaoDemo;
  /** Rótulo da análise em edição, quando houver. */
  referencia: string;
  onAbrirPremissas: () => void;
  /** Abre a coluna de contexto como painel — usado abaixo de 1280px. */
  onAbrirContexto: () => void;
}) {
  const { pendentes, total } = resumoValidacao();
  const tudoValidado = pendentes === 0;

  return (
    <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-2 border-b border-border-base bg-background/95 px-3 backdrop-blur sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Logo className="size-6 shrink-0" />
        <span className="shrink-0 text-[0.9375rem] font-semibold tracking-tight text-ink">
          Clareza
        </span>
      </div>

      <span
        aria-hidden="true"
        className="hidden h-4 w-px shrink-0 bg-border-base sm:block"
      />

      <p className="hidden min-w-0 flex-1 truncate text-[0.8125rem] text-ink-muted sm:block">
        {referencia || "Nova simulação"}
      </p>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        {/* Status do modelo: informação real, e atalho para auditá-la. */}
        <button
          type="button"
          onClick={onAbrirPremissas}
          className="hidden min-h-8 items-center gap-1.5 rounded-md px-2 text-[0.8125rem] text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink min-[640px]:inline-flex"
        >
          <span
            aria-hidden="true"
            className={`size-2 shrink-0 rounded-full ${
              tudoValidado ? "bg-positivo" : "bg-atencao"
            }`}
          />
          {tudoValidado ? "Modelo validado" : "Modelo em validação"}
          {!tudoValidado && (
            <span className="tnum text-ink-subtle">
              {pendentes}/{total}
            </span>
          )}
        </button>

        {/* Abaixo de 1280px a coluna de contexto vira painel sob demanda. */}
        <button
          type="button"
          onClick={onAbrirContexto}
          className="inline-flex min-h-8 items-center rounded-md px-2 text-[0.8125rem] text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink min-[1280px]:hidden"
        >
          Contexto
        </button>

        <BotaoInstalar />
        <AlternarTema />
        <MenuUsuario sessao={sessao} />
      </div>
    </header>
  );
}
