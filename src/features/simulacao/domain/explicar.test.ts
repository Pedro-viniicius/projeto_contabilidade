import { describe, expect, it } from "vitest";
import {
  concluirComparacao,
  explicarComparacao,
  explicarDiferenca,
  explicarResultado,
} from "./explicar";
import { CATALOGO_ATIVIDADES } from "./catalogo-atividades";
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

const comFatorR = CATALOGO_ATIVIDADES.find((a) => a.simples.sujeitaFatorR)!.id;

const analise = (parcial: Partial<EntradaSimulacao> = {}) =>
  simular(
    entrada({
      atividadeId: comFatorR,
      receitaMensal: 50_000,
      custosMensais: 25_000,
      proLabore: 14_000,
      rbt12: 600_000,
      folha12m: 168_000,
      ...parcial,
    }),
  );

describe("concluirComparacao", () => {
  it("dá a conclusão em uma frase, condicionada às premissas", () => {
    const c = concluirComparacao(analise());
    expect(c.titulo).toMatch(/^Nas premissas atuais/);
    expect(c.titulo).toMatch(/Pessoa Física|CNPJ/);
    expect(c.titulo).toMatch(/estimad/);
  });

  it("nunca recomenda um enquadramento", () => {
    const c = concluirComparacao(analise());
    expect(c.titulo).not.toMatch(/deve|recomend|escolha|opte/i);
  });

  it("diz o sentido da diferença, sem depender de sinal", () => {
    const c = concluirComparacao(analise());
    expect(c.mensal).toMatch(/a mais por mês$/);
    expect(c.anual).toMatch(/a mais por ano$/);
    expect(c.mensal).not.toMatch(/^[+−-]/);
  });

  it("declara empate sem apontar vencedor", () => {
    /* Receita zerada zera os dois líquidos e empata a comparação. */
    const c = concluirComparacao(
      simular(entrada({ receitaMensal: 0, custosMensais: 0, proLabore: 0, honorariosContabeisPj: 0 })),
    );
    expect(c.vencedor).toBeNull();
    expect(c.titulo).toMatch(/mesmo resultado líquido/);
    expect(c.mensal).toBe("Sem diferença mensal");
  });
});

describe("explicarDiferenca", () => {
  it("aponta primeiro que a diferença vem inteiramente dos encargos", () => {
    const e = explicarDiferenca(analise());
    expect(e.motivos[0]).toMatch(/Receita e custos são os mesmos/);
    expect(e.motivos[0]).toMatch(/%/);
  });

  it("cita os maiores contribuintes, do maior para o menor", () => {
    const e = explicarDiferenca(analise());
    expect(e.contribuintes.length).toBeGreaterThan(0);
    const peso = (l: (typeof e.contribuintes)[number]) =>
      Math.abs((l.cnpj?.valorMensal ?? 0) - (l.pessoaFisica?.valorMensal ?? 0));
    for (let i = 1; i < e.contribuintes.length; i += 1) {
      expect(peso(e.contribuintes[i - 1])).toBeGreaterThanOrEqual(
        peso(e.contribuintes[i]),
      );
    }
  });

  it("diz 'não tem equivalente' em vez de fingir um zero", () => {
    const e = explicarDiferenca(analise());
    const dasCitado = e.motivos.some((m) => m.includes("Simples Nacional"));
    if (dasCitado) {
      expect(e.motivos.join(" ")).toMatch(/não tem equivalente/);
    }
  });

  it("é determinística", () => {
    expect(explicarDiferenca(analise()).motivos).toEqual(
      explicarDiferenca(analise()).motivos,
    );
  });
});
