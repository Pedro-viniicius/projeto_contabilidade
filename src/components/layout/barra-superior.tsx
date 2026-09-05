"use client";

import { Logo } from "@/components/ui/logo";
import { IconeHistorico } from "@/components/ui/icone";
import { AlternarTema } from "@/components/tema/alternar-tema";
import { BotaoInstalar } from "@/components/pwa/botao-instalar";
import { MenuUsuario } from "@/features/sessao/components/menu-usuario";
import { resumoValidacao } from "@/features/simulacao/domain/calculation-rules";
import { BotaoNovaAnalise } from "@/features/simulacao/components/botao-nova-analise";
import type { SessaoDemo } from "@/features/sessao/schemas/sessao-schema";

/**
 * BARRA SUPERIOR — identidade, contexto e as três portas do trabalho.
 *
 * Reúne, da esquerda para a direita: quem é o produto, QUAL análise
 * está aberta, e os controles globais — histórico, auditoria e a ação
 * primária de começar outra análise.
 *
 * "+ Nova análise" mora aqui, e só aqui. Até a v2.3 ela aparecia duas
 * vezes na mesma tela, com o mesmo peso visual: dois botões idênticos
 * disputando a mesma decisão é uma escolha a mais para tomar, não uma
 * conveniência. Posição fixa e previsível — a barra nunca rola —, alvo
 * grande e contraste próprio: o botão é encontrado sem procura.
 *
 * Os controles que abrem painéis dizem isso antes do clique: têm
 * contorno (não são texto de status), `aria-haspopup="dialog"` e
 * `aria-expanded`.
 */
export function BarraSuperior({
  sessao,
  referencia,
  historicoAberto,
  auditoriaAberta,
  jaCalculou,
  desatualizado,
  temValoresPreenchidos,
  onAbrirHistorico,
  onAbrirAuditoria,
  onNovaAnalise,
}: {
  sessao: SessaoDemo;
  /** Rótulo da análise em edição, quando houver. */
  referencia: string;
  historicoAberto: boolean;
  auditoriaAberta: boolean;
  jaCalculou: boolean;
  desatualizado: boolean;
  temValoresPreenchidos: boolean;
  onAbrirHistorico: () => void;
  onAbrirAuditoria: () => void;
  onNovaAnalise: () => void;
}) {
  const { total, validadas, pendentes } = resumoValidacao();
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

      {/*
        Vocabulário único: a análise se chama "análise" em toda a
        interface, do botão ao histórico.
      */}
      <p className="hidden min-w-0 flex-1 truncate text-[0.8125rem] text-ink-muted sm:block">
        {referencia || "Nova análise"}
      </p>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        {/*
          Estágio de validação: informação real E a porta da auditoria.
          Os dois papéis são o mesmo gesto — quem lê "13 pendentes"
          quer saber quais são —, e separá-los criaria dois controles
          para uma pergunta só.
        */}
        <BotaoBarra
          onClick={onAbrirAuditoria}
          expandido={auditoriaAberta}
          className="hidden min-[900px]:inline-flex"
        >
          <span
            aria-hidden="true"
            className={`size-2 shrink-0 rounded-full ${
              tudoValidado ? "bg-positivo" : "bg-atencao"
            }`}
          />
          {tudoValidado ? "Modelo revisado" : "Modelo em validação"}
          <span className="tnum text-ink-subtle">
            {validadas}/{total}
          </span>
          <span className="sr-only">
            {" "}
            premissas validadas — abrir premissas e auditoria
          </span>
        </BotaoBarra>

        {/* Abaixo de 900px o mesmo controle vira um rótulo curto. */}
        <BotaoBarra
          onClick={onAbrirAuditoria}
          expandido={auditoriaAberta}
          className="min-[900px]:hidden"
        >
          <span
            aria-hidden="true"
            className={`size-2 shrink-0 rounded-full ${
              tudoValidado ? "bg-positivo" : "bg-atencao"
            }`}
          />
          Auditoria
          <span className="sr-only"> — premissas e escopo do modelo</span>
        </BotaoBarra>

        <BotaoBarra onClick={onAbrirHistorico} expandido={historicoAberto}>
          <IconeHistorico />
          <span className="hidden min-[560px]:inline">Histórico</span>
          <span className="sr-only"> — análises recentes deste navegador</span>
        </BotaoBarra>

        {/* A ação primária da tela, em posição fixa e previsível. */}
        <BotaoNovaAnalise
          jaCalculou={jaCalculou}
          desatualizado={desatualizado}
          temValoresPreenchidos={temValoresPreenchidos}
          onNovaAnalise={onNovaAnalise}
          tamanho="sm"
          variante="primaria"
        />

        <BotaoInstalar />
        <AlternarTema />
        <MenuUsuario sessao={sessao} />
      </div>
    </header>
  );
}

/** Controle secundário da barra: abre um painel, e declara que abre. */
function BotaoBarra({
  onClick,
  expandido,
  className,
  children,
}: {
  onClick: () => void;
  expandido: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={expandido}
      className={[
        "alvo-toque inline-flex min-h-8 items-center gap-1.5 rounded-md border",
        "border-border-strong bg-surface px-2 text-[0.8125rem] text-ink-muted",
        "transition-colors hover:bg-surface-hover hover:text-ink",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}
