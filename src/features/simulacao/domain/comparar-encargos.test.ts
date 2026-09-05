import { describe, expect, it } from "vitest";
import { compararEncargos, maioresContribuintes } from "./comparar-encargos";
import { simular } from "./calcular";
import { CATALOGO_ATIVIDADES } from "./catalogo-atividades";
import type { EntradaSimulacao } from "../types";

const entrada = (parcial: Partial<EntradaSimulacao> = {}): EntradaSimulacao => ({
  atividadeId: null,
  anexoManual: null,
  tipoAtuacao: "pessoa-fisica",
  receitaMensal: 50_000,
  custosMensais: 25_000,
  proLabore: 14_000,
  honorariosContabeisPf: 0,
  honorariosContabeisPj: 600,
  rbt12: 600_000,
  folha12m: 168_000,
  ...parcial,
});

const comFatorR = CATALOGO_ATIVIDADES.find((a) => a.simples.sujeitaFatorR)!.id;

describe("composição comparada", () => {
  it("casa os dois cenários pela categoria, não pelo rótulo", () => {
    const { linhas } = compararEncargos(
      simular(entrada({ atividadeId: comFatorR })).comparacao,
    );
    const inss = linhas.find((l) => l.categoria === "inss")!;

    /* Rótulos diferentes nos dois lados; mesma linha da tabela. */
    expect(inss.pessoaFisica!.encargos[0].rotulo).toMatch(/contribuinte/i);
    expect(inss.cnpj!.encargos[0].rotulo).toMatch(/pró-labore/i);
    expect(inss.apenasEm).toBeNull();
  });

  it("marca a categoria que só existe em um cenário", () => {
    const { linhas } = compararEncargos(
      simular(entrada({ atividadeId: comFatorR })).comparacao,
    );
    const das = linhas.find((l) => l.categoria === "das")!;

    expect(das.apenasEm).toBe("cnpj");
    expect(das.pessoaFisica).toBeNull();
    expect(das.cnpj!.valorMensal).toBeGreaterThan(0);
  });

  it("não inventa linha para categoria ausente dos dois lados", () => {
    const { linhas } = compararEncargos(simular(entrada()).comparacao);
    for (const linha of linhas) {
      expect(linha.pessoaFisica ?? linha.cnpj).not.toBeNull();
    }
  });

  it("soma exatamente o total de encargos de cada cenário", () => {
    const s = simular(entrada({ atividadeId: comFatorR }));
    const { linhas, total } = compararEncargos(s.comparacao);

    const somaPf = linhas.reduce(
      (t, l) => t + (l.pessoaFisica?.valorMensal ?? 0),
      0,
    );
    const somaCnpj = linhas.reduce((t, l) => t + (l.cnpj?.valorMensal ?? 0), 0);

    expect(somaPf).toBeCloseTo(s.comparacao.pessoaFisica.encargosMensais, 2);
    expect(somaCnpj).toBeCloseTo(s.comparacao.cnpj.encargosMensais, 2);
    expect(total.pessoaFisica).toBe(s.comparacao.pessoaFisica.encargosMensais);
    expect(total.cnpj).toBe(s.comparacao.cnpj.encargosMensais);
  });

  it("trata encargo como custo: quem paga mais perde a vantagem", () => {
    const { total } = compararEncargos(
      simular(entrada({ atividadeId: comFatorR })).comparacao,
    );
    if (total.diferenca.empate) return;
    expect(total.diferenca.vantagemPara).not.toBe(total.diferenca.cenarioMaior);
  });

  it("preserva a ordem de leitura das categorias", () => {
    const { linhas } = compararEncargos(
      simular(entrada({ atividadeId: comFatorR })).comparacao,
    );
    const ordem = linhas.map((l) => l.categoria);
    expect(ordem).toEqual(
      ["inss", "irpf", "das", "honorarios"].filter((c) => ordem.includes(c as never)),
    );
  });
});

describe("maiores contribuintes da diferença", () => {
  it("ordena pelo peso absoluto e descarta empates", () => {
    const composicao = compararEncargos(
      simular(entrada({ atividadeId: comFatorR })).comparacao,
    );
    const maiores = maioresContribuintes(composicao, 3);

    const peso = (l: (typeof maiores)[number]) =>
      Math.abs((l.cnpj?.valorMensal ?? 0) - (l.pessoaFisica?.valorMensal ?? 0));

    for (let i = 1; i < maiores.length; i += 1) {
      expect(peso(maiores[i - 1])).toBeGreaterThanOrEqual(peso(maiores[i]));
    }
    for (const linha of maiores) expect(linha.diferenca.empate).toBe(false);
  });

  it("respeita o limite pedido", () => {
    const composicao = compararEncargos(
      simular(entrada({ atividadeId: comFatorR })).comparacao,
    );
    expect(maioresContribuintes(composicao, 1)).toHaveLength(1);
  });
});
