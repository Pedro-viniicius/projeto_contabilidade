/**
 * COMPOSIÇÃO DOS ENCARGOS, LADO A LADO — funções puras.
 *
 * Até a v2.3 a composição vinha em abas: o contador abria a Pessoa
 * Física, DECORAVA os valores, trocava de aba e comparava de cabeça.
 * Comparação que depende de memória é comparação que erra.
 *
 * Aqui as duas composições viram uma tabela só, casada pela CATEGORIA
 * do encargo — nunca pelo rótulo, que é texto de interface e muda. O
 * mesmo INSS aparece como "contribuinte individual" na Pessoa Física e
 * como "sobre o pró-labore" no CNPJ; são a mesma linha, com rótulos
 * próprios preservados em cada coluna.
 *
 * Nada é calculado aqui. Os valores vêm prontos do motor; este módulo
 * agrupa, ordena e descreve a diferença.
 */

import {
  ROTULO_CATEGORIA,
  type CategoriaEncargo,
  type Comparacao,
  type Encargo,
  type ResultadoCenario,
} from "../types";
import {
  diferencaMoeda,
  diferencaPontos,
  type DiferencaSemantica,
} from "./diferenca-semantica";

/**
 * Ordem de leitura das categorias.
 *
 * Segue a conversa do contador com o cliente — o que sai da folha
 * antes do que sai do faturamento, e o custo de manter a estrutura por
 * último. Categoria ausente nos dois cenários não gera linha.
 */
const ORDEM: readonly CategoriaEncargo[] = ["inss", "irpf", "das", "honorarios"];

/** Um lado da linha comparada. */
export interface LadoEncargo {
  /** Soma dos encargos da categoria neste cenário. */
  readonly valorMensal: number;
  /** Encargos que compõem o lado, para o detalhe da linha aberta. */
  readonly encargos: readonly Encargo[];
}

export interface LinhaEncargoComparada {
  readonly categoria: CategoriaEncargo;
  /** Nome da categoria, igual para os dois cenários. */
  readonly rotulo: string;
  /** `null` quando a categoria não existe naquele cenário. */
  readonly pessoaFisica: LadoEncargo | null;
  readonly cnpj: LadoEncargo | null;
  readonly diferenca: DiferencaSemantica;
  /**
   * A categoria só existe de um lado — ex.: o DAS, que não tem
   * equivalente na Pessoa Física. A diferença continua verdadeira, mas
   * a interface precisa dizer "não se aplica" na coluna vazia em vez
   * de exibir R$ 0,00, que sugeriria isenção.
   */
  readonly apenasEm: "pessoa-fisica" | "cnpj" | null;
}

export interface TotalComparado {
  readonly pessoaFisica: number;
  readonly cnpj: number;
  readonly diferenca: DiferencaSemantica;
  /** Encargos ÷ receita, por cenário. */
  readonly cargaPessoaFisica: number;
  readonly cargaCnpj: number;
  readonly diferencaCarga: DiferencaSemantica;
}

export interface ComposicaoComparada {
  readonly linhas: readonly LinhaEncargoComparada[];
  readonly total: TotalComparado;
}

function ladoDe(
  cenario: ResultadoCenario,
  categoria: CategoriaEncargo,
): LadoEncargo | null {
  const encargos = cenario.encargos.filter((e) => e.categoria === categoria);
  if (encargos.length === 0) return null;
  return {
    valorMensal: encargos.reduce((soma, e) => soma + e.valorMensal, 0),
    encargos,
  };
}

/**
 * Monta a composição comparada.
 *
 * Encargo é CUSTO: em toda linha daqui, o valor maior é a desvantagem.
 * É por isso que `maiorEhMelhor` é sempre `false` — inclusive na carga
 * sobre a receita.
 */
export function compararEncargos(comparacao: Comparacao): ComposicaoComparada {
  const { pessoaFisica: pf, cnpj } = comparacao;

  const linhas: LinhaEncargoComparada[] = [];
  for (const categoria of ORDEM) {
    const ladoPf = ladoDe(pf, categoria);
    const ladoCnpj = ladoDe(cnpj, categoria);
    if (!ladoPf && !ladoCnpj) continue;

    linhas.push({
      categoria,
      rotulo: ROTULO_CATEGORIA[categoria],
      pessoaFisica: ladoPf,
      cnpj: ladoCnpj,
      diferenca: diferencaMoeda(
        ladoPf?.valorMensal ?? 0,
        ladoCnpj?.valorMensal ?? 0,
        { maiorEhMelhor: false },
      ),
      apenasEm: !ladoPf ? "cnpj" : !ladoCnpj ? "pessoa-fisica" : null,
    });
  }

  return {
    linhas,
    total: {
      pessoaFisica: pf.encargosMensais,
      cnpj: cnpj.encargosMensais,
      diferenca: diferencaMoeda(pf.encargosMensais, cnpj.encargosMensais, {
        maiorEhMelhor: false,
      }),
      cargaPessoaFisica: pf.cargaSobreReceita,
      cargaCnpj: cnpj.cargaSobreReceita,
      diferencaCarga: diferencaPontos(
        pf.cargaSobreReceita,
        cnpj.cargaSobreReceita,
        { maiorEhMelhor: false },
      ),
    },
  };
}

/**
 * Categorias que mais explicam a diferença de encargos, da maior para
 * a menor, ignorando as que praticamente empatam.
 *
 * É o insumo de "O que explica a diferença?": em vez de narrar todas
 * as linhas, a interface cita as que realmente pesam.
 */
export function maioresContribuintes(
  composicao: ComposicaoComparada,
  quantidade = 2,
): readonly LinhaEncargoComparada[] {
  return composicao.linhas
    .filter((l) => !l.diferenca.empate)
    .slice()
    .sort(
      (a, b) =>
        Math.abs(
          (b.cnpj?.valorMensal ?? 0) - (b.pessoaFisica?.valorMensal ?? 0),
        ) -
        Math.abs(
          (a.cnpj?.valorMensal ?? 0) - (a.pessoaFisica?.valorMensal ?? 0),
        ),
    )
    .slice(0, quantidade);
}
