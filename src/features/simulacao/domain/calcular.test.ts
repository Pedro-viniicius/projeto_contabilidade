import { describe, expect, it } from "vitest";
import {
  arredondar,
  calcularBaseLivroCaixa,
  calcularCenarioCnpj,
  calcularCenarioPessoaFisica,
  calcularInssAutonomo,
  calcularIrpfMensal,
  compararCenarios,
  simular,
} from "./calcular";
import { REGRAS } from "./calculation-rules";
import type { EntradaSimulacao } from "../types";

const base: EntradaSimulacao = {
  tipoAtuacao: "pessoa-fisica",
  receitaMensal: 10_000,
  custosMensais: 1_500,
  proLabore: 2_800,
  custoContabilidade: 300,
};

const entrada = (parcial: Partial<EntradaSimulacao> = {}): EntradaSimulacao => ({
  ...base,
  ...parcial,
});

describe("arredondar", () => {
  it("corrige erro de ponto flutuante binário", () => {
    expect(arredondar(0.1 + 0.2)).toBe(0.3);
    expect(arredondar(1.005)).toBe(1.01);
  });

  it("mantém no máximo duas casas decimais", () => {
    expect(arredondar(1234.5678)).toBe(1234.57);
  });
});

describe("calcularIrpfMensal", () => {
  it("não cobra imposto na faixa de isenção", () => {
    expect(calcularIrpfMensal(2_000)).toBe(0);
  });

  it("aplica a faixa correta com a parcela a deduzir", () => {
    /* 3.000 × 15% − 381,44 = 68,56 */
    expect(calcularIrpfMensal(3_000)).toBe(68.56);
  });

  it("aplica a última faixa para valores altos", () => {
    /* 20.000 × 27,5% − 896 = 4.604 */
    expect(calcularIrpfMensal(20_000)).toBe(4_604);
  });

  it("nunca devolve imposto negativo", () => {
    expect(calcularIrpfMensal(-5_000)).toBe(0);
    expect(calcularIrpfMensal(0)).toBe(0);
  });

  it("é monotônico: base maior nunca paga menos imposto", () => {
    let anterior = 0;
    for (let b = 0; b <= 30_000; b += 250) {
      const atual = calcularIrpfMensal(b);
      expect(atual).toBeGreaterThanOrEqual(anterior);
      anterior = atual;
    }
  });

  it("lida com decimais na base", () => {
    expect(calcularIrpfMensal(3_000.49)).toBeCloseTo(68.63, 2);
  });
});

describe("calcularInssAutonomo", () => {
  const { inssAliquota, inssPiso, inssTeto } = REGRAS.pessoaFisica;

  it("não cobra INSS quando não há base", () => {
    expect(calcularInssAutonomo(0)).toBe(0);
    expect(calcularInssAutonomo(-1_000)).toBe(0);
  });

  it("usa o piso quando a base é menor que o salário mínimo", () => {
    expect(calcularInssAutonomo(500)).toBe(
      arredondar(inssPiso.valor * inssAliquota.valor),
    );
  });

  it("aplica a alíquota sobre a base dentro do intervalo", () => {
    expect(calcularInssAutonomo(5_000)).toBe(1_000);
  });

  it("limita a contribuição ao teto", () => {
    const noTeto = arredondar(inssTeto.valor * inssAliquota.valor);
    expect(calcularInssAutonomo(inssTeto.valor)).toBe(noTeto);
    expect(calcularInssAutonomo(500_000)).toBe(noTeto);
  });

  it("é sempre finito para entradas inválidas", () => {
    expect(calcularInssAutonomo(Number.NaN)).toBe(0);
    expect(calcularInssAutonomo(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("calcularBaseLivroCaixa", () => {
  it("subtrai os custos da receita", () => {
    expect(calcularBaseLivroCaixa(10_000, 2_500)).toBe(7_500);
  });

  it("pode ficar negativa quando os custos superam a receita", () => {
    expect(calcularBaseLivroCaixa(3_000, 5_000)).toBe(-2_000);
  });

  it("ignora valores negativos de entrada", () => {
    expect(calcularBaseLivroCaixa(-100, -100)).toBe(0);
  });
});

describe("calcularCenarioPessoaFisica", () => {
  it("encadeia base, INSS e IRPF corretamente", () => {
    const r = calcularCenarioPessoaFisica(entrada());
    /* base 8.500 → INSS 1.631,48 (teto) → base IR 6.868,52 → IRPF 992,84 */
    expect(r.receitaMensal).toBe(10_000);
    expect(r.custosMensais).toBe(1_500);
    expect(r.encargosMensais).toBe(
      arredondar(r.encargos.reduce((s, e) => s + e.valorMensal, 0)),
    );
    expect(r.liquidoMensal).toBe(
      arredondar(10_000 - 1_500 - r.encargosMensais),
    );
    expect(r.liquidoAnual).toBe(arredondar(r.liquidoMensal * 12));
  });

  it("zera tudo quando não há receita", () => {
    const r = calcularCenarioPessoaFisica(
      entrada({ receitaMensal: 0, custosMensais: 0 }),
    );
    expect(r.encargosMensais).toBe(0);
    expect(r.liquidoMensal).toBe(0);
    expect(r.margemLiquida).toBe(0);
    expect(r.cargaSobreReceita).toBe(0);
  });

  it("trata custos maiores que a receita sem gerar encargos", () => {
    const r = calcularCenarioPessoaFisica(
      entrada({ receitaMensal: 2_000, custosMensais: 5_000 }),
    );
    expect(r.encargosMensais).toBe(0);
    expect(r.liquidoMensal).toBe(-3_000);
    expect(r.margemLiquida).toBeLessThan(0);
  });

  it("ignora entradas negativas em vez de propagar números absurdos", () => {
    const r = calcularCenarioPessoaFisica(
      entrada({ receitaMensal: -5_000, custosMensais: -1_000 }),
    );
    expect(r.receitaMensal).toBe(0);
    expect(r.liquidoMensal).toBe(0);
  });

  it("mantém o resultado finito para receitas muito altas", () => {
    const r = calcularCenarioPessoaFisica(
      entrada({ receitaMensal: 5_000_000, custosMensais: 0 }),
    );
    expect(Number.isFinite(r.liquidoMensal)).toBe(true);
    expect(r.liquidoMensal).toBeGreaterThan(0);
    /* Acima do teto, o INSS para de crescer: a margem tende a subir. */
    expect(r.margemLiquida).toBeGreaterThan(0.7);
  });

  it("expõe o passo a passo do cálculo", () => {
    const r = calcularCenarioPessoaFisica(entrada());
    expect(r.passos.length).toBeGreaterThanOrEqual(4);
    expect(r.passos.at(-1)?.valor).toBe(r.liquidoMensal);
  });

  it("é determinístico", () => {
    const a = calcularCenarioPessoaFisica(entrada());
    const b = calcularCenarioPessoaFisica(entrada());
    expect(a).toEqual(b);
  });
});

describe("calcularCenarioCnpj", () => {
  it("soma tributos, contabilidade e encargos do pró-labore", () => {
    const r = calcularCenarioCnpj(entrada({ tipoAtuacao: "cnpj" }));
    const imposto = arredondar(
      10_000 * REGRAS.cnpj.aliquotaEfetivaFaturamento.valor,
    );
    const inss = arredondar(
      2_800 * REGRAS.cnpj.inssProLaboreAliquota.valor,
    );
    expect(r.encargos[0].valorMensal).toBe(imposto);
    expect(r.encargos[1].valorMensal).toBe(300);
    expect(r.encargos[2].valorMensal).toBe(inss);
    expect(r.liquidoMensal).toBe(
      arredondar(10_000 - 1_500 - r.encargosMensais),
    );
  });

  it("limita o pró-labore à receita informada", () => {
    const r = calcularCenarioCnpj(
      entrada({ receitaMensal: 3_000, proLabore: 50_000 }),
    );
    const inss = r.encargos.find((e) => e.rotulo.includes("INSS"))!;
    expect(inss.valorMensal).toBe(
      arredondar(3_000 * REGRAS.cnpj.inssProLaboreAliquota.valor),
    );
  });

  it("não cobra IRRF quando o pró-labore está na faixa isenta", () => {
    const r = calcularCenarioCnpj(entrada({ proLabore: 1_500 }));
    const irrf = r.encargos.find((e) => e.rotulo.includes("IRRF"))!;
    expect(irrf.valorMensal).toBe(0);
  });

  it("mantém o custo contábil mesmo sem receita", () => {
    const r = calcularCenarioCnpj(
      entrada({ receitaMensal: 0, custosMensais: 0, proLabore: 0 }),
    );
    expect(r.encargosMensais).toBe(300);
    expect(r.liquidoMensal).toBe(-300);
  });

  it("ignora valores negativos de pró-labore e contabilidade", () => {
    const r = calcularCenarioCnpj(
      entrada({ proLabore: -1_000, custoContabilidade: -500 }),
    );
    expect(r.encargos[1].valorMensal).toBe(0);
    expect(r.encargos[2].valorMensal).toBe(0);
  });

  it("lida com decimais sem acumular erro de ponto flutuante", () => {
    const r = calcularCenarioCnpj(
      entrada({ receitaMensal: 7_333.33, custosMensais: 1_111.11 }),
    );
    expect(r.liquidoMensal).toBe(
      arredondar(7_333.33 - 1_111.11 - r.encargosMensais),
    );
  });
});

describe("compararCenarios", () => {
  it("aponta o cenário com maior líquido mensal", () => {
    const c = compararCenarios(entrada());
    const esperado =
      c.cnpj.liquidoMensal > c.pessoaFisica.liquidoMensal
        ? "cnpj"
        : "pessoa-fisica";
    expect(c.vencedor).toBe(esperado);
  });

  it("calcula a diferença como valor absoluto", () => {
    const c = compararCenarios(entrada());
    expect(c.diferencaMensal).toBe(
      arredondar(Math.abs(c.cnpj.liquidoMensal - c.pessoaFisica.liquidoMensal)),
    );
    expect(c.diferencaMensal).toBeGreaterThanOrEqual(0);
    expect(c.diferencaAnual).toBe(arredondar(c.diferencaMensal * 12));
  });

  it("indica empate quando os líquidos coincidem", () => {
    /* Sem receita, PF zera e CNPJ paga só a contabilidade. */
    const c = compararCenarios(
      entrada({
        receitaMensal: 0,
        custosMensais: 0,
        proLabore: 0,
        custoContabilidade: 0,
      }),
    );
    expect(c.pessoaFisica.liquidoMensal).toBe(0);
    expect(c.cnpj.liquidoMensal).toBe(0);
    expect(c.vencedor).toBeNull();
    expect(c.diferencaMensal).toBe(0);
  });

  it("usa a mesma receita e os mesmos custos nos dois cenários", () => {
    const c = compararCenarios(entrada());
    expect(c.cnpj.receitaMensal).toBe(c.pessoaFisica.receitaMensal);
    expect(c.cnpj.custosMensais).toBe(c.pessoaFisica.custosMensais);
  });

  it("favorece o CNPJ conforme a receita cresce", () => {
    /* Em receitas altas, a alíquota fixa do MVP vence a tabela progressiva. */
    const alta = compararCenarios(
      entrada({ receitaMensal: 30_000, custosMensais: 0, proLabore: 8_400 }),
    );
    expect(alta.vencedor).toBe("cnpj");
  });
});

describe("simular", () => {
  it("destaca o cenário escolhido pelo usuário", () => {
    const pf = simular(entrada({ tipoAtuacao: "pessoa-fisica" }));
    expect(pf.principal.tipo).toBe("pessoa-fisica");

    const pj = simular(entrada({ tipoAtuacao: "cnpj" }));
    expect(pj.principal.tipo).toBe("cnpj");
  });

  it("carimba a versão das regras usadas", () => {
    expect(simular(entrada()).versaoRegras).toMatch(/^v\d/);
  });

  it("devolve os dois cenários mesmo com um só em destaque", () => {
    const s = simular(entrada());
    expect(s.comparacao.pessoaFisica).toBeDefined();
    expect(s.comparacao.cnpj).toBeDefined();
  });
});
