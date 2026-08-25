"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { IconeRecalcular } from "@/components/ui/icone";
import { CampoMoeda } from "@/components/ui/campo-moeda";
import { CampoTexto } from "@/components/ui/campo-texto";
import { Escolha } from "@/components/ui/escolha";
import { GrupoCampos } from "@/components/ui/painel";
import { formatarMoeda } from "@/lib/format";
import { REGRAS, type Anexo } from "../domain/calculation-rules";
import { atividadePorId } from "../domain/catalogo-atividades";
import type { Classificacao } from "../domain/classificacao";
import { rotuloCalculo } from "./acoes-analise";
import type { CampoPendente } from "./acao-enquadramento";
import { SeletorAtividade } from "./seletor-atividade";
import { CartaoClassificacao } from "./cartao-classificacao";
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
 * A ordem reproduz a triagem do contador:
 *
 *   1. ATIVIDADE      — o que estamos analisando
 *   2. ENQUADRAMENTO  — que anexo isso permite, e se há Fator R
 *   3. DADOS          — PF e PJ lado a lado, preenchidos juntos
 *
 * Os campos do Fator R só aparecem quando a atividade está sujeita a
 * ele: pedir RBT12 e folha para um salão de beleza seria ruído.
 *
 * Puramente controlada: não guarda estado nem chama o motor. Quem
 * orquestra é a área de trabalho, para que os mesmos valores alimentem
 * o resultado ao lado sem duplicar fonte de verdade.
 */
export function FormularioSimulacao({
  entrada,
  classificacao,
  referencia,
  erros,
  jaCalculou,
  desatualizado,
  salvo,
  aviso,
  formRef,
  onCampo,
  onCampos,
  onProLabore,
  onReferencia,
  onCalcular,
}: {
  entrada: EntradaSimulacaoValidada;
  classificacao: Classificacao;
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
  /** Altera vários campos numa única atualização de estado. */
  onCampos: (patch: Partial<EntradaSimulacaoValidada>) => void;
  /** Separado de `onCampo`: marca que a sugestão automática não vale mais. */
  onProLabore: (valor: number) => void;
  onReferencia: (valor: string) => void;
  onCalcular: () => void;
}) {
  const atividade = atividadePorId(entrada.atividadeId);
  const precisaFatorR = classificacao.sujeitaFatorR;

  /*
   * "Informar atividade" e "Informar receita mensal" precisam LEVAR o
   * contador ao campo, não só nomeá-lo. Sem isso, a ação principal do
   * bloco de enquadramento seria só mais um texto dizendo o que
   * procurar — e o campo pode estar fora da área visível.
   */
  const refAtividade = useRef<HTMLInputElement>(null);
  const refReceita = useRef<HTMLInputElement>(null);

  function irPara(campo: CampoPendente) {
    const alvo = campo === "atividade" ? refAtividade : refReceita;
    alvo.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    alvo.current?.focus({ preventScroll: true });
  }

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
        {/* ---------- 1. ATIVIDADE ---------- */}
        <GrupoCampos titulo="1. Atividade">
          <SeletorAtividade
            atividade={atividade}
            campoRef={refAtividade}
            onSelecionar={(id) => onCampo("atividadeId", id)}
            onLimpar={() => onCampo("atividadeId", null)}
          />
        </GrupoCampos>

        {/* ---------- 2. ENQUADRAMENTO ---------- */}
        <GrupoCampos titulo="2. Enquadramento">
          <CartaoClassificacao
            classificacao={classificacao}
            onAnexoManual={(anexo) =>
              onCampo("anexoManual", anexo as Anexo | null)
            }
            onMotivoManual={(motivo) =>
              onCampo("motivoAnexoManual", motivo || undefined)
            }
            onIrPara={irPara}
            onVoltarAoAutomatico={() =>
              onCampos({ anexoManual: null, motivoAnexoManual: undefined })
            }
          />
        </GrupoCampos>

        {/* ---------- 3. DADOS ---------- */}
        <GrupoCampos titulo="3. Dados da análise">
          <CampoTexto
            rotulo="Referência da análise"
            opcional
            maxLength={60}
            valor={referencia}
            onChange={onReferencia}
            placeholder="Ex.: Cliente XPTO — cenário 01"
            ajuda="Rótulo local para reencontrar esta análise no histórico."
          />

          <CampoMoeda
            rotulo="Receita bruta mensal"
            campoRef={refReceita}
            valor={entrada.receitaMensal}
            onChange={(v) => onCampo("receitaMensal", v)}
            erro={erros.receitaMensal}
            ajuda="Vale para os dois cenários — é o que torna a comparação justa."
          />

          <CampoMoeda
            rotulo="Custos do negócio"
            valor={entrada.custosMensais}
            onChange={(v) => onCampo("custosMensais", v)}
            erro={erros.custosMensais}
            ajuda="Custos operacionais dedutíveis. Não inclui despesas pessoais."
          />

          <Escolha
            legenda="Enquadramento atual do cliente"
            valor={entrada.tipoAtuacao}
            onChange={(v) => onCampo("tipoAtuacao", v)}
            opcoes={[
              {
                valor: "pessoa-fisica",
                rotulo: "Pessoa Física",
                descricao: "Hoje atua como autônomo. Os dois cenários são calculados mesmo assim.",
              },
              {
                valor: "cnpj",
                rotulo: "CNPJ",
                descricao: "Hoje atua com empresa. Os dois cenários são calculados mesmo assim.",
              },
            ]}
          />
        </GrupoCampos>

        {/*
          PF e PJ LADO A LADO, a partir de 1280px.
          Pedido direto do contador: comparar exige ver os dois de uma
          vez, não alternar entre fluxos desconectados. Abaixo dessa
          largura, empilham — campo de moeda espremido em meia coluna
          seria pior que rolar.
        */}
        <div className="grid gap-3.5 min-[1280px]:grid-cols-2 min-[1280px]:gap-3">
          <Cenario
            titulo="Pessoa Física / Autônomo"
            apoio="INSS de contribuinte individual e carnê-leão."
          >
            <CampoMoeda
              rotulo="Honorários contábeis — Autônomo/PF"
              valor={entrada.honorariosContabeisPf}
              onChange={(v) => onCampo("honorariosContabeisPf", v)}
              erro={erros.honorariosContabeisPf}
              ajuda="Custo contábil do autônomo. Independente do da empresa — parte de zero até você informar."
            />
            <NotaCenario>
              INSS de{" "}
              {(REGRAS.pessoaFisica.inssAliquota.valor * 100).toLocaleString(
                "pt-BR",
              )}
              % sobre o salário de contribuição, com piso e teto, mais IRPF
              pela tabela progressiva mensal.
            </NotaCenario>
          </Cenario>

          <Cenario
            titulo="CNPJ / Simples Nacional"
            apoio={
              classificacao.anexo
                ? `DAS pelo Anexo ${classificacao.anexo}, pró-labore e honorários.`
                : "Sem enquadramento definido: alíquota de recurso."
            }
          >
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
              ).toLocaleString("pt-BR")}% da receita — que é o patamar do Fator R.`}
            />

            <CampoMoeda
              rotulo="Honorários contábeis — Empresa/PJ"
              valor={entrada.honorariosContabeisPj}
              onChange={(v) => onCampo("honorariosContabeisPj", v)}
              erro={erros.honorariosContabeisPj}
              ajuda="Custo contábil da empresa, editado em separado do honorário do autônomo."
            />

            <CampoMoeda
              rotulo="RBT12 — receita de 12 meses"
              valor={entrada.rbt12}
              onChange={(v) => onCampo("rbt12", v)}
              erro={erros.rbt12}
              sugestao={
                entrada.receitaMensal > 0
                  ? {
                      texto: `Aplicar ${formatarMoeda(
                        entrada.receitaMensal * REGRAS.mesesNoAno.valor,
                      )}`,
                      onAplicar: () =>
                        onCampo(
                          "rbt12",
                          entrada.receitaMensal * REGRAS.mesesNoAno.valor,
                        ),
                    }
                  : undefined
              }
              ajuda="Define a faixa da tabela do Simples. Em branco, projetamos a receita mensal por 12 e avisamos."
            />

            {/*
              Fator R só aparece quando a atividade está sujeita a ele.
              Mostrar sempre encheria a tela de campo irrelevante para
              metade do catálogo.
            */}
            {precisaFatorR && (
              <CampoMoeda
                rotulo="Folha de 12 meses"
                valor={entrada.folha12m}
                onChange={(v) => onCampo("folha12m", v)}
                erro={erros.folha12m}
                sugestao={
                  entrada.proLabore > 0
                    ? {
                        texto: `Aplicar ${formatarMoeda(
                          entrada.proLabore * REGRAS.mesesNoAno.valor,
                        )}`,
                        onAplicar: () =>
                          onCampo(
                            "folha12m",
                            entrada.proLabore * REGRAS.mesesNoAno.valor,
                          ),
                      }
                    : undefined
                }
                ajuda="Salários, contribuição patronal, FGTS e pró-labore somados, conforme a LC 123/2006. É a folha que decide entre o Anexo III e o V."
              />
            )}

            {!precisaFatorR && (
              <NotaCenario>
                {classificacao.atividade
                  ? "Esta atividade não está sujeita ao Fator R: a folha não altera o anexo."
                  : "Identifique a atividade para saber se o Fator R se aplica."}
              </NotaCenario>
            )}
          </Cenario>
        </div>
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

/**
 * Coluna de um cenário.
 *
 * `<fieldset>` de verdade: o leitor de tela anuncia "Pessoa Física /
 * Autônomo" ao entrar no grupo, e é isso que impede dois campos
 * chamados "Honorários contábeis" de virarem indistinguíveis fora do
 * contexto visual.
 */
function Cenario({
  titulo,
  apoio,
  children,
}: {
  titulo: string;
  apoio: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="min-w-0 rounded-md border border-border-base bg-surface p-2.5">
      <legend className="px-1 text-[0.8125rem] font-semibold text-ink">
        {titulo}
      </legend>
      <p className="mb-2.5 text-[0.75rem] leading-snug text-ink-subtle">
        {apoio}
      </p>
      <div className="space-y-2.5">{children}</div>
    </fieldset>
  );
}

function NotaCenario({ children }: { children: ReactNode }) {
  return (
    <p className="border-t border-border-base pt-2 text-[0.75rem] leading-snug text-ink-subtle">
      {children}
    </p>
  );
}
