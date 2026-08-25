import { describe, expect, it } from "vitest";
import {
  aliquotaEfetivaDaFaixa,
  apurarMes,
  calcularFatorR,
  calcularRbt12,
  comporDas,
  deslocarCompetencia,
  faixaDoRbt12,
  folhaAcumulada12,
  janela12Meses,
  receitaAcumulada12,
  type CompetenciaHistorico,
} from "./apuracao-simples";
import { REGRAS, type Anexo } from "./calculation-rules";

/*
 * PARIDADE COM A PLANILHA DO CONTADOR.
 *
 * A planilha "CÁLCULO DO SIMPLES NACIONAL" guardava resultados em
 * cache. Deduzindo a RBT12 a partir de um deles (Anexo II, faixa 3:
 * 10 − 100×13.860/RBT12 = 6,6697767971960396), chega-se a
 * R$ 416.188,32 — e todos os demais valores em cache fecham com essa
 * mesma RBT12.
 *
 * Estes testes comparam com IGUALDADE EXATA de ponto flutuante. Se a
 * tradução para frações introduzisse qualquer desvio, falhariam.
 */
const RBT12_PLANILHA = 416_188.32;

/** A planilha trabalha em pontos percentuais; o domínio, em frações. */
const emPontos = (fracao: number) => fracao * 100;

describe("paridade com a planilha — alíquotas efetivas em cache", () => {
  const casos: readonly [string, Anexo, number][] = [
    ["Anexo II  (célula I12)", "II", 6.6697767971960396],
    ["Anexo III (célula I13)", "III", 9.261534105522232],
    ["Anexo IV  (célula I16)", "IV", 7.2157740130717745],
    ["Anexo V   (célula N17)", "V", 17.121269140854313],
  ];

  it.each(casos)("%s reproduz o valor da planilha", (_nome, anexo, esperado) => {
    const faixa = faixaDoRbt12(RBT12_PLANILHA, anexo);
    const efetiva = aliquotaEfetivaDaFaixa(RBT12_PLANILHA, faixa);
    expect(emPontos(efetiva)).toBe(esperado);
  });

  it("a RBT12 da planilha cai na 3ª faixa em todos os anexos", () => {
    for (const anexo of ["I", "II", "III", "IV", "V"] as const) {
      expect(faixaDoRbt12(RBT12_PLANILHA, anexo).ate).toBe(720_000);
    }
  });
});

describe("aliquotaEfetivaDaFaixa", () => {
  it("equivale à forma algébrica da planilha: nominal − 100×parcela/RBT12", () => {
    const faixa = faixaDoRbt12(300_000, "III");
    const pelaPlanilha =
      emPontos(faixa.aliquota) - (100 * faixa.parcelaADeduzir) / 300_000;
    expect(emPontos(aliquotaEfetivaDaFaixa(300_000, faixa))).toBeCloseTo(
      pelaPlanilha,
      10,
    );
  });

  it("RBT12 zero não divide por zero", () => {
    const faixa = faixaDoRbt12(0, "V");
    const efetiva = aliquotaEfetivaDaFaixa(0, faixa);
    expect(Number.isFinite(efetiva)).toBe(true);
    expect(efetiva).toBe(0.155);
  });

  it("nunca ultrapassa a nominal nem fica negativa", () => {
    for (const anexo of ["III", "IV", "V"] as const) {
      for (const faixa of REGRAS.simplesNacional.tabelas.valor[anexo]) {
        const e = aliquotaEfetivaDaFaixa(faixa.ate, faixa);
        expect(e).toBeGreaterThanOrEqual(0);
        expect(e).toBeLessThanOrEqual(faixa.aliquota);
      }
    }
  });
});

/*
 * TETO DO ISS — colunas J, K e T da planilha.
 *
 * O limiar da planilha (14,92537 no III e V; 12,5 no IV) é
 * exatamente 5 ÷ parcela do ISS da faixa. Derivamos da repartição.
 */
describe("comporDas — teto do ISS", () => {
  it("o limiar da planilha é 5 ÷ parcela do ISS", () => {
    const f5 = REGRAS.simplesNacional.tabelas.valor.III[4];
    expect(5 / f5.reparticao.local).toBeCloseTo(14.92537, 4);
    const f4 = REGRAS.simplesNacional.tabelas.valor.IV[1];
    expect(5 / f4.reparticao.local).toBe(12.5);
  });

  it("abaixo do limiar reparte proporcionalmente, sem teto", () => {
    const faixa = REGRAS.simplesNacional.tabelas.valor.III[2];
    const c = comporDas(0.09261534105522232, faixa);
    expect(c.tetoLocalAplicado).toBe(false);
    expect(emPontos(c.local)).toBeCloseTo(
      9.261534105522232 * emPontos(faixa.reparticao.local) / 100,
      10,
    );
  });

  it("acima do limiar trava o ISS em 5 pontos", () => {
    const faixa = REGRAS.simplesNacional.tabelas.valor.III[4];
    const c = comporDas(0.1751, faixa);
    expect(c.tetoLocalAplicado).toBe(true);
    expect(emPontos(c.local)).toBeCloseTo(5, 10);
  });

  it("o teto REDISTRIBUI: o total do DAS não muda", () => {
    /* Planilha: T = J + K, e J foi definido como efetiva − K. */
    const faixa = REGRAS.simplesNacional.tabelas.valor.III[4];
    for (const efetiva of [0.1402, 0.1493, 0.1751]) {
      const c = comporDas(efetiva, faixa);
      expect(c.federal + c.local).toBeCloseTo(efetiva, 12);
    }
  });

  it("na 6ª faixa não há tributo local para travar", () => {
    const faixa = REGRAS.simplesNacional.tabelas.valor.III[5];
    const c = comporDas(0.28, faixa);
    expect(c.local).toBe(0);
    expect(c.federal).toBeCloseTo(0.28, 12);
    expect(c.tetoLocalAplicado).toBe(false);
  });
});

describe("calcularRbt12 — proporcionalização", () => {
  it("com 12 meses de atividade devolve a própria soma", () => {
    expect(calcularRbt12(480_000, 12)).toBe(480_000);
  });

  it("anualiza a média quando a empresa é nova", () => {
    /* 6 meses somando R$ 60.000 → média de R$ 10.000 → RBT12 R$ 120.000. */
    expect(calcularRbt12(60_000, 6)).toBe(120_000);
  });

  it("um único mês equivale à projeção antiga de receita × 12", () => {
    expect(calcularRbt12(10_000, 1)).toBe(120_000);
  });

  it("nunca divide por zero meses", () => {
    expect(Number.isFinite(calcularRbt12(50_000, 0))).toBe(true);
  });

  it("não aceita mais de 12 meses de proporcionalização", () => {
    expect(calcularRbt12(480_000, 24)).toBe(480_000);
  });
});

describe("calcularFatorR", () => {
  it("é folha ÷ RBT12", () => {
    expect(calcularFatorR(28_000, 100_000)).toBeCloseTo(0.28, 12);
  });

  it("sem RBT12 devolve null, e não zero", () => {
    expect(calcularFatorR(10_000, 0)).toBeNull();
  });
});

/*
 * JANELA DE 12 MESES — SUMIFS da planilha.
 */
describe("janela de 12 meses", () => {
  const historico: CompetenciaHistorico[] = [];
  for (let i = 1; i <= 15; i += 1) {
    historico.push({
      competencia: deslocarCompetencia("2025-01", i - 1),
      faturamento: 1_000 * i,
      folha: 100 * i,
    });
  }

  it("pega os 12 meses ANTERIORES, sem o mês apurado", () => {
    const janela = janela12Meses(historico, "2026-01");
    expect(janela).toHaveLength(12);
    expect(janela[0].competencia).toBe("2025-01");
    expect(janela.at(-1)?.competencia).toBe("2025-12");
    /* O mês que está sendo apurado ficou de fora. */
    expect(janela.some((m) => m.competencia === "2026-01")).toBe(false);
  });

  it("soma faturamento e folha da janela", () => {
    /* 1.000 + 2.000 + … + 12.000 = 78.000 */
    expect(receitaAcumulada12(historico, "2026-01")).toBe(78_000);
    expect(folhaAcumulada12(historico, "2026-01")).toBe(7_800);
  });

  it("empresa nova devolve menos de 12 competências", () => {
    expect(janela12Meses(historico, "2025-04")).toHaveLength(3);
  });
});

describe("deslocarCompetencia", () => {
  it("atravessa a virada de ano nos dois sentidos", () => {
    expect(deslocarCompetencia("2026-01", -1)).toBe("2025-12");
    expect(deslocarCompetencia("2026-01", -12)).toBe("2025-01");
    expect(deslocarCompetencia("2025-12", 1)).toBe("2026-01");
  });
});

describe("apurarMes", () => {
  it("reproduz a apuração da planilha no Anexo III", () => {
    const r = apurarMes({
      anexo: "III",
      faturamentoDoMes: 30_000,
      receitaAcumulada12: RBT12_PLANILHA,
      folhaAcumulada12: 120_000,
    });
    expect(emPontos(r.aliquotaEfetiva)).toBe(9.261534105522232);
    expect(r.das).toBe(2_778.46);
    expect(r.fatorR).toBeCloseTo(120_000 / RBT12_PLANILHA, 12);
    expect(r.composicao.tetoLocalAplicado).toBe(false);
  });

  it("marca quando a RBT12 foi proporcionalizada", () => {
    const r = apurarMes({
      anexo: "III",
      faturamentoDoMes: 10_000,
      receitaAcumulada12: 30_000,
      folhaAcumulada12: 0,
      mesesAtividade: 3,
    });
    expect(r.rbt12).toBe(120_000);
    expect(r.rbt12Proporcionalizada).toBe(true);
  });

  it("é determinística", () => {
    const e = {
      anexo: "V" as const,
      faturamentoDoMes: 20_000,
      receitaAcumulada12: 240_000,
      folhaAcumulada12: 30_000,
    };
    expect(apurarMes(e)).toEqual(apurarMes(e));
  });
});
