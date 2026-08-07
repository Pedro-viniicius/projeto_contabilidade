/**
 * Acesso a localStorage tolerante a falhas.
 *
 * Por que localStorage e não IndexedDB: o V1 guarda um punhado de
 * objetos pequenos e síncronos. IndexedDB traria API assíncrona e
 * complexidade sem ganho real (YAGNI).
 *
 * Todo acesso passa por aqui, então trocar por API/servidor no futuro
 * significa reescrever apenas este módulo e os serviços que o usam.
 */

/**
 * Assinantes notificados a cada escrita, para que a interface reaja a
 * mudanças sem espalhar `useEffect` pelos componentes.
 */
const ouvintes = new Set<() => void>();

export function inscreverNoArmazenamento(callback: () => void): () => void {
  ouvintes.add(callback);
  if (typeof window !== "undefined") {
    /* "storage" cobre alterações feitas em outra aba do navegador. */
    window.addEventListener("storage", callback);
  }
  return () => {
    ouvintes.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", callback);
    }
  };
}

function notificar(): void {
  for (const ouvinte of ouvintes) ouvinte();
}

export function lerJson<T>(chave: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.localStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    /* Modo privado, cota estourada ou JSON corrompido: seguimos sem dado. */
    return null;
  }
}

export function gravarJson(chave: string, valor: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(chave, JSON.stringify(valor));
    notificar();
    return true;
  } catch {
    return false;
  }
}

export function remover(chave: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(chave);
    notificar();
  } catch {
    /* silencioso por design */
  }
}

/** Identificador simples e suficiente para registros locais. */
export function gerarId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
