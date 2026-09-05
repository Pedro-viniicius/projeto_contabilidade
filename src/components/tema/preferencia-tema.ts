/**
 * Preferência de tema — dois estados, e o claro é o padrão do produto.
 *
 * Até a v2.6 havia um terceiro estado, "sistema": sem escolha do
 * contador, o CSS seguia `prefers-color-scheme` e a área de trabalho
 * abria escura em qualquer máquina configurada em escuro. Isso fazia o
 * produto mudar de aparência conforme o sistema operacional de quem
 * abrisse — e o Clareza é desenhado para leitura longa de números em
 * escritório, onde o claro é o ambiente de trabalho.
 *
 * Agora o claro é o padrão declarado. O escuro existe e continua
 * inteiro, mas é uma ESCOLHA, gravada neste navegador. Ausência de
 * preferência significa claro, não "depende".
 *
 * O tema é estado externo ao React (atributo no documento), então é
 * exposto como store observável, para ser consumido com
 * `useSyncExternalStore` em vez de efeito + setState.
 */

export type Tema = "claro" | "escuro";

export const CHAVE_TEMA = "clareza:tema";

/** Padrão do produto quando não há escolha gravada. */
export const TEMA_PADRAO: Tema = "claro";

/**
 * Script executado antes da primeira pintura, ainda no topo do body.
 *
 * Só precisa agir quando há escolha gravada: sem `data-tema`, o CSS já
 * pinta claro. Ele grava o atributo mesmo para "claro" para que o
 * documento diga sempre, explicitamente, qual tema está no ar.
 */
export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  CHAVE_TEMA,
)});if(t==="claro"||t==="escuro"){document.documentElement.dataset.tema=t;}}catch(e){}})();`;

const ouvintes = new Set<() => void>();

/**
 * Assina mudanças do tema.
 *
 * Só a escolha do contador muda o tema — a preferência do sistema
 * operacional deixou de ser consultada, e por isso não há mais
 * `matchMedia` para observar aqui.
 */
export function inscreverTema(callback: () => void): () => void {
  ouvintes.add(callback);
  return () => {
    ouvintes.delete(callback);
  };
}

/** Tema efetivamente pintado agora. String primitiva: snapshot estável. */
export function temaEfetivo(): Tema {
  const escolhido = document.documentElement.dataset.tema;
  return escolhido === "escuro" ? "escuro" : TEMA_PADRAO;
}

/**
 * No servidor não há escolha a consultar — e a resposta é a mesma que
 * no cliente sem preferência gravada, o que evita divergência de
 * hidratação no caso normal.
 */
export function temaEfetivoNoServidor(): Tema {
  return TEMA_PADRAO;
}

/** Aplica no documento e persiste a escolha neste navegador. */
export function aplicarTema(tema: Tema): void {
  if (typeof document === "undefined") return;
  try {
    document.documentElement.dataset.tema = tema;
    localStorage.setItem(CHAVE_TEMA, tema);
  } catch {
    /* Modo privado: o tema vale só para esta sessão. */
  }
  for (const ouvinte of ouvintes) ouvinte();
}
