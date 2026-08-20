"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { BarraSuperior } from "@/components/layout/barra-superior";
import { PainelLateral } from "@/components/ui/painel-lateral";
import { Painel } from "@/components/ui/painel";
import { Button } from "@/components/ui/button";
import { registrarEvento } from "@/lib/analytics";
import { formatarMoeda } from "@/lib/format";
import { useHidratado, useValorLocal } from "@/lib/armazenamento-reativo";
import { FormularioFeedback } from "@/features/feedback/components/formulario-feedback";
import {
  CHAVE_SESSAO,
  lerSessaoDemo,
} from "@/features/sessao/services/sessao-demo";
import { simular } from "../domain/calcular";
import {
  proLaboreSugerido,
  simulacaoSchema,
  valoresPadrao,
  type EntradaSimulacaoValidada,
} from "../schemas/simulacao-schema";
import {
  abrirDoHistorico,
  CHAVE_ATUAL,
  descartarSimulacaoAtual,
  lerSimulacaoAtual,
  salvarSimulacao,
} from "../services/simulacao-storage";
import {
  FormularioSimulacao,
  type ErrosSimulacao,
} from "./formulario-simulacao";
import { PainelResultado } from "./painel-resultado";
import { PainelPremissas } from "./painel-premissas";
import { PainelEscopo } from "./painel-escopo";
import { ZonaContexto } from "./zona-contexto";
import type { EntradaSimulacao } from "../types";

/** Referência estável: evita recriar o objeto a cada render. */
const PADRAO = valoresPadrao();

type Gaveta = null | "premissas" | "escopo" | "feedback" | "contexto";

/*
 * `?painel=` abre um painel já na chegada. É o que mantém úteis os
 * atalhos do PWA instalado e os endereços antigos de `/premissas`,
 * `/feedback` e `/como-funciona`, sem que nada disso volte a ser uma
 * rota separada.
 *
 * A URL é fonte externa e imutável durante a vida da tela: lida por
 * snapshot, e não por efeito que semeia estado. `useSearchParams()`
 * exigiria uma fronteira de Suspense em volta da tela inteira.
 */
const semInscricao = () => () => {};
const semPainel = (): Gaveta => null;

function painelDaUrl(): Gaveta {
  const alvo = new URLSearchParams(window.location.search).get("painel");
  return alvo === "premissas" || alvo === "escopo" || alvo === "feedback"
    ? alvo
    : null;
}

/**
 * ÁREA DE TRABALHO — a tela única do contador.
 *
 * Todas as operações profissionais acontecem aqui: entrada de dados,
 * cálculo, comparativo, auditoria da composição, premissas, histórico e
 * feedback. Depois do acesso não há mais troca de rota, e é isso que
 * garante que o contexto da análise em andamento nunca se perde.
 *
 * O que é permanente fica em colunas; o que é consultivo abre em painel
 * lateral por cima, com a análise visível atrás.
 */
export function AreaDeTrabalho() {
  const router = useRouter();
  const hidratado = useHidratado();
  const sessao = useValorLocal(CHAVE_SESSAO, lerSessaoDemo);
  const salva = useValorLocal(CHAVE_ATUAL, lerSimulacaoAtual);

  /*
   * `rascunho` é o que está nos campos. Enquanto o contador não digita
   * nada, cai na última análise do aparelho e, por fim, nos padrões.
   */
  const [rascunho, setRascunho] = useState<EntradaSimulacaoValidada | null>(
    null,
  );
  const [referenciaRascunho, setReferenciaRascunho] = useState<string | null>(
    null,
  );
  const [erros, setErros] = useState<ErrosSimulacao>({});

  /*
   * Entrada que produziu o resultado exibido. Separá-la do rascunho é o
   * que permite mostrar "valores alterados" e recalcular sob comando.
   */
  const [calculada, setCalculada] = useState<EntradaSimulacao | null>(null);

  /* `undefined` = o contador ainda não mexeu; vale o que a URL pediu. */
  const gavetaInicial = useSyncExternalStore(
    semInscricao,
    painelDaUrl,
    semPainel,
  );
  const [gavetaEscolhida, setGaveta] = useState<Gaveta | undefined>(undefined);
  const gaveta = gavetaEscolhida === undefined ? gavetaInicial : gavetaEscolhida;

  const proLaboreTocado = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const entrada = rascunho ?? salva?.entrada ?? PADRAO;
  const referencia = referenciaRascunho ?? salva?.referencia ?? "";

  /* Ao abrir com análise salva, o resultado já aparece calculado. */
  const entradaExibida = calculada ?? salva?.entrada ?? null;
  const simulacao = useMemo(
    () => (entradaExibida ? simular(entradaExibida) : null),
    [entradaExibida],
  );

  const desatualizado =
    entradaExibida !== null &&
    JSON.stringify(entrada) !== JSON.stringify(entradaExibida);

  /* Sem sessão local não há área de trabalho: volta para o acesso. */
  useEffect(() => {
    if (hidratado && !sessao) router.replace("/login");
  }, [hidratado, sessao, router]);

  const calcular = useCallback(() => {
    const resultado = simulacaoSchema.safeParse(entrada);
    if (!resultado.success) {
      const novos: ErrosSimulacao = {};
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0] as keyof EntradaSimulacaoValidada;
        if (!novos[campo]) novos[campo] = issue.message;
      }
      setErros(novos);
      /* Leva o foco ao primeiro campo com problema, sem apagar nada. */
      formRef.current
        ?.querySelector<HTMLInputElement>('[aria-invalid="true"]')
        ?.focus();
      return;
    }

    setErros({});
    salvarSimulacao(resultado.data, referencia);
    setCalculada(resultado.data);
    registrarEvento(calculada ? "simulation_edited" : "simulation_completed", {
      tipo_atuacao: resultado.data.tipoAtuacao,
    });
  }, [entrada, referencia, calculada]);

  /* Ctrl/Cmd + Enter calcula de qualquer lugar da área de trabalho. */
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        calcular();
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [calcular]);

  function atualizar<K extends keyof EntradaSimulacaoValidada>(
    campo: K,
    valor: EntradaSimulacaoValidada[K],
  ) {
    const proximo = { ...entrada, [campo]: valor };
    /* Só sugerimos pró-labore em análise nova e ainda não editada. */
    if (campo === "receitaMensal" && !proLaboreTocado.current && !salva) {
      proximo.proLabore = proLaboreSugerido(valor as number);
    }
    setRascunho(proximo);
    setErros((atual) => ({ ...atual, [campo]: undefined }));
  }

  /** Repõe uma análise do histórico nos campos — sem trocar de tela. */
  function abrirRegistro(id: string) {
    const registro = abrirDoHistorico(id);
    if (!registro) return;
    proLaboreTocado.current = true;
    setRascunho(registro.entrada);
    setReferenciaRascunho(registro.referencia ?? "");
    setCalculada(registro.entrada);
    setErros({});
    setGaveta(null);
  }

  function novaAnalise() {
    descartarSimulacaoAtual();
    proLaboreTocado.current = false;
    setRascunho(PADRAO);
    setReferenciaRascunho("");
    setCalculada(null);
    setErros({});
    setGaveta(null);
    registrarEvento("simulation_started");
    formRef.current?.querySelector<HTMLInputElement>("input")?.focus();
  }

  const contexto = (
    <ZonaContexto
      idAtual={salva?.id ?? null}
      onAbrirRegistro={abrirRegistro}
      onNovaAnalise={novaAnalise}
      onAbrirPremissas={() => setGaveta("premissas")}
      onAbrirEscopo={() => setGaveta("escopo")}
      onAbrirFeedback={() => setGaveta("feedback")}
    />
  );

  /* Antes de saber se há sessão, nada de piscar a área de trabalho. */
  if (!hidratado || !sessao) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p role="status" className="text-[0.8125rem] text-ink-muted">
          Carregando área de trabalho…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <BarraSuperior
        sessao={sessao}
        referencia={referencia}
        onAbrirPremissas={() => setGaveta("premissas")}
        onAbrirContexto={() => setGaveta("contexto")}
      />

      <main id="conteudo" className="min-h-0 flex-1">
        <div className="grid min-[960px]:grid-cols-[21rem_minmax(0,1fr)] min-[1280px]:grid-cols-[21rem_minmax(0,1fr)_19.5rem]">
          {/* ZONA 1 — dados, sempre visíveis. */}
          <section
            aria-label="Dados da análise"
            className="coluna-rolavel flex min-w-0 flex-col border-b border-border-base min-[960px]:border-b-0 min-[960px]:border-r"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border-base bg-background px-4 py-2.5">
              <h2 className="text-[0.8125rem] font-semibold text-ink">
                Dados da análise
              </h2>
              <button
                type="button"
                onClick={novaAnalise}
                className="rounded-sm text-[0.75rem] text-accent hover:underline"
              >
                Nova
              </button>
            </div>

            <FormularioSimulacao
              entrada={entrada}
              referencia={referencia}
              erros={erros}
              jaCalculou={simulacao !== null}
              desatualizado={desatualizado}
              formRef={formRef}
              onCampo={atualizar}
              onProLabore={(v) => {
                proLaboreTocado.current = true;
                atualizar("proLabore", v);
              }}
              onReferencia={setReferenciaRascunho}
              onCalcular={calcular}
            />
          </section>

          {/* ZONA 2 — resultado e auditoria. */}
          <section
            aria-label="Resultado e comparativo"
            className="coluna-rolavel min-w-0 px-4 py-3.5"
          >
            {/* aria-live: o resultado novo é anunciado sem mover o foco. */}
            <div aria-live="polite" className="sr-only">
              {simulacao && !desatualizado
                ? `Resultado atualizado. Diferença estimada de ${formatarMoeda(
                    simulacao.comparacao.diferencaMensal,
                  )} por mês.`
                : ""}
            </div>

            {simulacao ? (
              <PainelResultado
                simulacao={simulacao}
                desatualizado={desatualizado}
                onAbrirPremissas={() => setGaveta("premissas")}
              />
            ) : (
              <Painel className="px-4 py-10">
                <p className="text-[0.875rem] font-medium text-ink">
                  Nenhum cálculo executado
                </p>
                <p className="mt-1 max-w-md text-[0.8125rem] leading-relaxed text-ink-muted">
                  Preencha os dados da análise e calcule para visualizar o
                  comparativo entre Pessoa Física e CNPJ.
                </p>
                <dl className="mt-4 max-w-md space-y-1.5 border-t border-border-base pt-3">
                  <p className="rotulo-secao">Mínimo necessário</p>
                  <Requisito
                    rotulo="Receita bruta mensal"
                    ok={entrada.receitaMensal > 0}
                  />
                  <Requisito
                    rotulo="Custos do negócio (pode ser zero)"
                    ok={entrada.custosMensais >= 0}
                  />
                </dl>
                <Button
                  className="mt-4"
                  onClick={calcular}
                  disabled={entrada.receitaMensal <= 0}
                >
                  Calcular
                </Button>
              </Painel>
            )}
          </section>

          {/* ZONA 3 — contexto. Vira painel lateral abaixo de 1280px. */}
          <aside
            aria-label="Contexto profissional"
            className="coluna-rolavel hidden min-w-0 border-l border-border-base min-[1280px]:block"
          >
            {contexto}
          </aside>
        </div>
      </main>

      <PainelLateral
        aberto={gaveta === "contexto"}
        titulo="Contexto"
        descricao="Histórico, premissas e revisão do modelo."
        onFechar={() => setGaveta(null)}
      >
        {contexto}
      </PainelLateral>

      <PainelLateral
        aberto={gaveta === "premissas"}
        titulo="Premissas do modelo"
        descricao="Cada linha é um parâmetro usado pelo motor de cálculo."
        largura="larga"
        onFechar={() => setGaveta(null)}
      >
        <PainelPremissas />
      </PainelLateral>

      <PainelLateral
        aberto={gaveta === "escopo"}
        titulo="Escopo do modelo"
        descricao="Limites explícitos do cálculo desta versão."
        onFechar={() => setGaveta(null)}
      >
        <PainelEscopo />
      </PainelLateral>

      <PainelLateral
        aberto={gaveta === "feedback"}
        titulo="Registrar observação"
        descricao="A análise em aberto é anexada ao registro."
        onFechar={() => setGaveta(null)}
      >
        <FormularioFeedback />
      </PainelLateral>
    </div>
  );
}

/** Requisito do estado vazio: marcador + texto, nunca só cor. */
function Requisito({ rotulo, ok }: { rotulo: string; ok: boolean }) {
  return (
    <div className="flex items-baseline gap-2 text-[0.8125rem] text-ink-muted">
      <span
        aria-hidden="true"
        className={ok ? "text-positivo" : "text-ink-subtle"}
      >
        {ok ? "✓" : "○"}
      </span>
      <span>{rotulo}</span>
      <span className="sr-only">{ok ? "preenchido" : "pendente"}</span>
    </div>
  );
}
