"use client";

import { useRef, useState } from "react";
import { Painel, PainelCabecalho } from "@/components/ui/painel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MensagemStatus } from "@/components/ui/mensagem-status";
import { registrarEvento } from "@/lib/analytics";
import { resumoValidacao } from "../domain/calculation-rules";
import {
  explicarBloqueio,
  podeCompararCenarios,
} from "../domain/classificacao";
import { concluirComparacao, explicarDiferenca } from "../domain/explicar";
import { TabelaComparativa } from "./tabela-comparativa";
import { ComposicaoComparada } from "./composicao-comparada";
import { PassosCalculo } from "./passos-calculo";
import { EtiquetaAnexo } from "./seletor-atividade";
import type { Simulacao, TipoAtuacao } from "../types";

/** Ordem das abas do passo a passo — a mesma para clique, setas, Home e End. */
const CENARIOS = [
  ["pessoa-fisica", "Pessoa Física"],
  ["cnpj", "CNPJ"],
] as const satisfies readonly (readonly [TipoAtuacao, string])[];

/**
 * ZONA DE RESULTADO.
 *
 * A hierarquia é deliberada, e responde na ordem em que o contador
 * precisa das respostas:
 *
 *   1. CONCLUSÃO   — qual cenário rende mais, em uma frase
 *   2. TAMANHO     — quanto, por mês e por ano
 *   3. CONFIANÇA   — quanto do modelo já foi validado
 *   4. COMPARAÇÃO  — a tabela, para conferir
 *   5. POR QUÊ     — o que explica a diferença
 *   6. AUDITORIA   — bases, alíquotas, premissas e passo a passo
 *
 * Até a v2.3 a tela abria por "MAIOR RESULTADO ESTIMADO" sobre um nome
 * de cenário: o contador montava a frase de cabeça antes de repeti-la
 * ao cliente. A frase agora vem pronta e vem CONDICIONADA às premissas
 * — é estimativa sob hipóteses declaradas, não indicação de regime.
 */
export function PainelResultado({
  simulacao,
  desatualizado,
  onAbrirPremissas,
}: {
  simulacao: Simulacao;
  /** Os campos mudaram desde o último cálculo. */
  desatualizado: boolean;
  /** `"pendentes"` abre o painel já filtrado no recorte prometido. */
  onAbrirPremissas: (filtro?: "pendentes") => void;
}) {
  const { comparacao, classificacao } = simulacao;
  const [aba, setAba] = useState<TipoAtuacao>(simulacao.entrada.tipoAtuacao);
  const abasRef = useRef<
    Partial<Record<TipoAtuacao, HTMLButtonElement | null>>
  >({});
  const [passosAbertos, setPassosAbertos] = useState(false);

  const cenarioDaAba =
    aba === "cnpj" ? comparacao.cnpj : comparacao.pessoaFisica;

  /* Regra no domínio, e testada lá: ver `podeCompararCenarios`. */
  const comparavel = podeCompararCenarios(classificacao);

  const conclusao = concluirComparacao(simulacao);
  const explicacao = explicarDiferenca(simulacao);
  const destaques = explicacao.contribuintes.map((l) => l.categoria);
  /* O primeiro motivo já está no resumo, no topo — quando há resumo. */
  const motivosRestantes = explicacao.motivos.slice(comparavel ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* ---------- 1 a 4. CONCLUSÃO, TAMANHO, CONFIANÇA E TABELA ---------- */}
      <Painel
        className={desatualizado ? "border-l-2 border-l-atencao" : undefined}
      >
        <PainelCabecalho
          titulo="Resultado da comparação"
          descricao="Mesma receita e mesmos custos nos dois enquadramentos."
          /*
            O anexo aparece JUNTO do número que ele produziu. Separá-lo
            do resultado deixaria o contador conferindo a comparação sem
            saber sob qual enquadramento ela foi feita.
          */
          acoes={
            <span className="flex flex-wrap items-center gap-1.5">
              {desatualizado && (
                <Badge tom="atencao" ponto>
                  Resultados desatualizados
                </Badge>
              )}
              {classificacao.anexo ? (
                <EtiquetaAnexo
                  anexo={classificacao.anexo}
                  manual={classificacao.manual}
                />
              ) : (
                /*
                  "Sem enquadramento" dizia o que FALTA; o contador
                  precisa saber o que isso significa para o número que
                  está olhando. "Provisório" diz exatamente isso, e é o
                  que impede tomar o resultado de reserva por um cálculo
                  real do Simples.
                */
                <Badge tom="atencao" ponto>
                  Sem enquadramento definido
                </Badge>
              )}
            </span>
          }
        />

        {comparavel ? (
          <div className="border-b border-border-base px-4 py-3">
            {/* 1. A conclusão, em uma frase. */}
            <p className="max-w-prose text-[0.9375rem] font-semibold leading-snug text-ink">
              {conclusao.titulo}
            </p>

            {/* 2. O tamanho da diferença — mensal e anual, com sentido. */}
            {conclusao.vencedor !== null && (
              <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                <Diferenca rotulo="Por mês" valor={conclusao.mensal} />
                <Diferenca rotulo="Por ano" valor={conclusao.anual} />
              </dl>
            )}

            {/* 5 (resumo). O principal motivo, já aqui no topo. */}
            <p className="mt-2 max-w-prose text-[0.8125rem] leading-relaxed text-ink-muted">
              {explicacao.motivos[0]}
            </p>
          </div>
        ) : (
          <div className="border-b border-border-base px-4 py-3.5">
            <p className="text-[0.875rem] font-medium text-ink">
              Sem comparação para esta análise
            </p>
            <p className="mt-1 max-w-prose text-[0.8125rem] leading-relaxed text-ink-muted">
              O cenário CNPJ está incompleto —{" "}
              {classificacao.bloqueio === "acima-do-teto"
                ? "a empresa já não cabe no Simples Nacional"
                : `o Anexo ${classificacao.anexo} tem um encargo que este modelo não calcula`}
              . Declarar um vencedor a partir dele levaria a uma decisão errada.
              Os números da Pessoa Física abaixo seguem válidos.
            </p>
          </div>
        )}

        {/* 3. Confiança: o estágio de validação, colado ao resultado. */}
        <EstadoDoModelo onAbrirPremissas={onAbrirPremissas} />

        {/*
          Escolha manual de anexo nunca vira detalhe: ela sobrepõe a
          classificação do sistema e precisa estar visível ao lado do
          número que produziu, para que a análise seja auditável.
        */}
        {classificacao.manual && (
          <MensagemStatus
            nivel="atencao"
            papel="status"
            className="border-b border-border-base px-4 py-2.5"
          >
            Anexo {classificacao.anexo} definido manualmente — a classificação
            automática não foi usada neste resultado
            {classificacao.motivoManual
              ? `. Justificativa: ${classificacao.motivoManual}`
              : "."}
          </MensagemStatus>
        )}

        {/* 4. A tabela, para conferir número a número. */}
        <TabelaComparativa comparacao={comparacao} />

        {/*
          Bloqueio de cálculo vem ANTES do aviso genérico: é específico
          desta análise, e o contador precisa saber que o número do
          cenário CNPJ não representa o Simples real.
        */}
        {classificacao.bloqueio && (
          <MensagemStatus
            nivel="atencao"
            papel="status"
            className="border-t border-border-base px-4 py-2.5"
          >
            {explicarBloqueio(classificacao.bloqueio, classificacao.anexo)}
          </MensagemStatus>
        )}

        <p className="border-t border-border-base px-4 py-2.5 text-[0.75rem] leading-snug text-ink-subtle">
          Estimativa baseada em premissas simplificadas e ainda não validadas
          por profissional de contabilidade. Um resultado maior não constitui
          recomendação de enquadramento.
        </p>
      </Painel>

      {/* ---------- 5 e 6. POR QUÊ, E A AUDITORIA ---------- */}
      <Painel>
        <PainelCabecalho
          titulo="O que explica a diferença?"
          descricao="Os dois cenários lado a lado. Abra uma linha para ver a conta e a premissa."
          /*
            Botão com contorno e `aria-haspopup="dialog"`: abre um
            painel, e diz isso antes do clique.
          */
          acoes={
            <Button
              type="button"
              tamanho="sm"
              variante="secundaria"
              aria-haspopup="dialog"
              onClick={() => onAbrirPremissas()}
            >
              Ver premissas do modelo
            </Button>
          }
        />

        {/*
          Frases derivadas do cálculo, não de template fixo: cada uma
          cita números que estão na tabela logo abaixo, para que o
          contador possa conferir o que vai repetir ao cliente.

          O primeiro motivo fica de fora: ele já aparece no resumo, no
          topo da tela, e repetir a mesma frase a dois palmos de
          distância só faz o contador reler o que acabou de ler.
        */}
        {motivosRestantes.length > 0 && (
          <ul className="space-y-1.5 border-b border-border-base px-4 py-3">
            {motivosRestantes.map((motivo) => (
              <li
                key={motivo}
                className="flex items-start gap-1.5 text-[0.8125rem] leading-relaxed text-ink-muted"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 shrink-0 text-ink-subtle"
                >
                  •
                </span>
                <span className="max-w-prose">{motivo}</span>
              </li>
            ))}
          </ul>
        )}

        <ComposicaoComparada comparacao={comparacao} destaques={destaques} />

        {/*
          Passo a passo por cenário: conferência linha a linha da ordem
          das operações. É detalhe de auditoria, e por isso é o único
          lugar que ainda separa PF de CNPJ — a comparação em si nunca
          exige troca de aba.
        */}
        <div className="border-t border-border-base">
          <button
            type="button"
            onClick={() => setPassosAbertos((a) => !a)}
            aria-expanded={passosAbertos}
            aria-controls="passos-calculo"
            className="alvo-toque flex min-h-9 w-full items-center gap-1.5 px-4 text-left text-[0.8125rem] text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <span
              aria-hidden="true"
              className={`shrink-0 text-ink-subtle transition-transform ${
                passosAbertos ? "rotate-90" : ""
              }`}
            >
              ›
            </span>
            Passo a passo do cálculo, por cenário
          </button>

          {passosAbertos && (
            <div id="passos-calculo" className="border-t border-border-base">
              {/*
                Padrão ARIA de abas completo: `aria-controls`, painel
                associado, navegação por setas e tabulação roving.
              */}
              <div
                role="tablist"
                aria-label="Cenário do passo a passo"
                className="flex gap-1 border-b border-border-base px-2 pt-2"
                onKeyDown={(e) => {
                  const direcao =
                    e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
                  if (!direcao && e.key !== "Home" && e.key !== "End") return;
                  e.preventDefault();
                  const proxima =
                    e.key === "Home"
                      ? CENARIOS[0][0]
                      : e.key === "End"
                        ? CENARIOS[CENARIOS.length - 1][0]
                        : CENARIOS[
                            (CENARIOS.findIndex(([id]) => id === aba) +
                              direcao +
                              CENARIOS.length) %
                              CENARIOS.length
                          ][0];
                  setAba(proxima);
                  abasRef.current[proxima]?.focus();
                }}
              >
                {CENARIOS.map(([id, rotulo]) => (
                  <button
                    key={id}
                    id={`aba-${id}`}
                    ref={(el) => {
                      abasRef.current[id] = el;
                    }}
                    role="tab"
                    type="button"
                    aria-selected={aba === id}
                    aria-controls={`painel-${id}`}
                    tabIndex={aba === id ? 0 : -1}
                    onClick={() => {
                      setAba(id);
                      registrarEvento("assumptions_viewed", { cenario: id });
                    }}
                    className={[
                      "alvo-toque min-h-8 rounded-t-md px-2.5 text-[0.8125rem] transition-colors",
                      aba === id
                        ? "border-b-2 border-accent font-medium text-ink"
                        : "border-b-2 border-transparent text-ink-muted hover:text-ink",
                    ].join(" ")}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>

              <div
                role="tabpanel"
                id={`painel-${aba}`}
                aria-labelledby={`aba-${aba}`}
                tabIndex={0}
              >
                <PassosCalculo cenario={cenarioDaAba} />
              </div>
            </div>
          )}
        </div>
      </Painel>
    </div>
  );
}

/** Uma metade do par mensal/anual. */
function Diferenca({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="rotulo-secao">{rotulo}</dt>
      <dd className="tnum text-[1.0625rem] font-semibold leading-tight text-ink">
        {valor}
      </dd>
    </div>
  );
}

/**
 * ESTÁGIO DE VALIDAÇÃO, colado ao resultado.
 *
 * O status do modelo não pode viver isolado numa barra: ele qualifica
 * o número que está logo acima. Os dois valores são derivados das
 * premissas reais — a interface nunca os escreve à mão, e eles mudam
 * sozinhos conforme o contador revisa as regras.
 */
function EstadoDoModelo({
  onAbrirPremissas,
}: {
  onAbrirPremissas: (filtro?: "pendentes") => void;
}) {
  const { total, validadas, pendentes } = resumoValidacao();
  const tudoValidado = pendentes === 0;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border-base px-4 py-2">
      <p className="flex items-center gap-1.5 text-[0.8125rem] text-ink-muted">
        <span
          aria-hidden="true"
          className={`size-2 shrink-0 rounded-full ${
            tudoValidado ? "bg-positivo" : "bg-atencao"
          }`}
        />
        <span>
          {tudoValidado ? (
            <>Resultado sob modelo revisado</>
          ) : (
            <span className="font-medium text-ink">Resultado provisório</span>
          )}{" "}
          ·{" "}
          <span className="tnum">
            {validadas} de {total} premissas validadas
          </span>
        </span>
      </p>

      {!tudoValidado && (
        <Button
          type="button"
          tamanho="sm"
          variante="sutil"
          aria-haspopup="dialog"
          onClick={() => onAbrirPremissas("pendentes")}
        >
          Ver {pendentes} premissas pendentes
        </Button>
      )}
    </div>
  );
}
