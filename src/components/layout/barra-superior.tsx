"use client";

import { Logo } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { AlternarTema } from "@/components/tema/alternar-tema";
import { BotaoInstalar } from "@/components/pwa/botao-instalar";
import { MenuUsuario } from "@/features/sessao/components/menu-usuario";
import { resumoValidacao } from "@/features/simulacao/domain/calculation-rules";
import { BotaoNovaAnalise } from "@/features/simulacao/components/botao-nova-analise";
import {
  estadoDaRevisao,
  etiquetaDaAnalise,
} from "@/features/simulacao/components/revisao-calculo";
import type { SessaoDemo } from "@/features/sessao/schemas/sessao-schema";

/**
 * BARRA SUPERIOR — três grupos, e nenhum jargão interno.
 *
 *   ESQUERDA   quem é o produto e QUAL análise está aberta
 *   DIREITA    o que fazer: revisar, consultar, começar outra
 *   EXTREMA    tema e conta
 *
 * O princípio é a correspondência com o mundo real: cada controle
 * nomeia uma TAREFA que o contador já executa, não um subsistema do
 * produto. Foi o que motivou duas trocas:
 *
 * - "Modelo em validação 13/18" virou "Revisar cálculo · 13
 *   pendências". A fração era um placar interno: obrigava a inferir o
 *   que media, se era problema, se era clicável e o que abria. O
 *   número continua o mesmo e continua derivado das premissas reais —
 *   o que mudou é que agora ele dimensiona um trabalho;
 * - "Premissas" e "Auditoria" deixaram de ser duas portas. São a mesma
 *   tarefa, e duas entradas para uma tarefa só é uma escolha a mais
 *   para tomar. A terminologia detalhada vive DENTRO do painel: o
 *   cabeçalho representa a tarefa do contador, o painel representa a
 *   estrutura do sistema.
 *
 * A referência da análise ganhou o prefixo "Análise:" por um motivo
 * concreto: sem ele, o rótulo livre à esquerda e o nome da conta à
 * direita podiam ser a mesma palavra, um do lado do outro, significando
 * coisas diferentes.
 *
 * Nada aqui é ícone sozinho. Os ícones do tema e da instalação são
 * convenções universais e de baixo risco, e mesmo eles carregam nome
 * acessível e `title`.
 */
export function BarraSuperior({
  sessao,
  referencia,
  historicoAberto,
  revisaoAberta,
  jaCalculou,
  desatualizado,
  temValoresPreenchidos,
  onAbrirHistorico,
  onAbrirRevisao,
  onNovaAnalise,
}: {
  sessao: SessaoDemo;
  /** Rótulo livre da análise em edição, quando houver. */
  referencia: string;
  historicoAberto: boolean;
  revisaoAberta: boolean;
  jaCalculou: boolean;
  desatualizado: boolean;
  temValoresPreenchidos: boolean;
  onAbrirHistorico: () => void;
  onAbrirRevisao: () => void;
  onNovaAnalise: () => void;
}) {
  const revisao = estadoDaRevisao(resumoValidacao());
  const etiqueta = etiquetaDaAnalise({ jaCalculou, desatualizado });
  const rotuloReferencia = referencia.trim();

  return (
    <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-1.5 border-b border-border-base bg-background/95 px-3 backdrop-blur sm:gap-2 sm:px-4">
      {/* ---------- ESQUERDA · contexto atual ---------- */}
      <div className="flex shrink-0 items-center gap-2">
        <Logo className="size-6 shrink-0" />
        <span className="hidden text-[0.9375rem] font-semibold tracking-tight text-ink min-[480px]:inline">
          Clareza
        </span>
      </div>

      {/*
        Identidade da análise. É ESTADO, não ação: sem contorno, sem
        cursor de clique, sem hover. O contador não deve precisar testar
        um elemento para descobrir se ele faz alguma coisa.
      */}
      <div className="hidden min-w-0 flex-1 items-center gap-2 sm:flex">
        <span
          aria-hidden="true"
          className="h-4 w-px shrink-0 bg-border-base"
        />
        <p className="flex min-w-0 items-baseline gap-1.5 text-[0.8125rem]">
          <span className="shrink-0 text-ink-subtle">Análise:</span>
          {/* `title` devolve o nome inteiro quando o truncamento corta. */}
          <span
            title={rotuloReferencia || undefined}
            className={`truncate ${
              rotuloReferencia
                ? "font-medium text-ink"
                : "text-ink-muted"
            }`}
          >
            {rotuloReferencia || "sem referência"}
          </span>
        </p>

        {etiqueta && (
          <span className="hidden shrink-0 min-[900px]:inline-flex">
            <Badge tom={etiqueta.tom} ponto={etiqueta.tom === "atencao"}>
              {etiqueta.texto}
              <span className="sr-only"> — {etiqueta.complemento}</span>
            </Badge>
          </span>
        )}
      </div>

      {/* ---------- DIREITA · ações do trabalho ---------- */}
      <div className="ml-auto flex shrink-0 items-center gap-1">
        {/*
          ATENÇÃO, não erro. Pendência de revisão é trabalho a fazer —
          âmbar. Vermelho fica reservado a cálculo que falhou ou entrada
          inválida, e gastá-lo aqui tiraria o peso de onde ele importa.
        */}
        <BotaoBarra
          onClick={onAbrirRevisao}
          expandido={revisaoAberta}
          atencao={revisao.precisaAtencao}
          nomeAcessivel={revisao.nomeAcessivel}
          title={revisao.resumo}
        >
          <span aria-hidden="true" className="shrink-0 leading-none">
            {revisao.precisaAtencao ? "⚠" : "✓"}
          </span>
          {/*
            O rótulo encolhe em três degraus, e nunca some sem deixar
            um número no lugar. O nome acessível não acompanha o
            encolhimento — ver `BotaoBarra`.
          */}
          <span className="hidden min-[480px]:inline min-[640px]:hidden">
            {revisao.precisaAtencao ? "Revisar" : "Revisado"}
          </span>
          <span className="hidden min-[640px]:inline">{revisao.rotulo}</span>
          {revisao.detalhe && (
            <>
              {/* Telas largas: a dimensão do trabalho, por extenso. */}
              <span className="hidden min-[1180px]:inline">
                · {revisao.detalhe}
              </span>
              {/* Telas estreitas: só o número, que é o que muda. */}
              <span className="tnum min-[1180px]:hidden">
                {revisao.detalhe.split(" ")[0]}
              </span>
            </>
          )}
        </BotaoBarra>

        <BotaoBarra
          onClick={onAbrirHistorico}
          expandido={historicoAberto}
          nomeAcessivel="Histórico: análises anteriores salvas neste navegador. Abre a lista."
          title="Análises anteriores salvas neste navegador"
        >
          Histórico
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

        {/* ---------- EXTREMA DIREITA · usuário ---------- */}
        <span
          aria-hidden="true"
          className="mx-0.5 hidden h-4 w-px shrink-0 bg-border-base sm:block"
        />
        {/*
          Em telas muito estreitas os dois controles de PREFERÊNCIA saem
          da barra — medido em navegador, eram eles que empurravam o
          cabeçalho para fora da tela a 360 e 390px. A escolha é
          deliberada: o que fica são as cinco respostas que o contador
          precisa ("qual análise", "o que conferir", "onde estão as
          anteriores", "como começo outra", "onde está minha conta"), e
          o que sai tem equivalente fora do produto — o próprio
          navegador oferece "Instalar aplicativo", e o tema segue a
          preferência do sistema para quem nunca clicou aqui.
        */}
        <span className="hidden min-[480px]:inline-flex">
          <BotaoInstalar />
        </span>
        <span className="hidden min-[400px]:inline-flex">
          <AlternarTema />
        </span>
        <MenuUsuario sessao={sessao} />
      </div>
    </header>
  );
}

/**
 * Controle secundário da barra: abre um painel, e declara que abre.
 *
 * `aria-haspopup="dialog"` e `aria-expanded` dizem, antes do clique, o
 * que vai acontecer e se já aconteceu — e o estado aberto também é
 * visível, não só anunciado.
 *
 * `nomeAcessivel` é obrigatório *no tipo*. Parte do rótulo some em
 * telas estreitas, e um controle cujo nome encolhe junto com a largura
 * da janela é um controle que muda de significado sem avisar. O nome
 * começa sempre pelo texto visível, para que ler e ouvir coincidam.
 */
function BotaoBarra({
  onClick,
  expandido,
  atencao,
  nomeAcessivel,
  title,
  children,
}: {
  onClick: () => void;
  expandido: boolean;
  atencao?: boolean;
  nomeAcessivel: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={expandido}
      aria-label={nomeAcessivel}
      title={title}
      className={[
        "alvo-toque inline-flex min-h-8 items-center gap-1.5 rounded-md border",
        "px-2 text-[0.8125rem] transition-colors",
        atencao
          ? "border-atencao/50 bg-atencao-soft text-atencao hover:border-atencao"
          : "border-border-strong bg-surface text-ink-muted hover:bg-surface-hover hover:text-ink",
        /* Painel aberto: o botão que o abriu continua dizendo isso. */
        expandido ? "ring-1 ring-accent/40" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}
