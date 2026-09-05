/**
 * Semântica das ações sobre uma análise.
 *
 * Módulo sem React e sem DOM, no mesmo espírito de `atalho-recalculo`:
 * o que um botão diz, e o que ele destrói, é decisão de regra — e
 * regra se testa. Manter os rótulos aqui também é o que impede a mesma
 * ação de aparecer como "Nova" num canto e "Nova análise" em outro.
 */

/** Referência legível de um registro, para compor nome acessível. */
function referenciaLegivel(referencia?: string | null): string {
  const limpa = referencia?.trim();
  return limpa ? limpa : "sem referência";
}

/**
 * Rótulo da ação primária da zona de dados.
 *
 * "Calcular análise" e "Atualizar resultados" são ações diferentes com
 * consequências diferentes — a primeira CRIA o resultado, a segunda
 * traz o resultado que já está na tela de volta aos valores dos
 * campos. O texto muda junto, e o segundo nomeia o que muda na tela
 * (os resultados), não o que a máquina faz (recalcular).
 */
export function rotuloCalculo(jaCalculou: boolean): string {
  return jaCalculou ? "Atualizar resultados" : "Calcular análise";
}

export interface ContextoNovaAnalise {
  /** Já existe resultado na tela para os valores atuais ou anteriores. */
  readonly jaCalculou: boolean;
  /** Os campos mudaram desde o último cálculo. */
  readonly desatualizado: boolean;
  /** Há algo digitado que valha a pena preservar. */
  readonly temValoresPreenchidos: boolean;
}

/**
 * "Nova análise" apaga trabalho que não está no histórico?
 *
 * O histórico só recebe o que foi calculado. Portanto:
 *
 * - análise calculada e sem edição pendente → tudo já está salvo, e
 *   pedir confirmação seria atrito puro;
 * - valores digitados e nunca calculados → nada foi salvo, e o clique
 *   perde o que foi digitado;
 * - análise calculada com edição por cima → o cálculo está salvo, mas
 *   as alterações posteriores não.
 *
 * Confirmação só nos dois últimos casos. Diálogo em ação reversível
 * ensina o contador a confirmar sem ler.
 */
export function novaAnaliseDescartaTrabalho({
  jaCalculou,
  desatualizado,
  temValoresPreenchidos,
}: ContextoNovaAnalise): boolean {
  if (!jaCalculou) return temValoresPreenchidos;
  return desatualizado;
}

/**
 * Nome acessível de "Abrir" na lista do histórico.
 *
 * Uma coluna com oito botões "Abrir" é, para um leitor de tela, oito
 * controles idênticos. O nome precisa dizer qual análise.
 */
export function nomeAcessivelAbrir(referencia?: string | null): string {
  return `Abrir análise ${referenciaLegivel(referencia)}`;
}

/** Idem para a exclusão — que é irreversível e precisa nomear o alvo. */
export function nomeAcessivelExcluir(referencia?: string | null): string {
  return `Excluir análise ${referenciaLegivel(referencia)}`;
}

/** Pergunta da confirmação de exclusão, com o alvo explícito. */
export function perguntaExclusao(referencia?: string | null): string {
  return `Excluir a análise ${referenciaLegivel(referencia)}? Não é possível desfazer.`;
}
