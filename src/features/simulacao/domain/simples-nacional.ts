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

/** Arredonda para 2 casas evitando erro de ponto flutuante binário. */
function arredondar2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

/** Garante um número finito e não negativo. */
function naoNegativo(valor: number): number {
  return Number.isFinite(valor) && valor > 0 ? valor : 0;
}

/** Tabela completa de um anexo. */
export function tabelaDoAnexo(anexo: Anexo): readonly FaixaSimples[] {
  return REGRAS.simplesNacional.tabelas.valor[anexo];
}

/**
 * Faixa de RBT12 em que a receita acumulada cai.
 *
 * Acima do teto do regime a tabela acaba, e caímos na última faixa.
 * Isso NÃO é um enquadramento válido — é o melhor palpite possível
 * para exibir um número enquanto `acimaDoTeto` avisa, em alto e bom
 * som, que a empresa já não cabe no Simples.
 */
export function faixaDoRbt12(rbt12: number, anexo: Anexo): FaixaSimples {
  const tabela = tabelaDoAnexo(anexo);
  const valor = naoNegativo(rbt12);
  return tabela.find((f) => valor <= f.ate) ?? tabela[tabela.length - 1];
}

/** Resultado do cálculo da alíquota efetiva, com o que a originou. */
export interface AliquotaEfetiva {
  readonly anexo: Anexo;
  readonly rbt12: number;
  readonly faixa: FaixaSimples;
  /** Fração. 0,0812 = 8,12%. */
  readonly aliquota: number;
  /** A RBT12 estourou o teto do Simples. */
  readonly acimaDoTeto: boolean;
}

/**
 * Alíquota efetiva do Simples Nacional.
 *
 *     (RBT12 × alíquota nominal − parcela a deduzir) ÷ RBT12
 *
 * RBT12 zero NÃO divide por zero: sem receita acumulada não há o que
 * deduzir, e a alíquota efetiva é a nominal da primeira faixa. É a
 * mesma coisa que o limite da fórmula quando a RBT12 tende a zero.
 *
 * O resultado é limitado a [0, alíquota nominal]: uma parcela a
 * deduzir maior que o imposto nominal produziria alíquota negativa,
 * o que não existe.
 */
export function calcularAliquotaEfetiva(
  rbt12: number,
  anexo: Anexo,
): AliquotaEfetiva {
  const base = naoNegativo(rbt12);
  const faixa = faixaDoRbt12(base, anexo);
  const acimaDoTeto = base > REGRAS.simplesNacional.limiteRbt12.valor;

  if (base === 0) {
    return { anexo, rbt12: 0, faixa, aliquota: faixa.aliquota, acimaDoTeto };
  }

  const bruta = (base * faixa.aliquota - faixa.parcelaADeduzir) / base;
  const aliquota = Math.min(Math.max(bruta, 0), faixa.aliquota);
  return { anexo, rbt12: base, faixa, aliquota, acimaDoTeto };
}

/**
 * Fator R = folha dos últimos 12 meses ÷ receita bruta dos últimos 12
 * meses.
 *
 * Sem receita acumulada o quociente não existe. Devolvemos `null` em
 * vez de zero: zero significaria "folha nenhuma", e levaria a
 * classificar no Anexo V uma empresa sobre a qual não sabemos nada.
 */
export function calcularFatorR(
  folha12m: number,
  rbt12: number,
): number | null {
  const receita = naoNegativo(rbt12);
  if (receita === 0) return null;
  return naoNegativo(folha12m) / receita;
}

/** O Fator R apurado atinge o limite legal? */
export function atingeFatorR(fatorR: number | null): boolean {
  if (fatorR === null) return false;
  return fatorR >= REGRAS.simplesNacional.fatorRLimite.valor;
}

/**
 * Anexo aplicável entre dois candidatos sujeitos ao Fator R.
 *
 * A regra da LC 123/2006 é de igualdade inclusiva: exatamente 28% já
 * vale o anexo de serviços. `null` quando não há Fator R apurável —
 * quem chama decide o que dizer ao contador, em vez de receber um
 * palpite.
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

export function rbt12Aplicada(
  rbt12Informada: number,
  receitaMensal: number,
): Rbt12Aplicada {
  const informada = naoNegativo(rbt12Informada);
  if (informada > 0) return { valor: informada, projetada: false };
  return {
    valor: arredondar2(naoNegativo(receitaMensal) * REGRAS.mesesNoAno.valor),
    projetada: true,
  };
}
