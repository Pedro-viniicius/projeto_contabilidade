/**
 * QUAL É O PRÓXIMO PASSO DO ENQUADRAMENTO — função pura.
 *
 * O bloco de enquadramento não pode se limitar a dizer que está
 * pendente: ele precisa dizer O QUE FALTA e oferecer o caminho para
 * resolver. Como "o que falta" depende do estado da classificação, a
 * decisão fica aqui, testável, e não espalhada em JSX.
 *
 * Sem React, sem DOM, sem relógio.
 */

import type { Classificacao } from "../domain/classificacao";

/** Campo que precisa ser preenchido para o anexo sair da pendência. */
export type CampoPendente = "atividade" | "receita";

export interface AcaoEnquadramento {
  readonly campo: CampoPendente;
  /** Rótulo do botão. Sempre um verbo e o objeto. */
  readonly rotulo: string;
  /** Frase curta que explica a pendência, antes do botão. */
  readonly motivo: string;
}

/**
 * A pendência do enquadramento, quando existe.
 *
 * `null` quando há anexo — nesse caso não há próximo passo obrigatório,
 * e o bloco volta a ser um resumo.
 *
 * A classificação fica pendente em exatamente dois casos, e cada um
 * tem um campo diferente faltando. Tratar os dois como "informe a
 * atividade" mandaria o contador mexer num campo já preenchido.
 */
export function acaoDoEnquadramento(
  classificacao: Classificacao,
): AcaoEnquadramento | null {
  if (classificacao.anexo !== null) return null;

  if (classificacao.atividade === null) {
    return {
      campo: "atividade",
      rotulo: "Informar atividade",
      motivo:
        "Nenhuma atividade foi informada — é ela que define o anexo do Simples.",
    };
  }

  /*
   * Atividade informada e sujeita ao Fator R, mas sem receita para
   * apurá-lo. O que falta é a receita, não a atividade.
   */
  return {
    campo: "receita",
    rotulo: "Informar receita mensal",
    motivo:
      "A atividade depende do Fator R, e ainda não há receita para apurá-lo.",
  };
}

/**
 * O bloco de enquadramento pode encolher para uma linha?
 *
 * Só quando NÃO há nada a resolver. Encolher com pendência aberta
 * esconderia justamente o caminho para sair dela, e encolher com o
 * cálculo bloqueado esconderia que o número do cenário CNPJ não vale.
 *
 * A escolha manual NÃO impede o resumo — mas o resumo é obrigado a
 * declará-la, porque ela sobrepõe a classificação do sistema e a
 * análise precisa continuar auditável depois de qualquer rolagem.
 */
export function enquadramentoResolvido(
  classificacao: Classificacao,
): boolean {
  if (classificacao.anexo === null) return false;
  if (classificacao.bloqueio !== null) return false;
  return classificacao.atividade !== null || classificacao.manual;
}

/**
 * Rótulo do detalhe técnico, ciente do estado.
 *
 * "Por que esta classificação?" não faz sentido quando não existe
 * classificação nenhuma para justificar.
 */
export function rotuloDetalhe(classificacao: Classificacao): string {
  return classificacao.anexo === null
    ? "Por que o enquadramento está pendente?"
    : "Por que esta classificação?";
}

/**
 * Como o Fator R deve ser apresentado.
 *
 * Sem atividade, o sistema NÃO SABE se o Fator R se aplica — dizer
 * "não se aplica" seria afirmar algo que o domínio não afirmou. A
 * distinção existe no dado (`atividade === null`), e é só de
 * apresentação: nenhuma regra muda aqui.
 */
export function textoFatorR(classificacao: Classificacao): string {
  const { atividade, sujeitaFatorR, fatorR } = classificacao;

  if (atividade === null && !classificacao.manual) {
    return "A definir após informar a atividade";
  }
  if (!sujeitaFatorR) return "Não se aplica a esta atividade";
  if (fatorR === null || fatorR.valor === null) {
    return "Sem receita de 12 meses para apurar";
  }
  return `${pct(fatorR.valor)} — limite ${pct(fatorR.limite)}`;
}

/** Como os anexos candidatos devem ser apresentados. */
export function textoAnexosPossiveis(classificacao: Classificacao): string {
  const { anexosPossiveis, atividade } = classificacao;
  if (anexosPossiveis.length > 0) {
    return anexosPossiveis.map((a) => `Anexo ${a}`).join(" ou ");
  }
  return atividade === null
    ? "Aguardando a atividade"
    : "Não identificado";
}

const pct = (v: number) =>
  `${(v * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
