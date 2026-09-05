/**
 * O QUE O CONTADOR VÊ ANTES DE ENTRAR — funções puras.
 *
 * Até a v2.4 a tela de acesso apresentava o produto por QUATRO
 * SUBSISTEMAS — "Comparativo", "Auditoria", "Premissas", "Histórico".
 * São nomes que só fazem sentido para quem já usou a ferramenta: quem
 * abre pela primeira vez precisa deduzir o que cada um faz, e quem já
 * usa não estava ali para ler índice de funcionalidade — estava ali
 * para entrar.
 *
 * A troca é de estrutura para TRABALHO. O contador não pensa "vou usar
 * o módulo de auditoria"; ele pensa "preencho os dados do cliente,
 * comparo, confiro antes de apresentar". As três etapas abaixo são o
 * fluxo real do produto, na ordem em que ele acontece.
 *
 * Sem React e sem DOM, pelo mesmo motivo de `revisao-calculo.ts`: o
 * texto que apresenta o produto é decisão de produto, e decisão de
 * produto se testa.
 */

import type { ResumoValidacao } from "@/features/simulacao/domain/calculation-rules";

export interface EtapaDoFluxo {
  readonly numero: number;
  readonly titulo: string;
  readonly apoio: string;
}

/**
 * O fluxo do produto em três passos.
 *
 * Cada linha é uma AÇÃO do contador, não um lugar do sistema. O apoio
 * tem uma linha só: aqui o objetivo é reconhecimento, não treinamento
 * — quem já conhece precisa poder ignorar tudo isto e ir ao formulário.
 */
export const ETAPAS_DO_FLUXO: readonly EtapaDoFluxo[] = [
  {
    numero: 1,
    titulo: "Preencha os dados do cliente",
    apoio: "Receita, custos e informações do enquadramento.",
  },
  {
    numero: 2,
    titulo: "Compare os cenários",
    apoio: "Pessoa Física e CNPJ lado a lado, sem alternar telas.",
  },
  {
    numero: 3,
    titulo: "Revise antes de apresentar",
    apoio: "Encargos, diferenças e premissas utilizadas.",
  },
];

export interface AvisoDoModelo {
  readonly titulo: string;
  readonly texto: string;
  /** Estágio real de validação. Nunca escrito à mão. */
  readonly detalhe: string;
}

const plural = (n: number, um: string, muitos: string) =>
  `${n} ${n === 1 ? um : muitos}`;

/**
 * O que o produto é, e o que ele não é — dito antes de entrar.
 *
 * O contador assina o que apresenta ao cliente. Esconder o estágio do
 * modelo no rodapé seria transferir para ele um risco que é nosso, e
 * por isso este bloco fica junto da explicação do produto, não na
 * borda inferior da tela.
 *
 * O número vem de `resumoValidacao()`: se uma premissa mudar de status
 * no domínio, esta tela muda junto, sozinha. Não há como o texto e o
 * modelo divergirem.
 *
 * TOM: informação, não alarme. Não há erro nenhum acontecendo — há um
 * escopo a declarar. Vermelho e âmbar estão reservados a problema real.
 */
export function avisoDoModelo({
  total,
  pendentes,
}: ResumoValidacao): AvisoDoModelo {
  return {
    titulo: "Ferramenta de apoio à decisão",
    texto:
      "Os resultados são estimativas calculadas a partir das premissas " +
      "do modelo e não substituem a apuração fiscal.",
    detalhe:
      pendentes === 0
        ? `As ${total} premissas do modelo já foram validadas tecnicamente.`
        : `${plural(
            pendentes,
            "premissa ainda aguarda",
            "premissas ainda aguardam",
          )} revisão de um contador, de ${total} no modelo.`,
  };
}
