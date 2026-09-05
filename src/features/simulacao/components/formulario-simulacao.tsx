"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { IconeRecalcular } from "@/components/ui/icone";
import { CampoMoeda } from "@/components/ui/campo-moeda";
import { CampoTexto } from "@/components/ui/campo-texto";
import { Escolha } from "@/components/ui/escolha";
import { MensagemStatus } from "@/components/ui/mensagem-status";
import { REGRAS, type Anexo } from "../domain/calculation-rules";
import type { Classificacao } from "../domain/classificacao";
import { avisosDoCampo, type AvisoEntrada } from "../domain/avisos-entrada";
import { rotuloCalculo } from "./acoes-analise";
import type { CampoPendente } from "./acao-enquadramento";
import { ContextoAnalise } from "./contexto-analise";
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

const horaCurta = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

/** Hora do último cálculo, tolerante a registro sem data válida. */
function horaDoCalculo(iso?: string): string | null {
  if (!iso) return null;
  const data = new Date(iso);
  return Number.isFinite(data.getTime()) ? horaCurta.format(data) : null;
}

const pct = (v: number) => `${(v * 100).toLocaleString("pt-BR")}%`;

/**
 * ZONA DE DADOS — a área operacional do contador.
 *
 * A ordem reproduz a triagem real:
 *
 *   A. CONTEXTO      — que atividade é, e que anexo isso permite
 *   B. COMPARTILHADO — receita e custos, que valem para os DOIS lados
 *   C. SITUAÇÃO      — o que o cliente é hoje, como referência
 *   D/E. CENÁRIOS    — PF e CNPJ preenchidos lado a lado
 *   F. AÇÃO          — estado do cálculo e o comando de atualizar
 *
 * Duas decisões estruturam o resto:
 *
 * - o que é COMPARTILHADO aparece uma vez só, num bloco próprio. Era o
 *   que fazia a comparação parecer dois formulários independentes;
 * - a ajuda conceitual não ocupa altura permanente. O que previne erro
 *   — validação e conferência — continua sempre visível.
 *
 * Puramente controlada: não guarda estado de análise nem chama o
 * motor. Quem orquestra é a área de trabalho, para que os mesmos
 * valores alimentem o resultado ao lado sem duplicar fonte de verdade.
 */
export function FormularioSimulacao({
  entrada,
  classificacao,
  referencia,
  erros,
  avisos,
  jaCalculou,
  desatualizado,
  salvo,
  atualizadoEm,
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
  /** Conferências da entrada. Não bloqueiam o cálculo. */
  avisos: readonly AvisoEntrada[];
  jaCalculou: boolean;
  desatualizado: boolean;
  /** O último cálculo foi gravado no navegador. */
  salvo: boolean;
  /** ISO do último cálculo gravado, para datar o resultado exibido. */
  atualizadoEm?: string;
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
  const precisaFatorR = classificacao.sujeitaFatorR;
  const hora = horaDoCalculo(atualizadoEm);

  /*
   * "Informar atividade" e "Informar receita mensal" precisam LEVAR o
   * contador ao campo, não só nomeá-lo — o campo pode estar fora da
   * área visível.
   */
  const refAtividade = useRef<HTMLInputElement>(null);
  const refReceita = useRef<HTMLInputElement>(null);

  function irPara(campo: CampoPendente) {
    const alvo = campo === "atividade" ? refAtividade : refReceita;
    alvo.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    alvo.current?.focus({ preventScroll: true });
  }

  const doCampo = (campo: keyof EntradaSimulacaoValidada) =>
    avisosDoCampo(avisos, campo);

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
        {/* ---------- A. CONTEXTO DA ANÁLISE ---------- */}
        <Secao titulo="Contexto da análise">
          <CampoTexto
            rotulo="Referência da análise"
            opcional
            maxLength={60}
            valor={referencia}
            onChange={onReferencia}
            placeholder="Ex.: Cliente XPTO — cenário 01"
            ajuda="Rótulo local para reencontrar esta análise no histórico deste navegador. Não entra no cálculo."
          />

          <ContextoAnalise
            classificacao={classificacao}
            campoAtividadeRef={refAtividade}
            onSelecionarAtividade={(id) => onCampo("atividadeId", id)}
            onLimparAtividade={() => onCampo("atividadeId", null)}
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
        </Secao>

        {/* ---------- B. DADOS COMPARTILHADOS ---------- */}
        <Secao
          titulo="Dados compartilhados"
          apoio="Aplicados aos dois cenários — é o que torna a comparação justa."
        >
          {/*
            Dois campos curtos: lado a lado assim que a coluna passa de
            24rem. Empilhá-los custava uma linha inteira de rolagem sem
            nenhum ganho de legibilidade.
          */}
          <div className="grid gap-3 @[24rem]:grid-cols-2">
            <CampoMoeda
              rotulo="Receita bruta mensal"
              campoRef={refReceita}
              valor={entrada.receitaMensal}
              onChange={(v) => onCampo("receitaMensal", v)}
              erro={erros.receitaMensal}
              avisos={doCampo("receitaMensal")}
              ajuda="Faturamento bruto do mês, antes de qualquer dedução. Vale igualmente para a Pessoa Física e para o CNPJ."
            />

            <CampoMoeda
              rotulo="Custos do negócio"
              valor={entrada.custosMensais}
              onChange={(v) => onCampo("custosMensais", v)}
              erro={erros.custosMensais}
              avisos={doCampo("custosMensais")}
              ajuda="Custos operacionais dedutíveis do mês. Não inclui despesas pessoais nem os honorários contábeis, que têm campo próprio em cada cenário."
            />
          </div>
        </Secao>

        {/* ---------- C. SITUAÇÃO ATUAL ---------- */}
        <Secao titulo="Situação atual do cliente">
          <Escolha
            legenda="Como o cliente atua hoje"
            valor={entrada.tipoAtuacao}
            onChange={(v) => onCampo("tipoAtuacao", v)}
            apoio="Usado como referência da comparação. Os dois cenários são calculados de qualquer forma."
            opcoes={[
              { valor: "pessoa-fisica", rotulo: "Pessoa Física / Autônomo" },
              { valor: "cnpj", rotulo: "CNPJ" },
            ]}
          />
        </Secao>

        {/* ---------- D / E. CENÁRIOS, LADO A LADO ---------- */}
        <Secao titulo="Dados de cada cenário">
          {/*
            PF e CNPJ visíveis ao mesmo tempo assim que a coluna de
            dados passa de 32rem. Comparar exige ver os dois de uma vez;
            alternar entre abas transformaria a comparação em exercício
            de memória. Abaixo disso empilham — campo de moeda espremido
            em meia coluna seria pior que rolar.
          */}
          <div className="grid gap-3 @[32rem]:grid-cols-2">
            <Cenario
              titulo="Pessoa Física / Autônomo"
              apoio={`INSS de contribuinte individual (${pct(
                REGRAS.pessoaFisica.inssAliquota.valor,
              )}, com piso e teto) e IRPF pela tabela progressiva mensal.`}
            >
              <CampoMoeda
                rotulo="Honorários contábeis — Pessoa Física"
                valor={entrada.honorariosContabeisPf}
                onChange={(v) => onCampo("honorariosContabeisPf", v)}
                erro={erros.honorariosContabeisPf}
                avisos={doCampo("honorariosContabeisPf")}
                ajuda="Custo contábil do autônomo. Independente do honorário da empresa: os dois existem, são diferentes, e a diferença entre eles é parte do que a comparação mede."
              />
            </Cenario>

            <Cenario
              titulo="CNPJ / Simples Nacional"
              apoio={
                classificacao.anexo
                  ? `DAS pelo Anexo ${classificacao.anexo}, INSS e IRRF sobre o pró-labore, e honorários da empresa.`
                  : "Sem enquadramento definido: o DAS sai por alíquota de recurso."
              }
            >
              <CampoMoeda
                rotulo="Pró-labore mensal"
                valor={entrada.proLabore}
                onChange={onProLabore}
                erro={erros.proLabore}
                avisos={doCampo("proLabore")}
                sugestao={
                  entrada.receitaMensal > 0
                    ? {
                        valor: proLaboreSugerido(entrada.receitaMensal),
                        origem: `${pct(
                          REGRAS.cnpj.proLaborePercentualSugerido.valor,
                        )} da receita, que é o patamar do Fator R`,
                        onAplicar: () =>
                          onProLabore(proLaboreSugerido(entrada.receitaMensal)),
                      }
                    : undefined
                }
                ajuda="Remuneração mensal do sócio. Base do INSS e do IRRF no cenário CNPJ, e parcela da folha que decide o Fator R."
              />

              <CampoMoeda
                rotulo="Honorários contábeis — Empresa"
                valor={entrada.honorariosContabeisPj}
                onChange={(v) => onCampo("honorariosContabeisPj", v)}
                erro={erros.honorariosContabeisPj}
                avisos={doCampo("honorariosContabeisPj")}
                ajuda="Custo fixo de manter a empresa regular, editado em separado do honorário do autônomo."
              />

              <CampoMoeda
                rotulo="RBT12 — receita dos últimos 12 meses"
                valor={entrada.rbt12}
                onChange={(v) => onCampo("rbt12", v)}
                erro={erros.rbt12}
                avisos={doCampo("rbt12")}
                sugestao={
                  entrada.receitaMensal > 0
                    ? {
                        valor: entrada.receitaMensal * REGRAS.mesesNoAno.valor,
                        origem: "receita mensal informada projetada por 12 meses",
                        onAplicar: () =>
                          onCampo(
                            "rbt12",
                            entrada.receitaMensal * REGRAS.mesesNoAno.valor,
                          ),
                      }
                    : undefined
                }
                ajuda="Receita bruta acumulada nos últimos 12 meses. É ela que determina a faixa da tabela do Simples Nacional e a alíquota efetiva do DAS."
              />

              {/*
                Fator R só aparece quando a atividade está sujeita a
                ele. Mostrar sempre encheria a tela de campo irrelevante
                para metade do catálogo.
              */}
              {precisaFatorR ? (
                <CampoMoeda
                  rotulo="Folha de salários dos últimos 12 meses"
                  valor={entrada.folha12m}
                  onChange={(v) => onCampo("folha12m", v)}
                  erro={erros.folha12m}
                  avisos={doCampo("folha12m")}
                  sugestao={
                    entrada.proLabore > 0
                      ? {
                          valor: entrada.proLabore * REGRAS.mesesNoAno.valor,
                          origem:
                            "pró-labore informado projetado por 12 meses, sem outros salários",
                          onAplicar: () =>
                            onCampo(
                              "folha12m",
                              entrada.proLabore * REGRAS.mesesNoAno.valor,
                            ),
                        }
                      : undefined
                  }
                  ajuda="Salários, contribuição patronal, FGTS e pró-labore somados nos últimos 12 meses, conforme a LC 123/2006. É a folha que decide entre o Anexo III e o Anexo V."
                />
              ) : (
                <NotaCenario>
                  {classificacao.atividade
                    ? "Esta atividade não está sujeita ao Fator R: a folha não altera o anexo."
                    : "Identifique a atividade para saber se o Fator R se aplica."}
                </NotaCenario>
              )}
            </Cenario>
          </div>
        </Secao>
      </div>

      {/* ---------- F. ESTADO DO CÁLCULO E AÇÃO ---------- */}
      {/*
        A ação acompanha a rolagem da coluna: o formulário é mais alto
        que a área visível, e o comando fora de alcance obrigaria a
        rolar de volta a cada iteração.
      */}
      <div className="sticky bottom-0 mt-auto border-t border-border-base bg-background px-4 py-3">
        {/*
          A consequência vem ANTES da ação, não depois: o contador lê
          por que precisa atualizar e só então alcança o botão. Âmbar,
          nunca vermelho — nada está errado; o que está na tela é
          apenas antigo.
        */}
        {desatualizado && (
          <MensagemStatus nivel="atencao" papel="status" className="mb-2">
            <span className="font-medium">Resultados desatualizados.</span>{" "}
            Existem alterações ainda não calculadas.
          </MensagemStatus>
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
          estado, que some sozinha quando os valores mudam de novo. O
          texto diz ONDE ficou salvo — não há nuvem, e sugerir que há
          seria prometer sincronização que não existe.
        */}
        {salvo && !desatualizado && !aviso && (
          <MensagemStatus nivel="sucesso" className="mt-2">
            Resultados atualizados{hora ? ` às ${hora}` : ""} · salvo neste
            navegador. Os dados não são sincronizados entre dispositivos.
          </MensagemStatus>
        )}

        {aviso && (
          /* Persistência falhou ou registro corrompido: o contador
             precisa saber que o número na tela não ficou guardado. */
          <MensagemStatus nivel="atencao" papel="status" className="mt-2">
            {aviso}
          </MensagemStatus>
        )}

        <p className="sr-only">
          Atalho: {ehMac ? "Command" : "Control"} mais Enter atualiza os
          resultados.
        </p>
      </div>
    </form>
  );
}

/**
 * Agrupamento conceitual do formulário.
 *
 * `<fieldset>` de verdade, com o título como `<legend>`: o leitor de
 * tela anuncia o grupo ao entrar nele, e é o que dá sentido a um campo
 * chamado "Honorários contábeis" fora do contexto visual.
 */
function Secao({
  titulo,
  apoio,
  children,
}: {
  titulo: string;
  apoio?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="border-t border-border-base pt-3.5 first:border-t-0 first:pt-0">
      <legend className="rotulo-secao mb-0.5">{titulo}</legend>
      {apoio && (
        <p className="mb-2 text-[0.75rem] leading-snug text-ink-subtle">
          {apoio}
        </p>
      )}
      <div className={apoio ? "space-y-3" : "mt-2 space-y-3"}>{children}</div>
    </fieldset>
  );
}

/**
 * Coluna de um cenário.
 *
 * Distinguidos por posição, título e borda — nunca por cor. Qual dos
 * dois é o melhor muda caso a caso, e pintar um de verde e outro de
 * vermelho anteciparia um veredito que o cálculo ainda não deu.
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
