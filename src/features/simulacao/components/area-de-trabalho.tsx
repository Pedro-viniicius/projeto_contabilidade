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
import { registrarEvento } from "@/lib/analytics";
import { formatarMoeda } from "@/lib/format";
import { useHidratado, useValorLocal } from "@/lib/armazenamento-reativo";
import { FormularioFeedback } from "@/features/feedback/components/formulario-feedback";
import {
  CHAVE_SESSAO,
  lerSessaoDemo,
} from "@/features/sessao/services/sessao-demo";
import { classificacaoDe, simular } from "../domain/calcular";
import { conferirEntrada } from "../domain/avisos-entrada";
import {
  mesmaEntrada,
  proLaboreSugerido,
  simulacaoSchema,
  TAMANHO_MAX_REFERENCIA,
  valoresPadrao,
  type EntradaSimulacaoValidada,
} from "../schemas/simulacao-schema";
import {
  abrirDoHistorico,
  CHAVE_ATUAL,
  descartarSimulacaoAtual,
  lerDoHistorico,
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
import { PainelAuditoria } from "./painel-auditoria";
import { HistoricoSimulacoes } from "./historico-simulacoes";
import { atalhoDeveCalcular } from "./atalho-recalculo";
import type { EntradaSimulacao } from "../types";

/** Referência estável: evita recriar o objeto a cada render. */
const PADRAO = valoresPadrao();

type Gaveta =
  | null
  | "historico"
  | "revisao"
  | "premissas"
  | "escopo"
  | "feedback";

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

/*
 * `auditoria` continua aceito: era o valor publicado em `?painel=` até
 * a v2.4 e pode estar em atalho do PWA instalado ou em link salvo.
 * Endereço antigo que deixa de funcionar é trabalho perdido de quem
 * salvou o atalho.
 */
const PAINEIS_DA_URL: Readonly<Record<string, Gaveta>> = {
  premissas: "premissas",
  escopo: "escopo",
  feedback: "feedback",
  historico: "historico",
  revisao: "revisao",
  auditoria: "revisao",
};

function painelDaUrl(): Gaveta {
  const alvo = new URLSearchParams(window.location.search).get("painel");
  return alvo === null ? null : (PAINEIS_DA_URL[alvo] ?? null);
}

/**
 * ÁREA DE TRABALHO — a tela única do contador.
 *
 * Duas zonas permanentes, e só duas:
 *
 *   ESQUERDA  — dados da análise (≈40% da largura)
 *   DIREITA   — resultado, comparação e auditoria (≈60%)
 *
 * Histórico, premissas, escopo e observações abrem em painel lateral
 * sobreposto, sob demanda, com a análise visível atrás. Até a v2.3 uma
 * terceira coluna permanente de contexto ficava fixa à direita nas
 * telas largas: consumia largura o dia inteiro para exibir informação
 * consultada pontualmente, e essa largura saía justamente de onde o
 * contador trabalha.
 *
 * Depois do acesso não há troca de rota. É isso que garante que o
 * contexto da análise em andamento nunca se perde.
 */
export function AreaDeTrabalho() {
  const router = useRouter();
  const hidratado = useHidratado();
  const sessao = useValorLocal(CHAVE_SESSAO, lerSessaoDemo);
  const leituraAtual = useValorLocal(CHAVE_ATUAL, lerSimulacaoAtual);
  const salva = leituraAtual?.registro ?? null;

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

  /* Falha de gravação: o cálculo continua na tela mesmo sem persistir. */
  const [avisoPersistencia, setAviso] = useState<string | null>(null);

  /*
   * Entrada que produziu o resultado exibido. Separá-la do rascunho é o
   * que permite mostrar "resultados desatualizados" e atualizar sob
   * comando.
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

  /*
   * Recorte com que o painel de premissas abre. "Ver 13 premissas
   * pendentes" que desemboca na lista completa quebra a promessa do
   * próprio rótulo — o contador teria de refazer o filtro que acabou
   * de pedir.
   */
  const [filtroPremissas, setFiltroPremissas] = useState<
    "todas" | "pendentes"
  >("todas");

  function abrirPremissas(filtro: "todas" | "pendentes" = "todas") {
    setFiltroPremissas(filtro);
    setGaveta("premissas");
  }

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

  /*
   * Enquadramento do RASCUNHO, não do último cálculo.
   *
   * A classificação responde antes de calcular — é ela que decide
   * quais campos o formulário mostra. Se dependesse do resultado, o
   * contador escolheria a atividade e nada mudaria na tela até
   * clicar em Calcular, invertendo justamente a ordem que o contador
   * pediu.
   */
  const classificacao = useMemo(() => classificacaoDe(entrada), [entrada]);

  /*
   * Conferências do rascunho, também em tempo real: o valor estranho
   * precisa ser questionado ENQUANTO se digita, não depois que o
   * resultado já saiu com ele dentro. Não bloqueiam nada — quem
   * bloqueia é o schema, no clique.
   */
  const avisos = useMemo(
    () =>
      conferirEntrada(entrada, {
        sujeitaFatorR: classificacao.sujeitaFatorR,
      }),
    [entrada, classificacao.sujeitaFatorR],
  );

  const desatualizado =
    entradaExibida !== null && !mesmaEntrada(entrada, entradaExibida);

  /*
   * Há algo digitado que valha a pena preservar? É o que decide se
   * "Nova análise" precisa confirmar. Comparar com os padrões é exato:
   * dispensa adivinhar campo a campo o que conta como "preenchido".
   */
  const temValoresPreenchidos =
    !mesmaEntrada(entrada, PADRAO) || referencia.trim() !== "";

  /*
   * Aviso derivado, não semeado por efeito.
   *
   * Registro ilegível é apenas ignorado na leitura — a chave fica onde
   * está e é sobrescrita no próximo cálculo, ou removida em "Nova
   * análise". Não apagamos nada durante o render, e a tela volta ao
   * estado inicial em vez de quebrar.
   */
  const aviso =
    avisoPersistencia ??
    (leituraAtual?.descartado
      ? "A análise que estava aberta neste navegador está ilegível e foi ignorada. O histórico não foi afetado."
      : null);

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
    /* `salva?.id` mantém a identidade: atualizar os resultados altera a
       mesma análise em vez de inserir uma nova a cada clique. */
    const gravacao = salvarSimulacao(resultado.data, referencia, salva?.id);
    setAviso(
      gravacao.persistido
        ? null
        : gravacao.motivo === "sem-espaco"
          ? "Não foi possível salvar esta análise: o armazenamento deste navegador está cheio. O resultado continua disponível nesta tela."
          : "Não foi possível salvar esta análise neste navegador. O resultado continua disponível nesta tela.",
    );
    setCalculada(resultado.data);
    registrarEvento(calculada ? "simulation_edited" : "simulation_completed", {
      tipo_atuacao: resultado.data.tipoAtuacao,
    });
  }, [entrada, referencia, calculada, salva?.id]);

  /*
   * Ctrl/Cmd + Enter atualiza de qualquer lugar da ÁREA DE TRABALHO —
   * nunca de dentro de um painel sobreposto.
   */
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.target instanceof Element ? e.target : null;
      if (
        !atalhoDeveCalcular({
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          key: e.key,
          dentroDeDialogo: alvo?.closest('[role="dialog"]') != null,
          gavetaAberta: gaveta !== null,
        })
      ) {
        return;
      }
      e.preventDefault();
      calcular();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [calcular, gaveta]);

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

  /*
   * Altera VÁRIOS campos de uma vez.
   *
   * Chamar `atualizar` duas vezes seguidas no mesmo manipulador não
   * funciona: as duas leem o mesmo `entrada` do closure, e a segunda
   * descarta a alteração da primeira. Era o que fazia "Voltar ao
   * automático" não voltar — ele limpava o anexo e o motivo em duas
   * chamadas, e só o motivo sobrevivia.
   */
  function atualizarVarios(patch: Partial<EntradaSimulacaoValidada>) {
    setRascunho({ ...entrada, ...patch });
    setErros((atual) => {
      const limpos = { ...atual };
      for (const campo of Object.keys(patch) as (keyof ErrosSimulacao)[]) {
        limpos[campo] = undefined;
      }
      return limpos;
    });
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
    setAviso(null);
    setGaveta(null);
  }

  /**
   * Copia uma análise do histórico para uma análise NOVA.
   *
   * Descarta a identidade de propósito: sem isso o próximo cálculo
   * sobrescreveria o registro original, e "duplicar" teria virado
   * "editar". O original fica intacto no histórico; o que está nos
   * campos ainda não foi salvo, e é o cálculo que cria o novo registro.
   */
  function duplicarRegistro(id: string) {
    const registro = lerDoHistorico(id);
    if (!registro) return;
    descartarSimulacaoAtual();
    proLaboreTocado.current = true;
    setRascunho(registro.entrada);
    setReferenciaRascunho(
      `${registro.referencia ?? "Análise"} (cópia)`.slice(
        0,
        TAMANHO_MAX_REFERENCIA,
      ),
    );
    setCalculada(null);
    setErros({});
    setAviso(null);
    setGaveta(null);
    registrarEvento("simulation_started");
  }

  function novaAnalise() {
    descartarSimulacaoAtual();
    proLaboreTocado.current = false;
    setRascunho(PADRAO);
    setReferenciaRascunho("");
    setCalculada(null);
    setErros({});
    setAviso(null);
    setGaveta(null);
    registrarEvento("simulation_started");
    formRef.current?.querySelector<HTMLInputElement>("input")?.focus();
  }

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
        historicoAberto={gaveta === "historico"}
        revisaoAberta={gaveta === "revisao"}
        jaCalculou={simulacao !== null}
        desatualizado={desatualizado}
        temValoresPreenchidos={temValoresPreenchidos}
        onAbrirHistorico={() => setGaveta("historico")}
        onAbrirRevisao={() => setGaveta("revisao")}
        onNovaAnalise={novaAnalise}
      />

      <main id="conteudo" className="min-h-0 flex-1">
        {/*
          Duas colunas a partir de 960px, na proporção ≈40/60 que o
          trabalho pede: a esquerda precisa caber PF e CNPJ lado a lado
          (o que acontece a partir de 1280px), e a direita precisa caber
          uma tabela de quatro colunas sem rolagem horizontal.
          `minmax(0,·)` nas duas faixas impede que uma tabela larga
          estoure a grade e empurre a página.
        */}
        <div className="grid min-[960px]:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] min-[1180px]:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] min-[1600px]:grid-cols-[minmax(0,38fr)_minmax(0,62fr)] min-[1800px]:mx-auto min-[1800px]:max-w-[120rem]">
          {/* ZONA 1 — dados, sempre visíveis. */}
          <section
            aria-label="Dados da análise"
            /*
              `@container`: os campos de PF e CNPJ passam a dividir-se
              em duas colunas conforme a largura DESTA coluna, não a da
              janela. Com media query, um contador em meia tela via os
              cenários lado a lado numa coluna estreita demais; e a
              mesma coluna, larga, ficava empilhada só porque a janela
              era pequena. A pergunta certa é "cabe aqui?".
            */
            className="coluna-rolavel @container flex min-w-0 flex-col border-b border-border-base min-[960px]:border-b-0 min-[960px]:border-r"
          >
            <FormularioSimulacao
              entrada={entrada}
              classificacao={classificacao}
              referencia={referencia}
              erros={erros}
              avisos={avisos}
              jaCalculou={simulacao !== null}
              desatualizado={desatualizado}
              salvo={salva !== null && avisoPersistencia === null}
              atualizadoEm={salva?.atualizadaEm ?? salva?.criadaEm}
              aviso={aviso}
              formRef={formRef}
              onCampo={atualizar}
              onCampos={atualizarVarios}
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
                ? `Resultados atualizados. Diferença estimada de ${formatarMoeda(
                    simulacao.comparacao.diferencaMensal,
                  )} por mês.`
                : ""}
            </div>

            {simulacao ? (
              <PainelResultado
                simulacao={simulacao}
                desatualizado={desatualizado}
                onAbrirPremissas={(filtro) => abrirPremissas(filtro)}
              />
            ) : (
              <Painel className="px-4 py-10">
                <p className="text-[0.875rem] font-medium text-ink">
                  Nenhum cálculo executado
                </p>
                <p className="mt-1 max-w-md text-[0.8125rem] leading-relaxed text-ink-muted">
                  Preencha os dados ao lado e atualize os resultados para
                  comparar os cenários. Comece pela atividade: é ela que define
                  o anexo do Simples e quais valores precisam ser informados.
                </p>
                <dl
                  id="minimo-necessario"
                  className="mt-4 max-w-md space-y-1.5 border-t border-border-base pt-3"
                >
                  <p className="rotulo-secao">Mínimo necessário</p>
                  <Requisito
                    rotulo="Receita bruta mensal"
                    ok={entrada.receitaMensal > 0}
                  />
                  <Requisito
                    rotulo="Custos do negócio (pode ser zero)"
                    ok={entrada.custosMensais >= 0}
                  />
                  <Requisito
                    rotulo="Atividade identificada (define o anexo)"
                    ok={classificacao.anexo !== null}
                  />
                </dl>
                {/*
                  Sem botão aqui, de propósito. "Calcular análise" já é a
                  ação primária fixa no rodapé da coluna de dados, e um
                  segundo botão idêntico visível ao mesmo tempo obrigaria
                  a decidir em qual clicar antes de decidir o que fazer.
                */}
              </Painel>
            )}
          </section>
        </div>
      </main>

      <PainelLateral
        aberto={gaveta === "historico"}
        titulo="Análises recentes"
        descricao="Salvas neste navegador. Abrir retoma a análise; duplicar copia os valores para uma nova."
        onFechar={() => setGaveta(null)}
      >
        <HistoricoSimulacoes
          idAtual={salva?.id ?? null}
          onAbrir={abrirRegistro}
          onDuplicar={duplicarRegistro}
        />
      </PainelLateral>

      <PainelLateral
        aberto={gaveta === "revisao"}
        titulo="Revisar cálculo"
        descricao="O que sustenta o número: estágio de validação, premissas e escopo."
        onFechar={() => setGaveta(null)}
      >
        <PainelAuditoria
          onAbrirPremissas={() => abrirPremissas()}
          onAbrirEscopo={() => setGaveta("escopo")}
          onAbrirFeedback={() => setGaveta("feedback")}
        />
      </PainelLateral>

      <PainelLateral
        aberto={gaveta === "premissas"}
        titulo="Premissas do modelo"
        descricao="Cada linha é um parâmetro usado pelo motor de cálculo."
        largura="larga"
        onFechar={() => setGaveta(null)}
      >
        <PainelPremissas filtroInicial={filtroPremissas} />
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
