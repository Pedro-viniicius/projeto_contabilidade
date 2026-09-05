import { describe, expect, it } from "vitest";
import { avisosDoCampo, conferirEntrada } from "./avisos-entrada";
import type { EntradaSimulacao } from "../types";

const entrada = (parcial: Partial<EntradaSimulacao> = {}): EntradaSimulacao => ({
  atividadeId: null,
  anexoManual: null,
  tipoAtuacao: "pessoa-fisica",
  receitaMensal: 50_000,
  custosMensais: 10_000,
  proLabore: 14_000,
  honorariosContabeisPf: 400,
  honorariosContabeisPj: 600,
  rbt12: 600_000,
  folha12m: 168_000,
  ...parcial,
});

const chaves = (e: EntradaSimulacao, sujeitaFatorR = false) =>
  conferirEntrada(e, { sujeitaFatorR }).map((a) => a.chave);

describe("conferência da entrada", () => {
  it("não aponta nada numa entrada coerente", () => {
    expect(chaves(entrada())).toEqual([]);
  });

  it("cala quando não há receita — o erro é do schema, não daqui", () => {
    expect(chaves(entrada({ receitaMensal: 0, custosMensais: 0 }))).toEqual([]);
  });

  it("pede confirmação de custo alto sem declará-lo errado", () => {
    const avisos = conferirEntrada(entrada({ custosMensais: 42_000 }), {
      sujeitaFatorR: false,
    });
    const custo = avisos.find((a) => a.chave === "custos-altos")!;
    expect(custo.nivel).toBe("atencao");
    expect(custo.campo).toBe("custosMensais");
    expect(custo.texto).toMatch(/84% da receita/);
    expect(custo.texto).toMatch(/Confirme/);
    /* Nunca afirma que o valor está incorreto. */
    expect(custo.texto).not.toMatch(/inválid|errad/i);
  });

  it("distingue RBT12 ausente, baixa e alta", () => {
    expect(chaves(entrada({ rbt12: 0 }))).toContain("rbt12-ausente");
    expect(chaves(entrada({ rbt12: 100_000 }))).toContain("rbt12-baixa");
    expect(chaves(entrada({ rbt12: 2_000_000 }))).toContain("rbt12-alta");
    /* Os três são exclusivos entre si. */
    const rbt = chaves(entrada({ rbt12: 100_000 })).filter((c) =>
      c.startsWith("rbt12-"),
    );
    expect(rbt).toHaveLength(1);
  });

  it("classifica a RBT12 ausente como informação, não como alerta", () => {
    const aviso = conferirEntrada(entrada({ rbt12: 0 }), {
      sujeitaFatorR: false,
    }).find((a) => a.chave === "rbt12-ausente")!;
    expect(aviso.nivel).toBe("informacao");
  });

  it("avisa sobre pró-labore zerado dizendo a consequência", () => {
    const aviso = conferirEntrada(entrada({ proLabore: 0 }), {
      sujeitaFatorR: false,
    }).find((a) => a.chave === "pro-labore-zero")!;
    expect(aviso.nivel).toBe("atencao");
    expect(aviso.texto).toMatch(/INSS/);
  });

  it("só cobra folha quando a atividade depende do Fator R", () => {
    expect(chaves(entrada({ folha12m: 0 }), false)).not.toContain(
      "folha-ausente",
    );
    expect(chaves(entrada({ folha12m: 0 }), true)).toContain("folha-ausente");
  });

  it("aponta folha menor que o pró-labore anual", () => {
    const c = chaves(entrada({ folha12m: 60_000, proLabore: 14_000 }), true);
    expect(c).toContain("folha-menor-que-pro-labore");
    /* Folha ausente e folha incoerente não se acumulam. */
    expect(c).not.toContain("folha-ausente");
  });

  it("informa o padrão zero dos honorários do autônomo", () => {
    const aviso = conferirEntrada(entrada({ honorariosContabeisPf: 0 }), {
      sujeitaFatorR: false,
    }).find((a) => a.chave === "honorarios-pf-zero")!;
    expect(aviso.nivel).toBe("informacao");
  });

  it("é determinística e estável na ordem", () => {
    const e = entrada({ custosMensais: 45_000, rbt12: 0, proLabore: 0 });
    expect(chaves(e)).toEqual(chaves(e));
    expect(chaves(e)).toEqual([
      "custos-altos",
      "rbt12-ausente",
      "pro-labore-zero",
    ]);
  });

  it("filtra por campo para exibição junto do input", () => {
    const avisos = conferirEntrada(entrada({ rbt12: 0, proLabore: 0 }), {
      sujeitaFatorR: false,
    });
    expect(avisosDoCampo(avisos, "rbt12").map((a) => a.chave)).toEqual([
      "rbt12-ausente",
    ]);
    expect(avisosDoCampo(avisos, "custosMensais")).toEqual([]);
  });
});
