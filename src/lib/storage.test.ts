import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  gravarJson,
  lerJson,
  limparDadosDoClareza,
  obterArmazenamento,
  remover,
} from "./storage";
import {
  instalarArmazenamentoBloqueado,
  instalarArmazenamentoFalso,
  type ArmazenamentoFalso,
} from "./armazenamento-falso";

describe("storage — escrita nunca falha em silêncio", () => {
  let armazenamento: ArmazenamentoFalso;
  let desinstalar: () => void;

  beforeEach(() => {
    ({ armazenamento, desinstalar } = instalarArmazenamentoFalso());
  });
  afterEach(() => desinstalar());

  it("grava e lê de volta", () => {
    expect(gravarJson("clareza:teste", { a: 1 })).toEqual({ sucesso: true });
    expect(lerJson<{ a: number }>("clareza:teste")).toEqual({ a: 1 });
  });

  it("devolve falha de cota quando setItem estoura", () => {
    armazenamento.falharAoGravar("QuotaExceededError");
    expect(gravarJson("clareza:teste", { a: 1 })).toEqual({
      sucesso: false,
      motivo: "sem-espaco",
    });
  });

  it("classifica qualquer outra exceção como indisponível", () => {
    armazenamento.falharAoGravar("SecurityError");
    expect(gravarJson("clareza:teste", { a: 1 })).toEqual({
      sucesso: false,
      motivo: "indisponivel",
    });
  });

  it("lê null quando o JSON está corrompido, sem lançar", () => {
    armazenamento.semear("clareza:teste", "{ isto não é json");
    expect(lerJson("clareza:teste")).toBeNull();
  });

  it("remove devolvendo sucesso", () => {
    gravarJson("clareza:teste", 1);
    expect(remover("clareza:teste")).toEqual({ sucesso: true });
    expect(lerJson("clareza:teste")).toBeNull();
  });
});

describe("storage — armazenamento indisponível", () => {
  it("reporta indisponível quando não há localStorage (servidor)", () => {
    const alvo = globalThis as { localStorage?: Storage };
    const anterior = Object.getOwnPropertyDescriptor(alvo, "localStorage");
    delete alvo.localStorage;

    expect(obterArmazenamento()).toBeNull();
    expect(gravarJson("clareza:teste", 1)).toEqual({
      sucesso: false,
      motivo: "indisponivel",
    });
    expect(lerJson("clareza:teste")).toBeNull();

    if (anterior) Object.defineProperty(alvo, "localStorage", anterior);
  });

  it("não lança quando o próprio acesso ao armazenamento é bloqueado", () => {
    const restaurar = instalarArmazenamentoBloqueado();
    expect(() => obterArmazenamento()).not.toThrow();
    expect(obterArmazenamento()).toBeNull();
    expect(gravarJson("clareza:teste", 1)).toEqual({
      sucesso: false,
      motivo: "indisponivel",
    });
    restaurar();
  });
});

describe("limparDadosDoClareza", () => {
  it("apaga apenas as chaves do produto", () => {
    const { armazenamento, desinstalar } = instalarArmazenamentoFalso();
    armazenamento.semear("clareza:simulacao:atual", "{}");
    armazenamento.semear("clareza:feedback", "[]");
    armazenamento.semear("outro-app:token", "segredo");
    armazenamento.semear("theme", "dark");

    expect(limparDadosDoClareza()).toEqual({ sucesso: true });

    expect(armazenamento.getItem("clareza:simulacao:atual")).toBeNull();
    expect(armazenamento.getItem("clareza:feedback")).toBeNull();
    expect(armazenamento.getItem("outro-app:token")).toBe("segredo");
    expect(armazenamento.getItem("theme")).toBe("dark");

    desinstalar();
  });
});
