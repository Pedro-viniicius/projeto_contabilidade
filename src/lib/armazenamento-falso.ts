/**
 * `localStorage` falso, para teste.
 *
 * Vive em `src/lib` e não em um diretório de teste porque é importado
 * por testes de duas features. Não é usado em produção — nenhum módulo
 * da aplicação o referencia.
 *
 * Existe para exercitar exatamente o que um DOM real não deixa
 * simular: cota estourada, armazenamento bloqueado por política e
 * conteúdo corrompido gravado por fora.
 */

export interface ArmazenamentoFalso extends Storage {
  /** Faz a próxima e as seguintes escritas falharem com este erro. */
  falharAoGravar(nome: "QuotaExceededError" | "SecurityError" | null): void;
  /** Grava um valor cru, sem passar pela serialização da aplicação. */
  semear(chave: string, cru: string): void;
}

export function criarArmazenamentoFalso(): ArmazenamentoFalso {
  const dados = new Map<string, string>();
  let erroDeEscrita: string | null = null;

  return {
    get length() {
      return dados.size;
    },
    key(indice: number) {
      return [...dados.keys()][indice] ?? null;
    },
    getItem(chave: string) {
      return dados.get(chave) ?? null;
    },
    setItem(chave: string, valor: string) {
      if (erroDeEscrita) {
        const erro = new Error("armazenamento recusou a escrita");
        erro.name = erroDeEscrita;
        throw erro;
      }
      dados.set(chave, valor);
    },
    removeItem(chave: string) {
      dados.delete(chave);
    },
    clear() {
      dados.clear();
    },
    falharAoGravar(nome) {
      erroDeEscrita = nome;
    },
    semear(chave, cru) {
      dados.set(chave, cru);
    },
  };
}

/**
 * Instala o armazenamento falso em `globalThis` e devolve como
 * desinstalar. `obterArmazenamento()` passa a enxergá-lo.
 */
export function instalarArmazenamentoFalso(): {
  armazenamento: ArmazenamentoFalso;
  desinstalar: () => void;
} {
  const alvo = globalThis as { localStorage?: Storage };
  const anterior = Object.getOwnPropertyDescriptor(alvo, "localStorage");
  const armazenamento = criarArmazenamentoFalso();

  Object.defineProperty(alvo, "localStorage", {
    value: armazenamento,
    configurable: true,
    writable: true,
  });

  return {
    armazenamento,
    desinstalar: () => {
      if (anterior) Object.defineProperty(alvo, "localStorage", anterior);
      else delete alvo.localStorage;
    },
  };
}

/** Simula um navegador que lança ao só acessar `localStorage`. */
export function instalarArmazenamentoBloqueado(): () => void {
  const alvo = globalThis as { localStorage?: Storage };
  const anterior = Object.getOwnPropertyDescriptor(alvo, "localStorage");

  Object.defineProperty(alvo, "localStorage", {
    get() {
      const erro = new Error("acesso ao armazenamento bloqueado");
      erro.name = "SecurityError";
      throw erro;
    },
    configurable: true,
  });

  return () => {
    if (anterior) Object.defineProperty(alvo, "localStorage", anterior);
    else delete alvo.localStorage;
  };
}
