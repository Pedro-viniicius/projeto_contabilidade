import { describe, expect, it } from "vitest";
import {
  centavosParaTexto,
  formatarMoeda,
  formatarPercentual,
  textoParaCentavos,
} from "./format";

describe("formatarMoeda", () => {
  it("formata em reais no padrão pt-BR", () => {
    expect(formatarMoeda(1234.5)).toContain("1.234,50");
    expect(formatarMoeda(0)).toContain("0,00");
  });

  it("mantém o sinal em valores negativos", () => {
    expect(formatarMoeda(-500)).toContain("500,00");
    expect(formatarMoeda(-500)).toMatch(/-/);
  });

  it("não quebra com valores inválidos", () => {
    expect(formatarMoeda(Number.NaN)).toContain("0,00");
    expect(formatarMoeda(Number.POSITIVE_INFINITY)).toContain("0,00");
  });
});

describe("formatarPercentual", () => {
  it("converte fração para percentual", () => {
    expect(formatarPercentual(0.155)).toBe("15,5%");
    expect(formatarPercentual(0.155, 0)).toBe("16%");
  });

  it("trata valores inválidos como zero", () => {
    expect(formatarPercentual(Number.NaN)).toBe("0,0%");
  });
});

describe("máscara de moeda", () => {
  it("interpreta os dígitos digitados como centavos", () => {
    expect(textoParaCentavos("1")).toBe(0.01);
    expect(textoParaCentavos("123")).toBe(1.23);
    expect(textoParaCentavos("1000000")).toBe(10_000);
  });

  it("ignora qualquer caractere que não seja dígito", () => {
    expect(textoParaCentavos("R$ 1.234,56")).toBe(1234.56);
    expect(textoParaCentavos("abc")).toBe(0);
    expect(textoParaCentavos("")).toBe(0);
  });

  it("limita o tamanho para evitar números absurdos", () => {
    expect(Number.isFinite(textoParaCentavos("9".repeat(40)))).toBe(true);
  });

  it("faz ida e volta consistente com a exibição", () => {
    const valor = 8_432.17;
    expect(textoParaCentavos(centavosParaTexto(valor))).toBe(valor);
  });

  it("mostra campo vazio quando o valor é zero", () => {
    expect(centavosParaTexto(0)).toBe("");
  });
});
