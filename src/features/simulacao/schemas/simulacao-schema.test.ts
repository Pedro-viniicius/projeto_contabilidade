import { describe, expect, it } from "vitest";
import {
  proLaboreSugerido,
  simulacaoSchema,
  valoresPadrao,
  RECEITA_MAXIMA,
} from "./simulacao-schema";
import { REGRAS } from "../domain/calculation-rules";

const valida = {
  tipoAtuacao: "pessoa-fisica" as const,
  receitaMensal: 10_000,
  custosMensais: 1_500,
  proLabore: 2_800,
  custoContabilidade: 300,
};

function erroDe(dados: unknown, campo: string) {
  const r = simulacaoSchema.safeParse(dados);
  if (r.success) return null;
  return r.error.issues.find((i) => i.path[0] === campo)?.message ?? null;
}

describe("simulacaoSchema", () => {
  it("aceita uma entrada completa e coerente", () => {
    expect(simulacaoSchema.safeParse(valida).success).toBe(true);
  });

  it("exige receita maior que zero", () => {
    expect(erroDe({ ...valida, receitaMensal: 0 }, "receitaMensal")).toMatch(
      /maior que zero/i,
    );
  });

  it("rejeita valores negativos", () => {
    expect(erroDe({ ...valida, custosMensais: -1 }, "custosMensais")).toMatch(
      /negativo/i,
    );
  });

  it("rejeita valores acima do limite da simulação", () => {
    expect(
      erroDe({ ...valida, receitaMensal: RECEITA_MAXIMA + 1 }, "receitaMensal"),
    ).toMatch(/limite/i);
  });

  it("rejeita entradas que não são número", () => {
    expect(simulacaoSchema.safeParse({ ...valida, receitaMensal: "10000" }).success)
      .toBe(false);
    expect(simulacaoSchema.safeParse({ ...valida, receitaMensal: Number.NaN }).success)
      .toBe(false);
  });

  it("rejeita tipo de atuação desconhecido", () => {
    expect(
      simulacaoSchema.safeParse({ ...valida, tipoAtuacao: "mei" }).success,
    ).toBe(false);
  });

  it("impede custos maiores que a receita", () => {
    expect(
      erroDe({ ...valida, custosMensais: 20_000 }, "custosMensais"),
    ).toMatch(/maiores que a receita/i);
  });

  it("impede pró-labore maior que a receita no cenário CNPJ", () => {
    expect(
      erroDe(
        { ...valida, tipoAtuacao: "cnpj", proLabore: 50_000 },
        "proLabore",
      ),
    ).toMatch(/não pode ser maior/i);
  });

  it("aceita decimais em centavos", () => {
    expect(
      simulacaoSchema.safeParse({ ...valida, receitaMensal: 8_432.17 }).success,
    ).toBe(true);
  });
});

describe("valoresPadrao", () => {
  it("parte do custo contábil definido nas premissas", () => {
    expect(valoresPadrao().custoContabilidade).toBe(
      REGRAS.cnpj.custoContabilidadeMensal.valor,
    );
  });
});

describe("proLaboreSugerido", () => {
  it("usa o percentual configurado nas premissas", () => {
    expect(proLaboreSugerido(10_000)).toBeCloseTo(
      10_000 * REGRAS.cnpj.proLaborePercentualSugerido.valor,
      2,
    );
  });

  it("arredonda para centavos, sem resíduo de ponto flutuante", () => {
    /* 10.000 × 0,28 dá 2800.0000000000005 em ponto flutuante binário. */
    expect(proLaboreSugerido(10_000)).toBe(2_800);
  });

  it("devolve zero quando não há receita", () => {
    expect(proLaboreSugerido(0)).toBe(0);
  });
});
