"use client";

import { useRef, useState } from "react";
import { Painel, PainelCabecalho } from "@/components/ui/painel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Metrica } from "@/components/ui/metrica";
import { formatarMoeda } from "@/lib/format";
import { registrarEvento } from "@/lib/analytics";
import { TabelaComparativa } from "./tabela-comparativa";
import { EtiquetaAnexo } from "./seletor-atividade";
import { explicarBloqueio } from "../domain/classificacao";
import { ComposicaoEncargos, PassosCalculo } from "./composicao-encargos";
import type { Simulacao, TipoAtuacao } from "../types";

/** Ordem das abas — a mesma para clique, setas, Home e End. */
const CENARIOS = [
  ["pessoa-fisica", "Pessoa Física"],
  ["cnpj", "CNPJ"],
] as const satisfies readonly (readonly [TipoAtuacao, string])[];

/**
 * Zona de resultado da área de trabalho.
 *
 * Resumo, comparativo e auditoria convivem na mesma coluna, ao lado do
 * formulário: alterar um campo, recalcular e conferir a composição não
 * exige nenhuma troca de tela.
 */
export function PainelResultado({
  simulacao,
  desatualizado,
  onAbrirPremissas,
}: {
  simulacao: Simulacao;
  /** Os campos mudaram desde o último cálculo. */
  desatualizado: boolean;
  onAbrirPremissas: () => void;
}) {
  const { comparacao, classificacao } = simulacao;
  const [aba, setAba] = useState<TipoAtuacao>(simulacao.entrada.tipoAtuacao);
  const abasRef = useRef<Partial<Record<TipoAtuacao, HTMLButtonElement | null>>>(
    {},
  );
  const [passosAbertos, setPassosAbertos] = useState(false);

  const melhor =
    comparacao.vencedor === "cnpj"
      ? comparacao.cnpj
      : comparacao.vencedor === "pessoa-fisica"
        ? comparacao.pessoaFisica
        : null;

  const cenarioDaAba =
    aba === "cnpj" ? comparacao.cnpj : comparacao.pessoaFisica;

  /*
   * Há veredito para dar?
   *
   * Quando o anexo não tem cálculo suportado — ou a empresa já saiu do
   * Simples — o cenário CNPJ está incompleto por construção: falta um
   * tributo inteiro. Anunciar "o CNPJ rende mais R$ X" em cima disso
   * seria contradizer, no mesmo painel, o aviso que diz que o número
   * não vale. Os números da Pessoa Física seguem válidos e continuam
   * na tabela; o que some é a COMPARAÇÃO.
   *
   * Classificação pendente é outro caso: ali existe uma alíquota de
   * recurso declarada, o contador sabe o que está vendo, e o
   * comparativo continua sendo o comportamento de sempre.
   */
  const comparavel =
    classificacao.bloqueio !== "anexo-sem-calculo" &&
    classificacao.bloqueio !== "acima-do-teto";

  return (
    <div className="space-y-3">
      <Painel className={desatualizado ? "border-l-2 border-l-atencao" : undefined}>
        <PainelCabecalho
          titulo="Comparativo"
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
                  Valores alterados
                </Badge>
              )}
              {classificacao.anexo ? (
                <EtiquetaAnexo
                  anexo={classificacao.anexo}
                  manual={classificacao.manual}
                />
              ) : (
                <Badge tom="atencao" ponto>
                  Sem enquadramento
                </Badge>
              )}
            </span>
          }
        />

        {/* Resumo executivo: a resposta antes do detalhamento. */}
        {comparavel ? (
        <div className="grid divide-y divide-[var(--border)] border-b border-border-base sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Metrica
            rotulo="Maior resultado estimado"
            valor={melhor ? melhor.nome : "Empate entre os cenários"}
            apoio={
              melhor
                ? `Margem líquida de ${(melhor.margemLiquida * 100).toLocaleString(
                    "pt-BR",
                    { minimumFractionDigits: 1, maximumFractionDigits: 1 },
                  )}%`
                : "Os dois cenários chegam ao mesmo líquido."
            }
            enfase
          />
          <Metrica
            rotulo="Diferença mensal"
            valor={
              melhor
                ? `+ ${formatarMoeda(comparacao.diferencaMensal)}`
                : formatarMoeda(0)
            }
            apoio="Sobre o resultado líquido do mês"
            enfase
          />
          <Metrica
            rotulo="Impacto anual"
            valor={
              melhor
                ? `+ ${formatarMoeda(comparacao.diferencaAnual)}`
                : formatarMoeda(0)
            }
            apoio="Projeção por multiplicação direta"
            enfase
          />
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
              . Declarar um vencedor a partir dele levaria a uma decisão
              errada. Os números da Pessoa Física abaixo seguem válidos.
            </p>
          </div>
        )}

        <TabelaComparativa comparacao={comparacao} />

        {/*
          Bloqueio de cálculo vem ANTES do aviso genérico: é específico
          desta análise, e o contador precisa saber que o número do
          cenário CNPJ não representa o Simples real.
        */}
        {classificacao.bloqueio && (
          <p
            role="status"
            className="flex items-start gap-1.5 border-t border-border-base px-4 py-2.5 text-[0.75rem] leading-snug text-atencao"
          >
            <span aria-hidden="true">⚠</span>
            <span>
              {explicarBloqueio(classificacao.bloqueio, classificacao.anexo)}
            </span>
          </p>
        )}

        <p className="border-t border-border-base px-4 py-2.5 text-[0.75rem] leading-snug text-ink-subtle">
          Estimativa baseada em premissas simplificadas e ainda não validadas
          por profissional de contabilidade. Um resultado maior não constitui
          recomendação de enquadramento.
        </p>
      </Painel>

      <Painel>
        <PainelCabecalho
          titulo="Composição dos encargos"
          descricao="Abra uma linha para ver a conta e a premissa que a originou."
          /*
            Era um texto sublinhado cor de acento: parecia link e
            navegava para lugar nenhum — abre um painel. Botão com
            contorno, `aria-haspopup="dialog"` e verbo no rótulo.
          */
          acoes={
            <Button
              type="button"
              tamanho="sm"
              variante="secundaria"
              aria-haspopup="dialog"
              onClick={onAbrirPremissas}
            >
              Ver premissas do modelo
            </Button>
          }
        />

        {/*
          Padrão ARIA de abas completo. Antes havia `role="tab"` sem
          `aria-controls`, sem painel associado e sem navegação por
          setas: o leitor de tela anunciava "aba" e prometia um
          comportamento de teclado que não existia — pior do que não
          declarar papel nenhum.
        */}
        <div
          role="tablist"
          aria-label="Cenário detalhado"
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
              /* Tabulação roving: o grupo de abas é uma parada só, e as
                 setas escolhem dentro dele. */
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
          <ComposicaoEncargos cenario={cenarioDaAba} />
        </div>

        {/* Passo a passo: detalhe de conferência, recolhido por padrão. */}
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
            Passo a passo — {cenarioDaAba.nome}
          </button>
          {passosAbertos && (
            <div id="passos-calculo" className="border-t border-border-base">
              <PassosCalculo cenario={cenarioDaAba} />
            </div>
          )}
        </div>
      </Painel>
    </div>
  );
}
