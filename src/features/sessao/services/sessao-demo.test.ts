import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  instalarArmazenamentoFalso,
  type ArmazenamentoFalso,
} from "@/lib/armazenamento-falso";
import {
  CHAVE_EMAIL_LEMBRADO,
  CHAVE_SESSAO,
  encerrarSessaoDemo,
  iniciarSessaoDemo,
  lerEmailLembrado,
  lerSessaoDemo,
  nomeExibido,
} from "./sessao-demo";

let armazenamento: ArmazenamentoFalso;
let desinstalar: () => void;

beforeEach(() => {
  ({ armazenamento, desinstalar } = instalarArmazenamentoFalso());
});
afterEach(() => desinstalar());

describe("sessão demonstrativa", () => {
  it("abre a sessão e a lê de volta", () => {
    const abertura = iniciarSessaoDemo("contador@escritorio.com.br");
    expect(abertura.sucesso).toBe(true);
    expect(lerSessaoDemo()?.email).toBe("contador@escritorio.com.br");
  });

  it("nunca grava senha — só e-mail e horário", () => {
    iniciarSessaoDemo("contador@escritorio.com.br", true);
    const cru = armazenamento.getItem(CHAVE_SESSAO)!;
    expect(Object.keys(JSON.parse(cru)).sort()).toEqual([
      "email",
      "iniciadaEm",
    ]);
  });

  it("só lembra o e-mail quando pedido", () => {
    iniciarSessaoDemo("a@b.com.br", true);
    expect(lerEmailLembrado()).toBe("a@b.com.br");

    iniciarSessaoDemo("a@b.com.br", false);
    expect(lerEmailLembrado()).toBe("");
  });

  it("relata falha em vez de fingir que o acesso foi aberto", () => {
    /* Sem gravação não há sessão: navegar mandaria o contador para a
       área de trabalho, que o devolveria para o acesso, em laço. */
    armazenamento.falharAoGravar("QuotaExceededError");
    const abertura = iniciarSessaoDemo("contador@escritorio.com.br");

    expect(abertura.sucesso).toBe(false);
    expect(abertura.sucesso === false && abertura.motivo).toBe("sem-espaco");
    expect(lerSessaoDemo()).toBeNull();
  });

  it("distingue armazenamento bloqueado de cota estourada", () => {
    armazenamento.falharAoGravar("SecurityError");
    const abertura = iniciarSessaoDemo("contador@escritorio.com.br");
    expect(abertura.sucesso === false && abertura.motivo).toBe("indisponivel");
  });

  it("descarta sessão corrompida em vez de confiar nela", () => {
    armazenamento.semear(CHAVE_SESSAO, JSON.stringify({ email: "x" }));
    expect(lerSessaoDemo()).toBeNull();

    armazenamento.semear(CHAVE_SESSAO, "{{{ quebrado");
    expect(lerSessaoDemo()).toBeNull();
  });

  it("encerrar remove a sessão e mantém o e-mail lembrado", () => {
    iniciarSessaoDemo("a@b.com.br", true);
    encerrarSessaoDemo();
    expect(lerSessaoDemo()).toBeNull();
    expect(armazenamento.getItem(CHAVE_EMAIL_LEMBRADO)).not.toBeNull();
  });
});

describe("nomeExibido", () => {
  it("deriva o nome do e-mail sem inventar dados", () => {
    expect(nomeExibido("maria.silva@escritorio.com.br")).toBe("Maria Silva");
    expect(nomeExibido("joao_pedro@x.com")).toBe("Joao Pedro");
  });

  it("cai num rótulo neutro quando não há o que derivar", () => {
    expect(nomeExibido("@x.com")).toBe("Contador");
  });
});
