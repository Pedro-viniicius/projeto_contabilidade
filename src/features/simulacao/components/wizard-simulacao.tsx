"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CampoMoeda } from "@/components/ui/campo-moeda";
import { Escolha } from "@/components/ui/escolha";
import { AvisoContabil } from "@/components/ui/aviso-contabil";
import { registrarEvento } from "@/lib/analytics";
import { formatarMoeda } from "@/lib/format";
import { useValorLocal } from "@/lib/armazenamento-reativo";
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
import type { TipoAtuacao } from "../types";

type Erros = Partial<Record<keyof EntradaSimulacaoValidada, string>>;

const PASSOS = [
  { id: "perfil", titulo: "Seu perfil" },
  { id: "receita", titulo: "Quanto entra" },
  { id: "custos", titulo: "Quanto sai" },
  { id: "cnpj", titulo: "Cenário CNPJ" },
] as const;

/** Campos validados ao sair de cada passo. */
const CAMPOS_POR_PASSO: readonly (readonly (keyof EntradaSimulacaoValidada)[])[] =
  [["tipoAtuacao"], ["receitaMensal"], ["custosMensais"], ["proLabore", "custoContabilidade"]];

/** Referência estável: evita recriar o objeto a cada render. */
const PADRAO = valoresPadrao();

export function WizardSimulacao() {
  const router = useRouter();
  const [passo, setPasso] = useState(0);
  /*
   * A entrada exibida vem do rascunho do usuário; enquanto ele não
   * mexer em nada, cai na última simulação salva e, por fim, nos
   * valores padrão. Nenhum efeito precisa semear o formulário.
   */
  const salva = useValorLocal(CHAVE_ATUAL, lerSimulacaoAtual);
  const [rascunho, setRascunho] = useState<EntradaSimulacaoValidada | null>(
    null,
  );
  const entrada = rascunho ?? salva?.entrada ?? PADRAO;

  const [erros, setErros] = useState<Erros>({});
  /* Evita sugerir pró-labore por cima de um valor que o usuário editou. */
  const proLaboreTocado = useRef(false);
  const jaRegistrouInicio = useRef(false);

  useEffect(() => {
    if (jaRegistrouInicio.current) return;
    jaRegistrouInicio.current = true;
    registrarEvento("simulation_started");
  }, []);

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

  function validarPasso(indice: number): boolean {
    const resultado = simulacaoSchema.safeParse(entrada);
    if (resultado.success) return true;

    const campos = CAMPOS_POR_PASSO[indice];
    const doPasso: Erros = {};
    for (const issue of resultado.error.issues) {
      const campo = issue.path[0] as keyof EntradaSimulacaoValidada;
      if (campos.includes(campo) && !doPasso[campo]) {
        doPasso[campo] = issue.message;
      }
    }
    setErros(doPasso);
    return Object.keys(doPasso).length === 0;
  }

  function avancar() {
    if (!validarPasso(passo)) return;
    if (passo < PASSOS.length - 1) {
      setPasso(passo + 1);
      return;
    }
    const resultado = simulacaoSchema.safeParse(entrada);
    if (!resultado.success) {
      /* Erro fora do passo atual: volta ao primeiro passo problemático. */
      const campo = resultado.error.issues[0].path[0];
      const indice = CAMPOS_POR_PASSO.findIndex((campos) =>
        campos.includes(campo as keyof EntradaSimulacaoValidada),
      );
      setPasso(indice >= 0 ? indice : 0);
      validarPasso(indice >= 0 ? indice : 0);
      return;
    }
    salvarSimulacao(resultado.data);
    registrarEvento("simulation_completed", {
      tipo_atuacao: resultado.data.tipoAtuacao,
    });
    router.push("/resultado");
  }

  const ultimo = passo === PASSOS.length - 1;

  return (
    <div className="mx-auto max-w-xl px-4 pb-32 pt-8 sm:px-6 sm:pb-12">
      {/* Progresso: texto + barra, para não depender só do visual. */}
      <div className="mb-7">
        <p className="text-sm font-medium text-ink-muted">
          Passo {passo + 1} de {PASSOS.length}
        </p>
        <div
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={PASSOS.length}
          aria-valuenow={passo + 1}
          aria-label="Progresso da simulação"
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${((passo + 1) / PASSOS.length) * 100}%` }}
          />
        </div>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        {PASSOS[passo].titulo}
      </h1>

      {/*
        Anuncia a troca de passo para leitores de tela sem mexer no foco —
        o foco pertence ao primeiro campo do passo.
      */}
      <p aria-live="polite" className="sr-only">
        Passo {passo + 1} de {PASSOS.length}: {PASSOS[passo].titulo}
      </p>

      <div className="mt-6">
        {passo === 0 && (
          <PassoPerfil
            valor={entrada.tipoAtuacao}
            onChange={(v) => atualizar("tipoAtuacao", v)}
          />
        )}

        {passo === 1 && (
          <PassoReceita
            valor={entrada.receitaMensal}
            erro={erros.receitaMensal}
            onChange={(v) => atualizar("receitaMensal", v)}
          />
        )}

        {passo === 2 && (
          <PassoCustos
            valor={entrada.custosMensais}
            erro={erros.custosMensais}
            onChange={(v) => atualizar("custosMensais", v)}
          />
        )}

        {passo === 3 && (
          <PassoCnpj
            entrada={entrada}
            erros={erros}
            onProLabore={(v) => {
              proLaboreTocado.current = true;
              atualizar("proLabore", v);
            }}
            onContabilidade={(v) => atualizar("custoContabilidade", v)}
          />
        )}
      </div>

      {/* Ações fixas no rodapé em telas pequenas: sempre alcançáveis com o polegar. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border-base bg-background/95 p-4 backdrop-blur-md sm:static sm:mt-10 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="mx-auto flex max-w-xl gap-3">
          {passo > 0 && (
            <Button
              variante="secundaria"
              tamanho="lg"
              onClick={() => setPasso(passo - 1)}
            >
              Voltar
            </Button>
          )}
          <Button tamanho="lg" onClick={avancar} className="flex-1">
            {ultimo ? "Ver resultado" : "Continuar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PassoPerfil({
  valor,
  onChange,
}: {
  valor: TipoAtuacao;
  onChange: (v: TipoAtuacao) => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-ink-muted">
        Escolha o cenário que você quer ver em destaque. Nós calculamos os dois
        de qualquer forma, para você comparar no final.
      </p>
      <Escolha
        legenda="Como você atua hoje?"
        valor={valor}
        onChange={onChange}
        opcoes={[
          {
            valor: "pessoa-fisica",
            rotulo: "Autônomo / Pessoa Física",
            descricao:
              "Você recebe como pessoa física, sem empresa aberta. Recolhe INSS e imposto de renda no carnê-leão.",
          },
          {
            valor: "cnpj",
            rotulo: "Prestador de serviço com CNPJ",
            descricao:
              "Você tem empresa aberta, emite nota pelo CNPJ e retira pró-labore.",
          },
        ]}
      />
    </div>
  );
}

function PassoReceita({
  valor,
  erro,
  onChange,
}: {
  valor: number;
  erro?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-ink-muted">
        Quanto você fatura por mês, em média, antes de descontar qualquer coisa.
      </p>
      <CampoMoeda
        autoFocus
        rotulo="Receita mensal estimada"
        valor={valor}
        onChange={onChange}
        erro={erro}
        ajuda="Se varia bastante, use a média dos últimos meses. Exemplo: 8.000,00"
      />
    </div>
  );
}

function PassoCustos({
  valor,
  erro,
  onChange,
}: {
  valor: number;
  erro?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-ink-muted">
        Custos do negócio, não despesas pessoais. Aluguel de sala, ferramentas,
        materiais, deslocamento a trabalho, terceirizados.
      </p>
      <CampoMoeda
        autoFocus
        rotulo="Custos mensais do negócio"
        valor={valor}
        onChange={onChange}
        erro={erro}
        ajuda="Deixe em branco se não tiver custos. Exemplo: 1.200,00"
      />
      <p className="rounded-xl bg-surface-muted p-4 text-sm leading-relaxed text-ink-muted">
        Não inclua aqui aluguel de casa, mercado ou lazer. Essas despesas saem
        do resultado líquido, e a simulação mostra quanto sobra antes delas.
      </p>
    </div>
  );
}

function PassoCnpj({
  entrada,
  erros,
  onProLabore,
  onContabilidade,
}: {
  entrada: EntradaSimulacaoValidada;
  erros: Erros;
  onProLabore: (v: number) => void;
  onContabilidade: (v: number) => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-ink-muted">
        {entrada.tipoAtuacao === "cnpj"
          ? "Dois valores específicos da empresa. Já preenchemos com sugestões — ajuste se souber os seus."
          : "Estes valores montam o cenário com CNPJ para o comparativo. Já preenchemos com sugestões."}
      </p>

      <CampoMoeda
        rotulo="Pró-labore mensal"
        valor={entrada.proLabore}
        onChange={onProLabore}
        erro={erros.proLabore}
        ajuda={`É o seu "salário" como sócio. Sugerimos ${formatarMoeda(
          proLaboreSugerido(entrada.receitaMensal),
        )}, mas você pode mudar.`}
      />

      <CampoMoeda
        rotulo="Custo mensal com contabilidade"
        valor={entrada.custoContabilidade}
        onChange={onContabilidade}
        erro={erros.custoContabilidade}
        ajuda="Honorários do escritório contábil. Custo que só existe quando há empresa."
      />

      <AvisoContabil className="rounded-xl bg-surface-muted p-4" />
    </div>
  );
}
