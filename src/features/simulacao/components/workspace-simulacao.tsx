"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CampoMoeda } from "@/components/ui/campo-moeda";
import { CampoTexto } from "@/components/ui/campo-texto";
import { Escolha } from "@/components/ui/escolha";
import { Painel, PainelCabecalho, GrupoCampos } from "@/components/ui/painel";
import { registrarEvento } from "@/lib/analytics";
import { formatarMoeda } from "@/lib/format";
import { useHidratado, useValorLocal } from "@/lib/armazenamento-reativo";
import { simular } from "../domain/calcular";
import { REGRAS } from "../domain/calculation-rules";
import {
  proLaboreSugerido,
  simulacaoSchema,
  valoresPadrao,
  type EntradaSimulacaoValidada,
} from "../schemas/simulacao-schema";
import {
  CHAVE_ATUAL,
  lerSimulacaoAtual,
  salvarSimulacao,
} from "../services/simulacao-storage";
import { PainelResultado } from "./painel-resultado";
import type { EntradaSimulacao } from "../types";

type Erros = Partial<Record<keyof EntradaSimulacaoValidada, string>>;

/** Referência estável: evita recriar o objeto a cada render. */
const PADRAO = valoresPadrao();

/** Atalho do sistema, exibido discretamente ao lado da ação. */
const ehMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export function WorkspaceSimulacao() {
  const hidratado = useHidratado();
  const salva = useValorLocal(CHAVE_ATUAL, lerSimulacaoAtual);

  /*
   * `rascunho` é o que está nos campos. Enquanto o contador não digita
   * nada, cai na última simulação do aparelho e, por fim, nos padrões.
   * Nenhum efeito precisa semear o formulário.
   */
  const [rascunho, setRascunho] = useState<EntradaSimulacaoValidada | null>(
    null,
  );
  const [referenciaRascunho, setReferenciaRascunho] = useState<string | null>(
    null,
  );
  const [erros, setErros] = useState<Erros>({});

  /*
   * Entrada que produziu o resultado exibido. Separá-la do rascunho é o
   * que permite mostrar "valores alterados" e recalcular sob comando —
   * mais estável que recalcular a cada tecla.
   */
  const [calculada, setCalculada] = useState<EntradaSimulacao | null>(null);
  const proLaboreTocado = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const resultadoRef = useRef<HTMLDivElement>(null);

  const entrada = rascunho ?? salva?.entrada ?? PADRAO;
  const referencia = referenciaRascunho ?? salva?.referencia ?? "";

  /* Ao abrir com simulação salva, o resultado já aparece calculado. */
  const entradaExibida = calculada ?? salva?.entrada ?? null;
  const simulacao = useMemo(
    () => (entradaExibida ? simular(entradaExibida) : null),
    [entradaExibida],
  );

  const desatualizado =
    entradaExibida !== null &&
    JSON.stringify(entrada) !== JSON.stringify(entradaExibida);

  function atualizar<K extends keyof EntradaSimulacaoValidada>(
    campo: K,
    valor: EntradaSimulacaoValidada[K],
  ) {
    const proximo = { ...entrada, [campo]: valor };
    /* Só sugerimos pró-labore em simulação nova e ainda não editada. */
    if (campo === "receitaMensal" && !proLaboreTocado.current && !salva) {
      proximo.proLabore = proLaboreSugerido(valor as number);
    }
    setRascunho(proximo);
    setErros((atual) => ({ ...atual, [campo]: undefined }));
  }

  const calcular = useCallback(() => {
    const resultado = simulacaoSchema.safeParse(entrada);
    if (!resultado.success) {
      const novos: Erros = {};
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0] as keyof EntradaSimulacaoValidada;
        if (!novos[campo]) novos[campo] = issue.message;
      }
      setErros(novos);
      /* Leva o foco ao primeiro campo com problema. */
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

  /* Ctrl/Cmd + Enter calcula de qualquer campo do formulário. */
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

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6">
      <header className="mb-4">
        <h1 className="text-lg font-semibold tracking-tight text-ink">
          Simulação
        </h1>
        <p className="mt-0.5 text-[0.8125rem] text-ink-muted">
          Informe os dados e compare os cenários Pessoa Física e CNPJ.
        </p>
      </header>

      {/*
        Duas colunas a partir de 1024px: entrada e resposta convivem, que
        é a mudança central da V2. Abaixo disso, empilham.
      */}
      {/*
        `min-w-0` nos filhos é obrigatório: itens de grid nascem com
        min-width:auto e, sem isso, as tabelas largas esticam a coluna em
        vez de rolar dentro do próprio contêiner.
      */}
      <div className="grid items-start gap-4 min-[960px]:grid-cols-[minmax(20rem,22rem)_minmax(0,1fr)]">
        <Painel className="min-w-0 min-[960px]:sticky min-[960px]:top-4">
          <PainelCabecalho titulo="Dados da simulação" />

          <form
            ref={formRef}
            onSubmit={(e) => {
              e.preventDefault();
              calcular();
            }}
            noValidate
            className="space-y-3.5 px-4 py-3.5"
          >
            <GrupoCampos titulo="Enquadramento">
              <Escolha
                legenda="Situação atual do cliente"
                valor={entrada.tipoAtuacao}
                onChange={(v) => atualizar("tipoAtuacao", v)}
                opcoes={[
                  {
                    valor: "pessoa-fisica",
                    rotulo: "Pessoa Física",
                    descricao:
                      "Autônomo, com recolhimento de INSS e carnê-leão.",
                  },
                  {
                    valor: "cnpj",
                    rotulo: "CNPJ",
                    descricao:
                      "Prestador de serviço com empresa e pró-labore.",
                  },
                ]}
              />
              <CampoTexto
                rotulo="Referência"
                opcional
                maxLength={60}
                valor={referencia}
                onChange={setReferenciaRascunho}
                placeholder="Ex.: Cliente XPTO — cenário 01"
                ajuda="Rótulo local para reencontrar esta simulação. Fica só neste aparelho."
              />
            </GrupoCampos>

            <GrupoCampos titulo="Receita e custos">
              <CampoMoeda
                rotulo="Receita bruta mensal"
                valor={entrada.receitaMensal}
                onChange={(v) => atualizar("receitaMensal", v)}
                erro={erros.receitaMensal}
              />
              <CampoMoeda
                rotulo="Custos do negócio"
                valor={entrada.custosMensais}
                onChange={(v) => atualizar("custosMensais", v)}
                erro={erros.custosMensais}
                ajuda="Custos operacionais dedutíveis. Não inclui despesas pessoais."
              />
            </GrupoCampos>

            <GrupoCampos titulo="Parâmetros do cenário CNPJ">
              <CampoMoeda
                rotulo="Pró-labore mensal"
                valor={entrada.proLabore}
                onChange={(v) => {
                  proLaboreTocado.current = true;
                  atualizar("proLabore", v);
                }}
                erro={erros.proLabore}
                sugestao={
                  entrada.receitaMensal > 0
                    ? {
                        texto: `Aplicar ${formatarMoeda(
                          proLaboreSugerido(entrada.receitaMensal),
                        )}`,
                        onAplicar: () => {
                          proLaboreTocado.current = true;
                          atualizar(
                            "proLabore",
                            proLaboreSugerido(entrada.receitaMensal),
                          );
                        },
                      }
                    : undefined
                }
                ajuda={`Sugestão de ${(
                  REGRAS.cnpj.proLaborePercentualSugerido.valor * 100
                ).toLocaleString("pt-BR")}% da receita. O modelo não calcula Fator R.`}
              />
              <CampoMoeda
                rotulo="Honorários contábeis"
                valor={entrada.custoContabilidade}
                onChange={(v) => atualizar("custoContabilidade", v)}
                erro={erros.custoContabilidade}
              />
            </GrupoCampos>

            <div className="flex items-center gap-2 border-t border-border-base pt-3.5">
              <Button type="submit" tamanho="lg" className="flex-1">
                {simulacao ? "Recalcular" : "Calcular"}
              </Button>
              <kbd
                aria-hidden="true"
                className="hidden shrink-0 rounded-sm border border-border-strong px-1.5 py-1 text-[0.6875rem] text-ink-subtle min-[960px]:block"
              >
                {ehMac ? "⌘" : "Ctrl"}+↵
              </kbd>
            </div>
            <p className="sr-only">
              Atalho: {ehMac ? "Command" : "Control"} mais Enter calcula a
              simulação.
            </p>
          </form>
        </Painel>

        <div ref={resultadoRef} className="min-w-0">
          {/* aria-live: o resultado novo é anunciado sem mover o foco. */}
          <div aria-live="polite" className="sr-only">
            {simulacao && !desatualizado
              ? `Resultado atualizado. Diferença estimada de ${formatarMoeda(
                  simulacao.comparacao.diferencaMensal,
                )} por mês.`
              : ""}
          </div>

          {!hidratado ? (
            <Painel className="px-4 py-10 text-center">
              <p className="text-[0.8125rem] text-ink-muted" role="status">
                Carregando…
              </p>
            </Painel>
          ) : simulacao ? (
            <PainelResultado
              simulacao={simulacao}
              desatualizado={desatualizado}
            />
          ) : (
            <Painel className="px-4 py-12 text-center">
              <p className="text-[0.875rem] font-medium text-ink">
                Nenhum cálculo executado
              </p>
              <p className="mx-auto mt-1 max-w-sm text-[0.8125rem] leading-snug text-ink-muted">
                Preencha a receita e os custos ao lado e execute o cálculo para
                ver a comparação entre os cenários.
              </p>
            </Painel>
          )}
        </div>
      </div>
    </div>
  );
}
