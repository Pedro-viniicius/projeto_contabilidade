/**
 * O QUE O CONTADOR PRECISA FAZER COM O MODELO — função pura.
 *
 * Até a v2.4 o cabeçalho anunciava "Modelo em validação 13/18". São
 * três informações internas e nenhuma tarefa: o contador precisava
 * inferir o que significa a fração, se aquilo era um problema, se era
 * clicável e o que aconteceria depois do clique.
 *
 * Aqui o mesmo dado vira AÇÃO. O número deixa de ser um placar e passa
 * a ser a dimensão do trabalho pendente — "13 pendências" —, e o rótulo
 * diz o que fazer com ele.
 *
 * Sem React e sem DOM: o texto de um controle global é decisão de
 * produto, e decisão de produto se testa. Nada aqui calcula nada — os
 * números vêm prontos de `resumoValidacao()`.
 */

import type { ResumoValidacao } from "../domain/calculation-rules";

export interface EstadoRevisao {
  /** Rótulo visível do botão. Sempre um verbo ou um estado concluído. */
  readonly rotulo: string;
  /** Dimensão do trabalho pendente. `null` quando não há o que revisar. */
  readonly detalhe: string | null;
  /**
   * Nome acessível completo.
   *
   * O detalhe some visualmente em telas estreitas; o nome acessível
   * nunca encolhe, e começa pelo rótulo visível — é o que mantém a
   * correspondência entre o que se lê e o que se ouve.
   */
  readonly nomeAcessivel: string;
  /** Linha de apoio, para `title` e para leitura no painel. */
  readonly resumo: string;
  /** Há trabalho pendente: o controle assume o tom de atenção (âmbar). */
  readonly precisaAtencao: boolean;
}

const plural = (n: number, um: string, muitos: string) =>
  `${n} ${n === 1 ? um : muitos}`;

/**
 * Traduz o estágio de validação do modelo em uma tarefa.
 *
 * VOCABULÁRIO: "validada tecnicamente" é o termo do próprio domínio
 * (`ROTULO_STATUS`) e significa conferida contra a fonte legal citada
 * na premissa. NÃO significa aprovação contábil da análise, e nenhum
 * texto daqui pode sugerir que signifique — é justamente a confusão
 * que o produto existe para evitar.
 */
export function estadoDaRevisao({
  total,
  validadas,
  pendentes,
}: ResumoValidacao): EstadoRevisao {
  const resumo = `${validadas} de ${total} premissas validadas tecnicamente`;

  if (pendentes === 0) {
    return {
      rotulo: "Cálculo revisado",
      detalhe: null,
      nomeAcessivel: `Cálculo revisado: ${resumo}. Abre as premissas e o escopo do modelo.`,
      resumo,
      precisaAtencao: false,
    };
  }

  return {
    rotulo: "Revisar cálculo",
    detalhe: plural(pendentes, "pendência", "pendências"),
    nomeAcessivel: `Revisar cálculo: ${plural(
      pendentes,
      "premissa ainda não validada",
      "premissas ainda não validadas",
    )} de ${total}. Abre as premissas e o escopo do modelo.`,
    resumo,
    precisaAtencao: true,
  };
}

/** Estado da análise aberta, para a etiqueta ao lado da referência. */
export interface EstadoAnalise {
  readonly jaCalculou: boolean;
  readonly desatualizado: boolean;
}

export interface EtiquetaAnalise {
  readonly texto: string;
  /** Complemento só para leitor de tela, quando o texto é abreviado. */
  readonly complemento: string;
  readonly tom: "atencao" | "neutro";
}

/**
 * Etiqueta de estado da análise aberta.
 *
 * `null` numa análise nova e nunca calculada: ali não há estado a
 * relatar, e uma etiqueta "não calculada" sobre um formulário vazio é
 * ruído — o próprio formulário vazio já diz isso.
 *
 * É ESTADO, não ação. Quem exibe precisa deixá-la visualmente
 * inequívoca como etiqueta, sem contorno nem cursor de clique.
 */
export function etiquetaDaAnalise({
  jaCalculou,
  desatualizado,
}: EstadoAnalise): EtiquetaAnalise | null {
  if (!jaCalculou) return null;

  if (desatualizado) {
    return {
      texto: "Desatualizada",
      complemento: "há alterações ainda não calculadas",
      tom: "atencao",
    };
  }

  return {
    texto: "Salva",
    complemento: "neste navegador",
    tom: "neutro",
  };
}
