/**
 * DIFERENÇA COM SENTIDO — funções puras.
 *
 * Uma coluna de "+ R$ 2.001,97" obriga o contador a lembrar, linha a
 * linha, se o sinal representa vantagem ou custo: "+" é bom no
 * resultado líquido e ruim nos encargos. Este módulo elimina a
 * inferência — cada diferença sai nomeando O CENÁRIO e a DIREÇÃO, em
 * texto, sem depender de cor nem de sinal.
 *
 *     Encargos:          "CNPJ: R$ 2.001,97 a mais"
 *     Resultado líquido: "Pessoa Física: R$ 2.001,97 a mais"
 *     Carga sobre a receita: "CNPJ: 4,0 p.p. maior"
 *
 * Sem React e sem DOM: a regra de leitura é regra, e regra se testa.
 * Nada aqui calcula tributo — apenas descreve dois números já
 * calculados pelo motor.
 */

import { formatarMoeda } from "@/lib/format";
import type { TipoAtuacao } from "../types";

/** Nome curto do cenário, como aparece nas colunas da comparação. */
export const NOME_CURTO: Record<TipoAtuacao, string> = {
  "pessoa-fisica": "Pessoa Física",
  cnpj: "CNPJ",
};

export interface DiferencaSemantica {
  /** Texto pronto para a célula, já com cenário e direção. */
  readonly texto: string;
  /** Cenário com o valor MAIOR. `null` no empate. */
  readonly cenarioMaior: TipoAtuacao | null;
  /**
   * O cenário de maior valor leva vantagem nesta linha?
   *
   * `true` em resultado e margem; `false` em encargos e carga. É o que
   * permite à interface colorir sem que a cor carregue a informação.
   * `null` no empate, em que não há vantagem a atribuir.
   */
  readonly vantagemPara: TipoAtuacao | null;
  /** Não há diferença entre os cenários nesta linha. */
  readonly empate: boolean;
}

/** Como interpretar "maior" nesta linha. */
export interface SentidoLinha {
  /**
   * `true` quando o número maior é o melhor resultado (líquido,
   * margem); `false` quando o número maior é o maior custo (encargos,
   * carga sobre a receita).
   */
  readonly maiorEhMelhor: boolean;
}

const EMPATE = {
  cenarioMaior: null,
  vantagemPara: null,
  empate: true,
} as const;

function vantagem(
  cenarioMaior: TipoAtuacao,
  { maiorEhMelhor }: SentidoLinha,
): TipoAtuacao {
  if (maiorEhMelhor) return cenarioMaior;
  return cenarioMaior === "cnpj" ? "pessoa-fisica" : "cnpj";
}

/**
 * Diferença monetária entre os cenários.
 *
 * `sufixo` permite dizer "a mais por ano" na projeção sem que a
 * interface concatene texto solto na célula.
 */
export function diferencaMoeda(
  pf: number,
  cnpj: number,
  sentido: SentidoLinha,
  sufixo = "",
): DiferencaSemantica {
  const bruta = cnpj - pf;
  /* Meio centavo de resíduo de ponto flutuante não é diferença. */
  if (Math.abs(bruta) < 0.005) {
    return { ...EMPATE, texto: `Sem diferença${sufixo}` };
  }

  const cenarioMaior: TipoAtuacao = bruta > 0 ? "cnpj" : "pessoa-fisica";
  return {
    texto: `${NOME_CURTO[cenarioMaior]}: ${formatarMoeda(
      Math.abs(bruta),
    )} a mais${sufixo}`,
    cenarioMaior,
    vantagemPara: vantagem(cenarioMaior, sentido),
    empate: false,
  };
}

/**
 * Diferença de frações percentuais, em pontos percentuais.
 *
 * Margem e carga são frações (0,144 = 14,4%). A diferença entre duas
 * frações é ponto percentual, nunca percentual — dizer "4% maior"
 * quando são 4 p.p. é erro de leitura, não de arredondamento.
 */
export function diferencaPontos(
  pf: number,
  cnpj: number,
  sentido: SentidoLinha,
): DiferencaSemantica {
  const pontos = (cnpj - pf) * 100;
  if (Math.abs(pontos) < 0.05) {
    return { ...EMPATE, texto: "Sem diferença" };
  }

  const cenarioMaior: TipoAtuacao = pontos > 0 ? "cnpj" : "pessoa-fisica";
  const formatado = Math.abs(pontos).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return {
    texto: `${NOME_CURTO[cenarioMaior]}: ${formatado} p.p. maior`,
    cenarioMaior,
    vantagemPara: vantagem(cenarioMaior, sentido),
    empate: false,
  };
}

/**
 * Linha em que a comparação não faz sentido — receita e custos, que
 * são iguais nos dois cenários por construção.
 */
export function semComparacao(): DiferencaSemantica {
  return { ...EMPATE, texto: "Igual nos dois cenários" };
}
