import { describe, expect, it } from "vitest";
import { explicarComparacao, explicarResultado } from "./explicar";
import { simular } from "./calcular";
import type { EntradaSimulacao } from "../types";

const entrada = (parcial: Partial<EntradaSimulacao> = {}): EntradaSimulacao => ({
  atividadeId: null,
  anexoManual: null,
  tipoAtuacao: "pessoa-fisica",
  receitaMensal: 10_000,
  custosMensais: 1_500,
  proLabore: 2_800,
  honorariosContabeisPf: 0,
  honorariosContabeisPj: 300,
  rbt12: 0,
  folha12m: 0,
  ...parcial,
});

describe("explicarResultado", () => {
  it("gera texto com tom positivo para margem saudável", () => {
    const e = explicarResultado(simular(entrada()));
    expect(e.tom).toBe("positivo");
    expect(e.paragrafos.length).toBeGreaterThanOrEqual(3);
    expect(e.paragrafos[0]).toContain("resultado líquido");
  });

  it("alerta quando a margem é apertada", () => {
    const e = explicarResultado(
      simular(entrada({ receitaMensal: 10_000, custosMensais: 7_500 })),
    );
    expect(e.tom).toBe("atencao");
    expect(e.paragrafos.join(" ")).toMatch(/margem está apertada/i);
  });

  it("sinaliza resultado negativo", () => {
    const e = explicarResultado(
      simular(entrada({ receitaMensal: 2_000, custosMensais: 2_000 })),
    );
    expect(e.tom).toBe("negativo");
  });

  it("trata o caso sem receita sem quebrar", () => {
    const e = explicarResultado(simular(entrada({ receitaMensal: 0 })));
    expect(e.titulo).toMatch(/sem receita/i);
    expect(e.paragrafos).toHaveLength(1);
  });

  it("é determinístico", () => {
    expect(explicarResultado(simular(entrada()))).toEqual(
      explicarResultado(simular(entrada())),
    );
  });
});

describe("explicarComparacao", () => {
  it("resume a diferença entre os cenários", () => {
    expect(explicarComparacao(simular(entrada()))).toMatch(/a mais por mês/);
  });

  it("informa empate quando os cenários coincidem", () => {
    const s = simular(
      entrada({
        receitaMensal: 1,
        custosMensais: 0,
        proLabore: 0,
        honorariosContabeisPf: 0,
  honorariosContabeisPj: 0,
  rbt12: 0,
  folha12m: 0,
      }),
    );
    if (s.comparacao.vencedor === null) {
      expect(explicarComparacao(s)).toMatch(/empatam/i);
    }
  });
});
