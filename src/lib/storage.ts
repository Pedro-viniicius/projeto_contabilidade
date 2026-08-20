/**
 * Acesso a localStorage tolerante a falhas.
 *
 * Por que localStorage e não IndexedDB: o V1 guarda um punhado de
 * objetos pequenos e síncronos. IndexedDB traria API assíncrona e
 * complexidade sem ganho real (YAGNI).
 *
 * Todo acesso passa por aqui, então trocar por API/servidor no futuro
 * significa reescrever apenas este módulo e os serviços que o usam.
 *
 * POLÍTICA DE ERRO DESTE MÓDULO
 * -----------------------------
 * Leitura falha em silêncio: quem lê já trata "não há dado" e um
 * armazenamento indisponível é indistinguível de um vazio.
 *
 * Escrita NUNCA falha em silêncio: devolve um resultado tipado que o
 * serviço propaga até a interface. Sem isso o app diz "salvo" quando
 * não salvou — e esta é a única persistência que existe.
 */

/** Prefixo de todas as chaves do produto. Nada fora disso nos pertence. */
export const PREFIXO_CHAVES = "clareza:";

export type MotivoFalhaArmazenamento = "sem-espaco" | "indisponivel";

export type ResultadoArmazenamento =
  | { readonly sucesso: true }
  | { readonly sucesso: false; readonly motivo: MotivoFalhaArmazenamento };

const OK: ResultadoArmazenamento = { sucesso: true };

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

/**
 * Resolve o armazenamento do ambiente.
 *
 * Olha `globalThis` em vez de `window` porque o próprio acesso à
 * propriedade lança em navegador com armazenamento bloqueado por
 * política — e porque assim o módulo é testável fora do navegador.
 * No servidor não existe, e devolver `null` mantém o comportamento
 * anterior de não fazer nada.
 */
export function obterArmazenamento(): Storage | null {
  try {
    const alvo = (globalThis as { localStorage?: Storage | null }).localStorage;
    return alvo ?? null;
  } catch {
    return null;
  }
}

/** Traduz a exceção do navegador no motivo que a interface comunica. */
function motivoDe(erro: unknown): MotivoFalhaArmazenamento {
  const nome =
    typeof erro === "object" && erro !== null && "name" in erro
      ? String((erro as { name: unknown }).name)
      : "";
  return nome === "QuotaExceededError" || nome === "NS_ERROR_DOM_QUOTA_REACHED"
    ? "sem-espaco"
    : "indisponivel";
}

export function lerJson<T>(chave: string): T | null {
  const armazenamento = obterArmazenamento();
  if (!armazenamento) return null;
  try {
    const bruto = armazenamento.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    /* Modo privado, cota estourada ou JSON corrompido: seguimos sem dado. */
    return null;
  }
}

export function gravarJson(
  chave: string,
  valor: unknown,
): ResultadoArmazenamento {
  const armazenamento = obterArmazenamento();
  if (!armazenamento) return { sucesso: false, motivo: "indisponivel" };
  try {
    armazenamento.setItem(chave, JSON.stringify(valor));
    notificar();
    return OK;
  } catch (erro) {
    return { sucesso: false, motivo: motivoDe(erro) };
  }
}

export function remover(chave: string): ResultadoArmazenamento {
  const armazenamento = obterArmazenamento();
  if (!armazenamento) return { sucesso: false, motivo: "indisponivel" };
  try {
    armazenamento.removeItem(chave);
    notificar();
    return OK;
  } catch (erro) {
    return { sucesso: false, motivo: motivoDe(erro) };
  }
}

/**
 * Apaga apenas o que é do Clareza.
 *
 * Usado na recuperação de erro: um registro corrompido não deve
 * obrigar o contador a limpar o navegador inteiro, e nada fora do
 * nosso prefixo pode ser tocado.
 */
export function limparDadosDoClareza(): ResultadoArmazenamento {
  const armazenamento = obterArmazenamento();
  if (!armazenamento) return { sucesso: false, motivo: "indisponivel" };
  try {
    const nossas: string[] = [];
    for (let i = 0; i < armazenamento.length; i += 1) {
      const chave = armazenamento.key(i);
      if (chave?.startsWith(PREFIXO_CHAVES)) nossas.push(chave);
    }
    for (const chave of nossas) armazenamento.removeItem(chave);
    notificar();
    return OK;
  } catch (erro) {
    return { sucesso: false, motivo: motivoDe(erro) };
  }
}

/** Identificador simples e suficiente para registros locais. */
export function gerarId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
