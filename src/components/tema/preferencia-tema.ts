/**
 * Preferência de tema — três estados reais.
 *
 * "sistema" não é um valor guardado: é a ausência de escolha. Quando o
 * contador não decidiu nada, o CSS segue `prefers-color-scheme` e o
 * atributo `data-tema` fica ausente do `<html>`.
 *
 * O tema é estado externo ao React (atributo no documento + preferência
 * do sistema operacional), então é exposto como store observável, para
 * ser consumido com `useSyncExternalStore` em vez de efeito + setState.
 */

export type Tema = "sistema" | "claro" | "escuro";

export const CHAVE_TEMA = "clareza:tema";

const CONSULTA_ESCURO = "(prefers-color-scheme: dark)";

/**
 * Script executado antes da primeira pintura, ainda no topo do body.
 * Sem ele o tema escolhido só entraria depois da hidratação, e a tela
 * piscaria clara. Fica em string porque precisa rodar síncrono.
 */
export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  CHAVE_TEMA,
)});if(t==="claro"||t==="escuro"){document.documentElement.dataset.tema=t;}}catch(e){}})();`;

const ouvintes = new Set<() => void>();

/** Assina mudanças: escolha explícita nossa e preferência do sistema. */
export function inscreverTema(callback: () => void): () => void {
  ouvintes.add(callback);
  const consulta = window.matchMedia(CONSULTA_ESCURO);
  consulta.addEventListener("change", callback);
  return () => {
    ouvintes.delete(callback);
    consulta.removeEventListener("change", callback);
  };
}

/** Tema efetivamente pintado agora. String primitiva: snapshot estável. */
export function temaEfetivo(): "claro" | "escuro" {
  const escolhido = document.documentElement.dataset.tema;
  if (escolhido === "claro" || escolhido === "escuro") return escolhido;
  return window.matchMedia(CONSULTA_ESCURO).matches ? "escuro" : "claro";
}

/** No servidor não há como saber a preferência: assumimos o claro. */
export function temaEfetivoNoServidor(): "claro" {
  return "claro";
}

/** Aplica no documento e persiste. "sistema" remove os dois registros. */
export function aplicarTema(tema: Tema): void {
  if (typeof document === "undefined") return;
  try {
    if (tema === "sistema") {
      delete document.documentElement.dataset.tema;
      localStorage.removeItem(CHAVE_TEMA);
    } else {
      document.documentElement.dataset.tema = tema;
      localStorage.setItem(CHAVE_TEMA, tema);
    }
  } catch {
    /* Modo privado: o tema vale só para esta sessão. */
  }
  for (const ouvinte of ouvintes) ouvinte();
}
