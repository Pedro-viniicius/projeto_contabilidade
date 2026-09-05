import { describe, expect, it } from "vitest";
import { formatarMoeda } from "@/lib/format";
import {
  diferencaMoeda,
  diferencaPontos,
  semComparacao,
} from "./diferenca-semantica";

/* Encargo: o valor MAIOR é o pior. */
const custo = { maiorEhMelhor: false } as const;
/* Resultado líquido: o valor MAIOR é o melhor. */
const ganho = { maiorEhMelhor: true } as const;

describe("diferença monetária", () => {
  it("nomeia o cenário de maior valor, sem depender de sinal", () => {
    const d = diferencaMoeda(1_000, 3_001.97, custo);
    expect(d.texto).toBe(`CNPJ: ${formatarMoeda(2_001.97)} a mais`);
    expect(d.cenarioMaior).toBe("cnpj");
  });

  it("inverte a vantagem quando o maior valor é custo", () => {
    /* O CNPJ paga mais encargo, logo quem leva vantagem é a PF. */
    const d = diferencaMoeda(1_000, 3_000, custo);
    expect(d.cenarioMaior).toBe("cnpj");
    expect(d.vantagemPara).toBe("pessoa-fisica");
  });

  it("mantém a vantagem com quem tem o maior líquido", () => {
    const d = diferencaMoeda(3_000, 1_000, ganho);
    expect(d.cenarioMaior).toBe("pessoa-fisica");
    expect(d.vantagemPara).toBe("pessoa-fisica");
  });

  it("trata resíduo de ponto flutuante como empate", () => {
    const d = diferencaMoeda(1_000, 1_000.001, custo);
    expect(d.empate).toBe(true);
    expect(d.vantagemPara).toBeNull();
    expect(d.texto).toBe("Sem diferença");
  });

  it("aceita sufixo sem que a interface concatene texto na célula", () => {
    const d = diferencaMoeda(0, 1_200, ganho, " por ano");
    expect(d.texto).toBe(`CNPJ: ${formatarMoeda(1_200)} a mais por ano`);
    expect(diferencaMoeda(1, 1, ganho, " por ano").texto).toBe(
      "Sem diferença por ano",
    );
  });

  it("nunca usa apenas o sinal para comunicar o sentido", () => {
    for (const d of [
      diferencaMoeda(10, 20, custo),
      diferencaMoeda(20, 10, custo),
    ]) {
      expect(d.texto).not.toMatch(/^[+−-]/);
      expect(d.texto).toMatch(/Pessoa Física|CNPJ/);
    }
  });
});

describe("diferença em pontos percentuais", () => {
  it("usa p.p. e não percentual", () => {
    const d = diferencaPontos(0.144, 0.184, custo);
    expect(d.texto).toBe("CNPJ: 4,0 p.p. maior");
  });

  it("empata abaixo de meio décimo de ponto", () => {
    expect(diferencaPontos(0.1, 0.1004, custo).empate).toBe(true);
  });

  it("atribui a vantagem ao lado de menor carga", () => {
    expect(diferencaPontos(0.144, 0.184, custo).vantagemPara).toBe(
      "pessoa-fisica",
    );
  });
});

describe("linhas sem comparação", () => {
  it("diz que o valor é igual, em vez de exibir zero", () => {
    const d = semComparacao();
    expect(d.texto).toBe("Igual nos dois cenários");
    expect(d.empate).toBe(true);
    expect(d.cenarioMaior).toBeNull();
  });
});
