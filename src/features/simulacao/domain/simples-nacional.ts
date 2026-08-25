/**
 * MOTOR DO SIMPLES NACIONAL — funções puras.
 *
 * Este arquivo contém a MECÂNICA (como a alíquota efetiva é obtida,
 * como o Fator R é calculado, quando o anexo troca). Os NÚMEROS moram
 * todos em `calculation-rules.ts`, e é de lá que estas funções leem.
 *
 * Nenhuma função aqui conhece React, DOM ou relógio.
 */

import {
  REGRAS,
  type Anexo,
  type FaixaSimples,
} from "./calculation-rules";
import {
  aliquotaEfetivaDaFaixa,
  calcularFatorR,
  calcularRbt12,
  comporDas,
  faixaDoRbt12,
  type ComposicaoDas,
} from "./apuracao-simples";

/**
 * Tabela completa de um anexo.
 *
 * A MATEMÁTICA (faixa, alíquota efetiva, Fator R, composição do DAS,
 * proporcionalização da RBT12) mora em `apuracao-simples.ts`, que é a
 * transcrição da planilha do contador. Aqui ficam só as decisões que
 * a classificação precisa tomar em cima daqueles números.
 */
export function tabelaDoAnexo(anexo: Anexo): readonly FaixaSimples[] {
  return REGRAS.simplesNacional.tabelas.valor[anexo];
}

export { faixaDoRbt12, calcularFatorR };

/** Resultado do cálculo da alíquota efetiva, com o que a originou. */
export interface AliquotaEfetiva {
  readonly anexo: Anexo;
  readonly rbt12: number;
  readonly faixa: FaixaSimples;
  /** Fração. 0,0812 = 8,12%. */
  readonly aliquota: number;
  /** Como o DAS se reparte entre União e ISS/ICMS. */
  readonly composicao: ComposicaoDas;
  /** A RBT12 estourou o teto do Simples. */
  readonly acimaDoTeto: boolean;
}

/**
 * Alíquota efetiva do Simples Nacional sobre a RBT12 informada.
 *
 * Delega a conta a `apuracao-simples.ts` e acrescenta o que a
 * interface precisa saber: a composição do DAS e se a receita já
 * estourou o teto do regime.
 */
export function calcularAliquotaEfetiva(
  rbt12: number,
  anexo: Anexo,
): AliquotaEfetiva {
  const base = Number.isFinite(rbt12) && rbt12 > 0 ? rbt12 : 0;
  const faixa = faixaDoRbt12(base, anexo);
  const aliquota = aliquotaEfetivaDaFaixa(base, faixa);

  return {
    anexo,
    rbt12: base,
    faixa,
    aliquota,
    composicao: comporDas(aliquota, faixa),
    acimaDoTeto: base > REGRAS.simplesNacional.limiteRbt12.valor,
  };
}

/** O Fator R apurado atinge o limite legal? */
export function atingeFatorR(fatorR: number | null): boolean {
  if (fatorR === null) return false;
  return fatorR >= REGRAS.simplesNacional.fatorRLimite.valor;
}

/**
 * Anexo aplicável entre dois candidatos sujeitos ao Fator R.
 *
 * Planilha, célula O17: `SE(fatorR < 28%; alíquota do Anexo V;
 * alíquota do Anexo III)`. A regra da LC 123/2006 é de igualdade
 * inclusiva: exatamente 28% já vale o Anexo III.
 *
 * `null` quando não há Fator R apurável — quem chama decide o que
 * dizer ao contador, em vez de receber um palpite.
 */
export function resolverAnexoPorFatorR(
  fatorR: number | null,
  candidatos: readonly Anexo[],
): Anexo | null {
  if (candidatos.length === 1) return candidatos[0];
  if (fatorR === null) return null;
  const alvo = atingeFatorR(fatorR) ? "III" : "V";
  return candidatos.includes(alvo) ? alvo : null;
}

/** Este anexo é calculável nesta versão do simulador? */
export function anexoTemCalculo(anexo: Anexo): boolean {
  return REGRAS.simplesNacional.anexosComCalculo.valor.includes(anexo);
}

/**
 * RBT12 efetivamente usada no cálculo.
 *
 * Quando o contador não informa a receita acumulada — empresa nova,
 * triagem rápida — projetamos 12 meses da receita informada. É uma
 * SIMPLIFICAÇÃO declarada, não um dado: quem chama recebe
 * `projetada: true` para poder avisar na tela.
 */
export interface Rbt12Aplicada {
  readonly valor: number;
  readonly projetada: boolean;
}

/**
 * RBT12 efetivamente usada no cálculo.
 *
 * Informada pelo contador, vale. Em branco, anualizamos a receita do
 * mês pela regra de proporcionalização da planilha — que com um mês
 * de atividade dá exatamente a projeção de 12× que fazíamos antes.
 * Quem chama recebe `projetada: true` para poder avisar na tela.
 */
export function rbt12Aplicada(
  rbt12Informada: number,
  receitaMensal: number,
  mesesAtividade = 1,
): Rbt12Aplicada {
  const informada =
    Number.isFinite(rbt12Informada) && rbt12Informada > 0 ? rbt12Informada : 0;
  if (informada > 0) return { valor: informada, projetada: false };
  return {
    valor: calcularRbt12(
      (Number.isFinite(receitaMensal) && receitaMensal > 0 ? receitaMensal : 0) *
        mesesAtividade,
      mesesAtividade,
    ),
    projetada: true,
  };
}
