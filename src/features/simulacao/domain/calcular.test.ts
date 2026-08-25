import { describe, expect, it } from "vitest";
import {
  arredondar,
  calcularBaseLivroCaixa,
  calcularCenarioCnpj,
  calcularCenarioPessoaFisica,
  calcularInssAutonomo,
  calcularIrpfMensal,
  classificacaoDe,
  compararCenarios,
  simular,
} from "./calcular";
import {
  listarPremissas,
  REGRAS,
  VERSAO_REGRAS as REGRAS_VERSAO,
} from "./calculation-rules";
import type { EntradaSimulacao } from "../types";

/*
 * Fixture SEM atividade: é a entrada de uma análise anterior à
 * classificação. Preservá-la assim é o que faz esta suíte continuar
 * sendo teste de regressão — o cenário CNPJ segue no caminho da
 * alíquota de recurso, exatamente como antes.
 */
const base: EntradaSimulacao = {
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
};

const entrada = (parcial: Partial<EntradaSimulacao> = {}): EntradaSimulacao => ({
  ...base,
  ...parcial,
});

/** O cenário CNPJ recebe o enquadramento apurado para a mesma entrada. */
const cenarioCnpj = (e: EntradaSimulacao) =>
  calcularCenarioCnpj(e, classificacaoDe(e));

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
    const r = cenarioCnpj(entrada({ tipoAtuacao: "cnpj" }));
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
    const r = cenarioCnpj(
      entrada({ receitaMensal: 3_000, proLabore: 50_000 }),
    );
    const inss = r.encargos.find((e) => e.rotulo.includes("INSS"))!;
    expect(inss.valorMensal).toBe(
      arredondar(3_000 * REGRAS.cnpj.inssProLaboreAliquota.valor),
    );
  });

  it("não cobra IRRF quando o pró-labore está na faixa isenta", () => {
    const r = cenarioCnpj(entrada({ proLabore: 1_500 }));
    const irrf = r.encargos.find((e) => e.rotulo.includes("IRRF"))!;
    expect(irrf.valorMensal).toBe(0);
  });

  it("mantém o custo contábil mesmo sem receita", () => {
    const r = cenarioCnpj(
      entrada({ receitaMensal: 0, custosMensais: 0, proLabore: 0 }),
    );
    expect(r.encargosMensais).toBe(300);
    expect(r.liquidoMensal).toBe(-300);
  });

  it("ignora valores negativos de pró-labore e contabilidade", () => {
    const r = cenarioCnpj(
      entrada({ proLabore: -1_000, honorariosContabeisPj: -500 }),
    );
    expect(r.encargos[1].valorMensal).toBe(0);
    expect(r.encargos[2].valorMensal).toBe(0);
  });

  it("lida com decimais sem acumular erro de ponto flutuante", () => {
    const r = cenarioCnpj(
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
        honorariosContabeisPj: 0,
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

/*
 * HONORÁRIOS CONTÁBEIS INDEPENDENTES.
 *
 * Pedido literal da revisão contábil: PF e PJ têm custos contábeis
 * próprios, e amarrar um ao outro esconderia parte da comparação.
 */
describe("honorários contábeis por cenário", () => {
  it("cada cenário usa o SEU honorário, e só o seu", () => {
    const e = entrada({
      honorariosContabeisPf: 120,
      honorariosContabeisPj: 450,
    });
    const pf = calcularCenarioPessoaFisica(e);
    const pj = cenarioCnpj(e);

    const honorarioPf = pf.encargos.find((x) =>
      x.rotulo.includes("Autônomo/PF"),
    )!;
    const honorarioPj = pj.encargos.find((x) =>
      x.rotulo.includes("Empresa/PJ"),
    )!;
    expect(honorarioPf.valorMensal).toBe(120);
    expect(honorarioPj.valorMensal).toBe(450);
  });

  it("mexer no honorário da PF não move o cenário CNPJ", () => {
    const antes = cenarioCnpj(entrada({ honorariosContabeisPf: 0 }));
    const depois = cenarioCnpj(entrada({ honorariosContabeisPf: 900 }));
    expect(depois.liquidoMensal).toBe(antes.liquidoMensal);
  });

  it("mexer no honorário da PJ não move o cenário Pessoa Física", () => {
    const antes = calcularCenarioPessoaFisica(
      entrada({ honorariosContabeisPj: 300 }),
    );
    const depois = calcularCenarioPessoaFisica(
      entrada({ honorariosContabeisPj: 9_000 }),
    );
    expect(depois.liquidoMensal).toBe(antes.liquidoMensal);
  });

  it("o honorário da PF reduz o líquido do autônomo", () => {
    const sem = calcularCenarioPessoaFisica(
      entrada({ honorariosContabeisPf: 0 }),
    );
    const com = calcularCenarioPessoaFisica(
      entrada({ honorariosContabeisPf: 200 }),
    );
    expect(com.liquidoMensal).toBe(arredondar(sem.liquidoMensal - 200));
  });
});

/*
 * TRIBUTAÇÃO PELO ANEXO RESOLVIDO.
 *
 * O caminho novo: atividade → Fator R → anexo → alíquota efetiva.
 */
describe("cenário CNPJ com anexo resolvido", () => {
  const engenharia = (folha12m: number) =>
    entrada({
      atividadeId: "engenharia",
      tipoAtuacao: "cnpj",
      receitaMensal: 20_000,
      rbt12: 240_000,
      folha12m,
    });

  it("Fator R atingido tributa pelo Anexo III", () => {
    /* 240.000 × 28% = 67.200 de folha. */
    const r = cenarioCnpj(engenharia(67_200));
    const das = r.encargos[0];
    expect(das.rotulo).toContain("Anexo III");
    /* (240.000 × 11,2% − 9.360) ÷ 240.000 = 7,3% */
    expect(das.aliquota).toBeCloseTo(0.073, 6);
    expect(das.valorMensal).toBe(arredondar(20_000 * 0.073));
  });

  it("Fator R não atingido tributa pelo Anexo V", () => {
    const r = cenarioCnpj(engenharia(10_000));
    const das = r.encargos[0];
    expect(das.rotulo).toContain("Anexo V");
    /* (240.000 × 18% − 4.500) ÷ 240.000 = 16,125% */
    expect(das.aliquota).toBeCloseTo(0.16125, 6);
  });

  it("a alíquota do Anexo III é menor que a do Anexo V na mesma RBT12", () => {
    const comFolha = cenarioCnpj(engenharia(67_200));
    const semFolha = cenarioCnpj(engenharia(10_000));
    expect(comFolha.encargos[0].valorMensal).toBeLessThan(
      semFolha.encargos[0].valorMensal,
    );
  });

  it("aponta a premissa das tabelas, e não a alíquota de recurso", () => {
    const r = cenarioCnpj(engenharia(67_200));
    expect(r.encargos[0].premissa).toBe("Simples Nacional — tabelas por anexo");
  });
});

describe("cenário CNPJ sem classificação", () => {
  it("cai na alíquota de recurso e DIZ que não tem enquadramento", () => {
    const r = cenarioCnpj(entrada({ atividadeId: null }));
    const das = r.encargos[0];
    expect(das.rotulo).toContain("sem enquadramento");
    expect(das.aliquota).toBe(REGRAS.cnpj.aliquotaEfetivaFaturamento.valor);
    expect(das.explicacao).toContain("NÃO representa o Simples Nacional");
  });
});

describe("classificação dentro da simulação", () => {
  it("o anexo que aparece na auditoria é o que produziu o resultado", () => {
    const s = simular(
      entrada({
        atividadeId: "engenharia",
        rbt12: 240_000,
        folha12m: 67_200,
      }),
    );
    expect(s.classificacao.anexo).toBe("III");
    expect(s.comparacao.cnpj.encargos[0].rotulo).toContain("Anexo III");
  });

  it("atividade do Anexo IV vem classificada e bloqueada", () => {
    const s = simular(entrada({ atividadeId: "advocacia" }));
    expect(s.classificacao.anexo).toBe("IV");
    expect(s.classificacao.bloqueio).toBe("anexo-sem-calculo");
  });

  it("registra a versão vigente das regras", () => {
    expect(simular(entrada()).versaoRegras).toBe(REGRAS_VERSAO);
  });
});

describe("neutralidade da comparação", () => {
  it("a PF pode vencer", () => {
    /* Honorário alto na empresa e Fator R baixo pesam contra o CNPJ. */
    const c = compararCenarios(
      entrada({
        atividadeId: "engenharia",
        receitaMensal: 8_000,
        rbt12: 96_000,
        folha12m: 0,
        honorariosContabeisPf: 0,
        honorariosContabeisPj: 1_500,
      }),
    );
    expect(c.vencedor).toBe("pessoa-fisica");
  });

  it("o CNPJ pode vencer", () => {
    const c = compararCenarios(
      entrada({
        atividadeId: "engenharia",
        receitaMensal: 40_000,
        custosMensais: 0,
        proLabore: 2_000,
        rbt12: 480_000,
        folha12m: 480_000 * 0.28,
        honorariosContabeisPf: 0,
        honorariosContabeisPj: 300,
      }),
    );
    expect(c.vencedor).toBe("cnpj");
  });
});

/*
 * As linhas da auditoria encontram sua premissa?
 *
 * `Encargo.premissa` é uma chave de texto resolvida por busca na
 * lista de premissas. Renomear uma premissa sem atualizar o motor não
 * quebra nada em tempo de compilação: apenas some com o status de
 * validação da linha, em silêncio, justamente na tela que existe para
 * o contador auditar.
 */
describe("chaves de premissa dos encargos", () => {
  const chaves = new Set(listarPremissas().map((p) => p.chave));

  const cenarios = [
    entrada({ atividadeId: "engenharia", rbt12: 240_000, folha12m: 67_200 }),
    entrada({ atividadeId: "engenharia", rbt12: 240_000, folha12m: 0 }),
    entrada({ atividadeId: null }),
  ];

  it("toda premissa citada por um encargo existe na lista", () => {
    for (const e of cenarios) {
      const s = simular(e);
      for (const cenario of [s.comparacao.pessoaFisica, s.comparacao.cnpj]) {
        for (const encargo of cenario.encargos) {
          if (!encargo.premissa) continue;
          expect(chaves, `encargo "${encargo.rotulo}"`).toContain(
            encargo.premissa,
          );
        }
      }
    }
  });
});

/*
 * Quando o cenário CNPJ está incompleto, o motor ainda devolve
 * números — a Pessoa Física continua válida e a auditoria precisa dos
 * dois lados. Quem decide não ANUNCIAR vencedor é a interface, a
 * partir de `classificacao.bloqueio`. Este teste fixa o contrato que
 * ela consome.
 */
describe("bloqueio disponível para a interface", () => {
  it("Anexo IV expõe o bloqueio junto do resultado", () => {
    const s = simular(entrada({ atividadeId: "advocacia" }));
    expect(s.classificacao.bloqueio).toBe("anexo-sem-calculo");
    expect(s.classificacao.anexo).toBe("IV");
    /* Os números existem, mas vêm rotulados pelo anexo bloqueado. */
    expect(s.comparacao.cnpj.encargos[0].rotulo).toContain("Anexo IV");
  });

  it("acima do teto do Simples também expõe bloqueio", () => {
    const s = simular(
      entrada({ atividadeId: "contabilidade", rbt12: 5_000_000 }),
    );
    expect(s.classificacao.bloqueio).toBe("acima-do-teto");
  });

  it("análise saudável não tem bloqueio nenhum", () => {
    const s = simular(
      entrada({ atividadeId: "engenharia", rbt12: 240_000, folha12m: 67_200 }),
    );
    expect(s.classificacao.bloqueio).toBeNull();
  });
});

/*
 * A composição do DAS que veio da planilha do contador precisa
 * chegar à auditoria — senão o trabalho fica invisível para quem
 * confere o número.
 */
describe("composição do DAS na auditoria", () => {
  it("declara a repartição entre federal e ISS", () => {
    const s = simular(
      entrada({ atividadeId: "engenharia", rbt12: 240_000, folha12m: 67_200 }),
    );
    const das = s.comparacao.cnpj.encargos[0];
    expect(das.explicacao).toContain("tributos federais");
    expect(das.explicacao).toContain("ISS");
  });

  it("avisa quando o teto do ISS é acionado", () => {
    /* RBT12 alta o bastante para a parcela do ISS passar de 5 p.p. */
    const s = simular(
      entrada({
        atividadeId: "engenharia",
        receitaMensal: 250_000,
        rbt12: 3_000_000,
        folha12m: 3_000_000 * 0.28,
      }),
    );
    const das = s.comparacao.cnpj.encargos[0];
    expect(s.classificacao.anexo).toBe("III");
    expect(das.explicacao).toContain("travado no teto");
  });

  it("o teto não altera o valor do DAS, só a repartição", () => {
    const comTeto = simular(
      entrada({
        atividadeId: "engenharia",
        receitaMensal: 250_000,
        rbt12: 3_000_000,
        folha12m: 3_000_000 * 0.28,
      }),
    );
    const das = comTeto.comparacao.cnpj.encargos[0];
    /* O total continua sendo receita × alíquota efetiva. */
    expect(das.valorMensal).toBe(arredondar(250_000 * das.aliquota!));
  });
});
