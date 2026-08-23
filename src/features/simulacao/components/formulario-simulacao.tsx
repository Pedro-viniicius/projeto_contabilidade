"use client";

import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { IconeRecalcular } from "@/components/ui/icone";
import { CampoMoeda } from "@/components/ui/campo-moeda";
import { CampoTexto } from "@/components/ui/campo-texto";
import { Escolha } from "@/components/ui/escolha";
import { GrupoCampos } from "@/components/ui/painel";
import { formatarMoeda } from "@/lib/format";
import { REGRAS } from "../domain/calculation-rules";
import { rotuloCalculo } from "./acoes-analise";
import {
  proLaboreSugerido,
  type EntradaSimulacaoValidada,
} from "../schemas/simulacao-schema";

export type ErrosSimulacao = Partial<
  Record<keyof EntradaSimulacaoValidada, string>
>;

/** Atalho do sistema, exibido discretamente ao lado da ação. */
const ehMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/**
 * Zona de dados da área de trabalho.
 *
 * Puramente controlada: não guarda estado nem chama o motor. Quem
 * orquestra é a área de trabalho, para que os mesmos valores alimentem
 * o resultado ao lado sem duplicar fonte de verdade.
 */
export function FormularioSimulacao({
  entrada,
  referencia,
  erros,
  jaCalculou,
  desatualizado,
  salvo,
  aviso,
  formRef,
  onCampo,
  onProLabore,
  onReferencia,
  onCalcular,
}: {
  entrada: EntradaSimulacaoValidada;
  referencia: string;
  erros: ErrosSimulacao;
  jaCalculou: boolean;
  desatualizado: boolean;
  /** O último cálculo foi gravado no histórico deste aparelho. */
  salvo: boolean;
  /** Falha de persistência ou registro descartado. O cálculo segue válido. */
  aviso?: string | null;
  formRef: RefObject<HTMLFormElement | null>;
  onCampo: <K extends keyof EntradaSimulacaoValidada>(
    campo: K,
    valor: EntradaSimulacaoValidada[K],
  ) => void;
  /** Separado de `onCampo`: marca que a sugestão automática não vale mais. */
  onProLabore: (valor: number) => void;
  onReferencia: (valor: string) => void;
  onCalcular: () => void;
}) {
  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        onCalcular();
      }}
      noValidate
      className="flex min-h-full flex-col"
    >
      <div className="space-y-3.5 px-4 py-3.5">
        <GrupoCampos titulo="Identificação">
          <CampoTexto
            rotulo="Referência da análise"
            opcional
            maxLength={60}
            valor={referencia}
            onChange={onReferencia}
            placeholder="Ex.: Cliente XPTO — cenário 01"
            ajuda="Rótulo local para reencontrar esta análise no histórico."
          />
        </GrupoCampos>

        <GrupoCampos titulo="Cenário">
          <Escolha
            legenda="Enquadramento atual do cliente"
            valor={entrada.tipoAtuacao}
            onChange={(v) => onCampo("tipoAtuacao", v)}
            opcoes={[
              {
                valor: "pessoa-fisica",
                rotulo: "Pessoa Física",
                descricao: "Autônomo, com INSS e carnê-leão.",
              },
              {
                valor: "cnpj",
                rotulo: "CNPJ",
                descricao: "Prestador com empresa e pró-labore.",
              },
            ]}
          />
        </GrupoCampos>

        <GrupoCampos titulo="Receita">
          <CampoMoeda
            rotulo="Receita bruta mensal"
            valor={entrada.receitaMensal}
            onChange={(v) => onCampo("receitaMensal", v)}
            erro={erros.receitaMensal}
          />
        </GrupoCampos>

        <GrupoCampos titulo="Estrutura de custos">
          <CampoMoeda
            rotulo="Custos do negócio"
            valor={entrada.custosMensais}
            onChange={(v) => onCampo("custosMensais", v)}
            erro={erros.custosMensais}
            ajuda="Custos operacionais dedutíveis. Não inclui despesas pessoais."
          />
          <CampoMoeda
            rotulo="Honorários contábeis"
            valor={entrada.custoContabilidade}
            onChange={(v) => onCampo("custoContabilidade", v)}
            erro={erros.custoContabilidade}
            ajuda="Aplicado apenas ao cenário CNPJ."
          />
        </GrupoCampos>

        <GrupoCampos titulo="Pró-labore">
          <CampoMoeda
            rotulo="Pró-labore mensal"
            valor={entrada.proLabore}
            onChange={onProLabore}
            erro={erros.proLabore}
            sugestao={
              entrada.receitaMensal > 0
                ? {
                    texto: `Aplicar ${formatarMoeda(
                      proLaboreSugerido(entrada.receitaMensal),
                    )}`,
                    onAplicar: () =>
                      onProLabore(proLaboreSugerido(entrada.receitaMensal)),
                  }
                : undefined
            }
            ajuda={`Sugestão de ${(
              REGRAS.cnpj.proLaborePercentualSugerido.valor * 100
            ).toLocaleString("pt-BR")}% da receita. O modelo não calcula Fator R.`}
          />
        </GrupoCampos>
      </div>

      {/*
        A ação acompanha a rolagem da coluna: em telas menores o
        formulário é mais alto que a área visível, e "Calcular" fora de
        alcance obrigaria a rolar para cada iteração.
      */}
      <div className="sticky bottom-0 mt-auto border-t border-border-base bg-background px-4 py-3">
        {/*
          A consequência vem ANTES da ação, não depois: o contador lê
          por que precisa recalcular e só então alcança o botão.
        */}
        {desatualizado && (
          <p className="mb-2 flex items-start gap-1.5 text-[0.75rem] leading-snug text-atencao">
            <span aria-hidden="true">●</span>
            <span>
              Valores alterados — recalcule para atualizar o resultado.
            </span>
          </p>
        )}

        <div className="flex items-center gap-2">
          <Button type="submit" tamanho="lg" className="flex-1">
            {jaCalculou && <IconeRecalcular />}
            {rotuloCalculo(jaCalculou)}
          </Button>
          <kbd
            aria-hidden="true"
            className="hidden shrink-0 rounded-sm border border-border-strong px-1.5 py-1 text-[0.6875rem] text-ink-subtle min-[960px]:block"
          >
            {ehMac ? "⌘" : "Ctrl"}+↵
          </kbd>
        </div>

        {/*
          "Deu certo?" respondido sem toast: confirmação derivada do
          estado, que some sozinha quando os valores mudam de novo.
        */}
        {salvo && !desatualizado && !aviso && (
          <p className="mt-2 flex items-start gap-1.5 text-[0.75rem] leading-snug text-ink-muted">
            <span aria-hidden="true" className="text-positivo">
              ✓
            </span>
            <span>Análise salva no histórico deste aparelho.</span>
          </p>
        )}
        {aviso && (
          /* Persistência falhou ou registro corrompido: o contador
             precisa saber que o número na tela não ficou guardado. */
          <p
            role="status"
            className="mt-2 flex items-start gap-1.5 text-[0.75rem] leading-snug text-atencao"
          >
            <span aria-hidden="true">⚠</span>
            <span>{aviso}</span>
          </p>
        )}
        <p className="sr-only">
          Atalho: {ehMac ? "Command" : "Control"} mais Enter calcula a análise.
        </p>
      </div>
    </form>
  );
}
