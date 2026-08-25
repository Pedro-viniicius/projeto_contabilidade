/**
 * APURAÇÃO DO SIMPLES NACIONAL — funções puras.
 *
 * Transcrição da planilha "CÁLCULO DO SIMPLES NACIONAL" usada pelo
 * contador que valida o produto. Cada função abaixo aponta a célula
 * de origem, para que a conferência seja linha a linha.
 *
 * A planilha trabalha em PONTOS PERCENTUAIS (13,5 significa 13,5%).
 * Aqui tudo é fração (0,135), como no resto do domínio; a conversão
 * acontece só na fronteira. Os testes reproduzem os valores em cache
 * da planilha para provar que a tradução não mudou nenhum número.
 *
 * Os NÚMEROS continuam todos em `calculation-rules.ts`.
 */

import {
  REGRAS,
  type Anexo,
  type FaixaSimples,
} from "./calculation-rules";

/** Um mês do histórico do cliente. */
export interface CompetenciaHistorico {
  /** "AAAA-MM". Ordenável como texto, e é assim que comparamos. */
  readonly competencia: string;
  readonly faturamento: number;
  readonly folha: number;
}

function naoNegativo(v: number): number {
  return Number.isFinite(v) && v > 0 ? v : 0;
}

function arredondar2(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

/**
 * As 12 competências ANTERIORES à de apuração.
 *
 * Planilha: `SUMIFS(...; A<=EDATE(F4;-1); A>=EDATE(F4;-12))`. O mês
 * que está sendo apurado NÃO entra na base — é o mês anterior que
 * fecha a janela. Incluir o mês corrente inflaria a RBT12 e poderia
 * empurrar o cliente para a faixa seguinte sem motivo.
 */
export function janela12Meses(
  historico: readonly CompetenciaHistorico[],
  competenciaApuracao: string,
): readonly CompetenciaHistorico[] {
  const fim = deslocarCompetencia(competenciaApuracao, -1);
  const inicio = deslocarCompetencia(competenciaApuracao, -12);
  return historico.filter(
    (m) => m.competencia >= inicio && m.competencia <= fim,
  );
}

/** Soma o faturamento da janela. Planilha: parte interna de F6. */
export function receitaAcumulada12(
  historico: readonly CompetenciaHistorico[],
  competenciaApuracao: string,
): number {
  return arredondar2(
    janela12Meses(historico, competenciaApuracao).reduce(
      (soma, m) => soma + naoNegativo(m.faturamento),
      0,
    ),
  );
}

/** Soma a folha da janela. Planilha: T4. */
export function folhaAcumulada12(
  historico: readonly CompetenciaHistorico[],
  competenciaApuracao: string,
): number {
  return arredondar2(
    janela12Meses(historico, competenciaApuracao).reduce(
      (soma, m) => soma + naoNegativo(m.folha),
      0,
    ),
  );
}

/**
 * RBT12, com proporcionalização.
 *
 * Planilha F6: `SOMA(12 meses) / mesesAtividade * 12`.
 *
 * `mesesAtividade` menor que 12 é o caso da empresa nova: em vez de
 * comparar 5 meses de receita com uma tabela anual, anualiza-se a
 * média. É a regra do art. 18, §2º da LC 123/2006 — e substitui a
 * projeção grosseira que o simulador fazia antes (receita do mês ×
 * 12), que só acertava quando havia exatamente um mês de atividade.
 */
export function calcularRbt12(
  receitaAcumulada: number,
  mesesAtividade: number = REGRAS.simplesNacional.mesesParaProporcionalizar
    .valor,
): number {
  const meses = Math.min(
    Math.max(Math.trunc(naoNegativo(mesesAtividade)), 1),
    REGRAS.simplesNacional.mesesParaProporcionalizar.valor,
  );
  const base = naoNegativo(receitaAcumulada);
  return arredondar2(
    (base / meses) * REGRAS.simplesNacional.mesesParaProporcionalizar.valor,
  );
}

/**
 * Alíquota efetiva.
 *
 * Planilha I: `IFERRO((((RBT12 * nominal/100) - parcela) / RBT12) * 100)`,
 * que é algebricamente `nominal - 100 * parcela / RBT12`.
 *
 * RBT12 zero não divide por zero: sem receita acumulada não há o que
 * deduzir, e sobra a nominal da primeira faixa — o mesmo limite para
 * o qual a expressão tende.
 */
export function aliquotaEfetivaDaFaixa(
  rbt12: number,
  faixa: FaixaSimples,
): number {
  const base = naoNegativo(rbt12);
  if (base === 0) return faixa.aliquota;
  const bruta = (base * faixa.aliquota - faixa.parcelaADeduzir) / base;
  return Math.min(Math.max(bruta, 0), faixa.aliquota);
}

/**
 * Fator R. Planilha T6: `SE(RBT12=0; 0; folha12 / RBT12)`.
 *
 * A planilha devolve 0 quando não há RBT12; aqui devolvemos `null`,
 * porque zero significaria "folha nenhuma" e classificaria no Anexo V
 * uma empresa sobre a qual não sabemos nada. Quem chama decide o que
 * dizer — e o resultado prático é o mesmo, já que 0 < 28%.
 */
export function calcularFatorR(
  folha12: number,
  rbt12: number,
): number | null {
  const receita = naoNegativo(rbt12);
  if (receita === 0) return null;
  return naoNegativo(folha12) / receita;
}

/**
 * Composição do DAS entre a União e o tributo local.
 *
 * Planilha, colunas J/K/T do Anexo III e IV:
 *
 *     K = SE(efetiva >= limiar; 5; 0)      ← ISS travado em 5 pontos
 *     J = SE(efetiva >= limiar; efetiva-K; efetiva)
 *     T = J + K                            ← o total NÃO muda
 *
 * O limiar da planilha (14,92537 no III e V, 12,5 no IV) não é uma
 * constante arbitrária: é `5 ÷ parcela do ISS` da faixa. Derivamos a
 * regra da própria repartição, o que dá exatamente o mesmo resultado e
 * continua correto se a repartição de alguma faixa mudar.
 *
 * O teto redistribui, não desconta: o DAS total é o mesmo.
 */
export interface ComposicaoDas {
  /** Fração da receita destinada a tributos federais. */
  readonly federal: number;
  /** Fração destinada ao ISS (serviços) ou ICMS (comércio/indústria). */
  readonly local: number;
  /** O teto de 5 pontos do ISS foi acionado. */
  readonly tetoLocalAplicado: boolean;
}

export function comporDas(
  aliquotaEfetiva: number,
  faixa: FaixaSimples,
): ComposicaoDas {
  const teto = REGRAS.simplesNacional.tetoIssPontos.valor / 100;
  const localBruto = aliquotaEfetiva * faixa.reparticao.local;

  if (localBruto <= teto) {
    return {
      federal: aliquotaEfetiva * faixa.reparticao.federal,
      local: localBruto,
      tetoLocalAplicado: false,
    };
  }

  return {
    federal: aliquotaEfetiva - teto,
    local: teto,
    tetoLocalAplicado: true,
  };
}

/** Resultado completo da apuração de um mês. */
export interface ApuracaoMes {
  readonly anexo: Anexo;
  readonly rbt12: number;
  readonly faixa: FaixaSimples;
  readonly aliquotaEfetiva: number;
  /** Valor do DAS do mês. */
  readonly das: number;
  readonly composicao: ComposicaoDas;
  /** `null` quando não há RBT12 para apurar. */
  readonly fatorR: number | null;
  /** A RBT12 foi anualizada a partir de menos de 12 meses. */
  readonly rbt12Proporcionalizada: boolean;
}

/** Faixa da tabela em que a RBT12 cai. */
export function faixaDoRbt12(rbt12: number, anexo: Anexo): FaixaSimples {
  const tabela = REGRAS.simplesNacional.tabelas.valor[anexo];
  const valor = naoNegativo(rbt12);
  return tabela.find((f) => valor <= f.ate) ?? tabela[tabela.length - 1];
}

/**
 * Apuração de um mês, no anexo informado.
 *
 * Recebe o anexo JÁ RESOLVIDO. Quem decide entre III e V pelo Fator R
 * é a camada de classificação — aqui só se apura.
 */
export function apurarMes(entrada: {
  readonly anexo: Anexo;
  readonly faturamentoDoMes: number;
  readonly receitaAcumulada12: number;
  readonly folhaAcumulada12: number;
  readonly mesesAtividade?: number;
}): ApuracaoMes {
  const rbt12 = calcularRbt12(
    entrada.receitaAcumulada12,
    entrada.mesesAtividade,
  );
  const faixa = faixaDoRbt12(rbt12, entrada.anexo);
  const aliquotaEfetiva = aliquotaEfetivaDaFaixa(rbt12, faixa);
  const meses = entrada.mesesAtividade;

  return {
    anexo: entrada.anexo,
    rbt12,
    faixa,
    aliquotaEfetiva,
    das: arredondar2(naoNegativo(entrada.faturamentoDoMes) * aliquotaEfetiva),
    composicao: comporDas(aliquotaEfetiva, faixa),
    fatorR: calcularFatorR(entrada.folhaAcumulada12, rbt12),
    rbt12Proporcionalizada:
      meses !== undefined &&
      meses < REGRAS.simplesNacional.mesesParaProporcionalizar.valor,
  };
}

/** Soma um número de meses a uma competência "AAAA-MM". */
export function deslocarCompetencia(
  competencia: string,
  meses: number,
): string {
  const [ano, mes] = competencia.split("-").map(Number);
  const total = ano * 12 + (mes - 1) + meses;
  const anoNovo = Math.floor(total / 12);
  const mesNovo = (total % 12) + 1;
  return `${String(anoNovo).padStart(4, "0")}-${String(mesNovo).padStart(2, "0")}`;
}
