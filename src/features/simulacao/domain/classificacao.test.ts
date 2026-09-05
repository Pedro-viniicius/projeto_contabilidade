import { describe, expect, it } from "vitest";
import {
  classificar,
  explicarBloqueio,
  podeCompararCenarios,
  resumoBloqueio,
} from "./classificacao";
import type { ContextoClassificacao } from "./classificacao";
import { REGRAS } from "./calculation-rules";

const LIMITE = REGRAS.simplesNacional.fatorRLimite.valor;

const ctx = (
  parcial: Partial<ContextoClassificacao> = {},
): ContextoClassificacao => ({
  atividadeId: null,
  anexoManual: null,
  receitaMensal: 10_000,
  rbt12: 120_000,
  folha12m: 0,
  ...parcial,
});

describe("atividade com anexo determinístico", () => {
  it("contabilidade resolve no Anexo III sem consultar o Fator R", () => {
    const r = classificar(ctx({ atividadeId: "contabilidade" }));
    expect(r.anexo).toBe("III");
    expect(r.origem).toBe("unico");
    expect(r.sujeitaFatorR).toBe(false);
    expect(r.fatorR).toBeNull();
    expect(r.bloqueio).toBeNull();
  });

  it("academia resolve no Anexo III mesmo com folha zerada", () => {
    /* Folha zero levaria ao Anexo V se o Fator R fosse aplicado por
       engano a uma atividade que não está sujeita a ele. */
    const r = classificar(ctx({ atividadeId: "academia", folha12m: 0 }));
    expect(r.anexo).toBe("III");
    expect(r.origem).toBe("unico");
  });

  it("advocacia resolve no Anexo IV — e o cálculo fica bloqueado", () => {
    const r = classificar(ctx({ atividadeId: "advocacia" }));
    expect(r.anexo).toBe("IV");
    expect(r.sujeitaFatorR).toBe(false);
    /* A CPP fica fora do DAS e o motor não modela esse encargo. */
    expect(r.bloqueio).toBe("anexo-sem-calculo");
  });
});

describe("atividade sujeita ao Fator R", () => {
  it("apresenta os dois anexos possíveis", () => {
    const r = classificar(ctx({ atividadeId: "engenharia" }));
    expect(r.anexosPossiveis).toEqual(["III", "V"]);
    expect(r.sujeitaFatorR).toBe(true);
  });

  it("ABAIXO do limite vai para o Anexo V", () => {
    const r = classificar(
      ctx({
        atividadeId: "engenharia",
        rbt12: 100_000,
        folha12m: 100_000 * LIMITE - 1,
      }),
    );
    expect(r.anexo).toBe("V");
    expect(r.origem).toBe("fator-r");
    expect(r.fatorR?.atinge).toBe(false);
  });

  it("EXATAMENTE no limite já vai para o Anexo III", () => {
    /* A regra da LC 123 é de igualdade inclusiva. Errar este limite
       muda o anexo — e a alíquota inicial — de 15,5% para 6%. */
    const r = classificar(
      ctx({
        atividadeId: "engenharia",
        rbt12: 100_000,
        folha12m: 100_000 * LIMITE,
      }),
    );
    expect(r.anexo).toBe("III");
    expect(r.fatorR?.atinge).toBe(true);
  });

  it("ACIMA do limite vai para o Anexo III", () => {
    const r = classificar(
      ctx({
        atividadeId: "engenharia",
        rbt12: 100_000,
        folha12m: 100_000 * LIMITE + 1,
      }),
    );
    expect(r.anexo).toBe("III");
  });

  it("expõe os números que produziram a decisão", () => {
    const r = classificar(
      ctx({ atividadeId: "software-sob-encomenda", rbt12: 200_000, folha12m: 60_000 }),
    );
    expect(r.fatorR?.valor).toBeCloseTo(0.3, 6);
    expect(r.fatorR?.rbt12).toBe(200_000);
    expect(r.fatorR?.folha12m).toBe(60_000);
    expect(r.fatorR?.limite).toBe(LIMITE);
    expect(r.motivo).toContain("Fator R");
  });

  it("projeta a RBT12 a partir da receita quando ela não foi informada", () => {
    const r = classificar(
      ctx({ atividadeId: "engenharia", rbt12: 0, receitaMensal: 10_000 }),
    );
    expect(r.fatorR?.rbt12).toBe(120_000);
    /* A projeção é declarada para que a interface possa avisar. */
    expect(r.fatorR?.rbt12Projetada).toBe(true);
  });

  it("sem receita nenhuma, fica pendente em vez de escolher um anexo", () => {
    const r = classificar(
      ctx({ atividadeId: "engenharia", rbt12: 0, receitaMensal: 0 }),
    );
    expect(r.anexo).toBeNull();
    expect(r.origem).toBe("pendente");
    expect(r.bloqueio).toBe("classificacao-pendente");
  });
});

describe("atividade desconhecida", () => {
  it("NUNCA inventa anexo", () => {
    const r = classificar(ctx({ atividadeId: null }));
    expect(r.anexo).toBeNull();
    expect(r.anexosPossiveis).toEqual([]);
    expect(r.origem).toBe("pendente");
    expect(r.bloqueio).toBe("classificacao-pendente");
  });

  it("id fora do catálogo também fica pendente", () => {
    const r = classificar(ctx({ atividadeId: "atividade-que-nao-existe" }));
    expect(r.atividade).toBeNull();
    expect(r.anexo).toBeNull();
  });

  it("não infere nada a partir do texto do rótulo", () => {
    /* Um id que CONTÉM "engenharia" mas não está no catálogo não pode
       ser classificado por semelhança de string. */
    const r = classificar(ctx({ atividadeId: "engenharia-de-som-ao-vivo" }));
    expect(r.anexo).toBeNull();
    expect(r.origem).toBe("pendente");
  });
});

describe("classificação manual", () => {
  it("prevalece sobre a automática e se declara manual", () => {
    const r = classificar(
      ctx({
        atividadeId: "engenharia",
        rbt12: 100_000,
        folha12m: 50_000, // daria Anexo III no automático
        anexoManual: "V",
        motivoAnexoManual: "Folha do cliente deve cair no próximo trimestre.",
      }),
    );
    expect(r.anexo).toBe("V");
    expect(r.origem).toBe("manual");
    expect(r.manual).toBe(true);
    expect(r.motivoManual).toContain("trimestre");
    expect(r.motivo).toContain("manualmente");
  });

  it("funciona mesmo sem atividade no catálogo", () => {
    const r = classificar(ctx({ atividadeId: null, anexoManual: "III" }));
    expect(r.anexo).toBe("III");
    expect(r.manual).toBe(true);
    expect(r.bloqueio).toBeNull();
  });

  it("não escapa do bloqueio de anexo sem cálculo", () => {
    /* Escolher o Anexo IV à mão não faz o motor saber modelar a CPP. */
    const r = classificar(ctx({ anexoManual: "IV" }));
    expect(r.bloqueio).toBe("anexo-sem-calculo");
  });
});

describe("teto do Simples Nacional", () => {
  it("bloqueia o cálculo acima do teto", () => {
    const r = classificar(
      ctx({ atividadeId: "contabilidade", rbt12: 5_000_000 }),
    );
    expect(r.bloqueio).toBe("acima-do-teto");
  });

  it("exatamente no teto ainda calcula", () => {
    const r = classificar(
      ctx({ atividadeId: "contabilidade", rbt12: 4_800_000 }),
    );
    expect(r.bloqueio).toBeNull();
  });
});

describe("explicarBloqueio", () => {
  it("classificação pendente avisa que o número não é o Simples real", () => {
    /* O que precisa chegar ao contador não é a palavra "pendente" — é
       que o valor exibido não representa o Simples Nacional. */
    const texto = explicarBloqueio("classificacao-pendente", null);
    expect(texto).toMatch(/provisóri/i);
    expect(texto).toContain("não representa o Simples Nacional");
  });

  it("Anexo IV explica a contribuição patronal fora do DAS", () => {
    const texto = explicarBloqueio("anexo-sem-calculo", "IV");
    expect(texto).toContain("Anexo IV");
    expect(texto).toContain("FORA da guia única");
  });

  it("NÃO atribui a CPP fora do DAS a anexos onde ela está dentro", () => {
    /* No Anexo I a contribuição patronal está DENTRO da guia única: ele
       fica fora por escopo de produto, não por causa da CPP. Repetir o
       motivo do Anexo IV aqui seria afirmar algo falso. */
    for (const anexo of ["I", "II"] as const) {
      const texto = explicarBloqueio("anexo-sem-calculo", anexo);
      expect(texto).toContain(`Anexo ${anexo}`);
      expect(texto).not.toContain("guia única");
      expect(texto).toMatch(/escopo/i);
    }
  });

  it("acima do teto fala do teto", () => {
    expect(explicarBloqueio("acima-do-teto", "III")).toMatch(/teto/i);
  });
});

describe("resumoBloqueio", () => {
  it("cabe em uma linha para não competir com a ação principal", () => {
    for (const b of [
      "classificacao-pendente",
      "anexo-sem-calculo",
      "acima-do-teto",
    ] as const) {
      const resumo = resumoBloqueio(b);
      expect(resumo.length).toBeLessThan(90);
      expect(resumo.length).toBeLessThan(explicarBloqueio(b, "IV").length);
    }
  });
});

describe("determinismo", () => {
  it("mesma entrada, mesma classificação", () => {
    const entrada = ctx({ atividadeId: "arquitetura", folha12m: 30_000 });
    expect(classificar(entrada)).toEqual(classificar(entrada));
  });
});

describe("podeCompararCenarios", () => {
  it("compara quando o cenário CNPJ é calculável", () => {
    expect(podeCompararCenarios(classificar(ctx({ atividadeId: "contabilidade" })))).toBe(
      true,
    );
  });

  it("compara também com classificação pendente", () => {
    /* Ali existe uma alíquota de recurso DECLARADA, e o contador sabe
       o que está vendo: o comparativo segue sendo o de sempre. */
    const pendente = classificar(ctx({ atividadeId: null }));
    expect(pendente.bloqueio).toBe("classificacao-pendente");
    expect(podeCompararCenarios(pendente)).toBe(true);
  });

  it("NÃO compara quando falta um tributo inteiro no CNPJ", () => {
    /* Anunciar um vencedor a partir de um cenário incompleto
       contradiria, no mesmo painel, o aviso de que o número não vale. */
    const semCalculo = classificar(ctx({ anexoManual: "IV" }));
    expect(semCalculo.bloqueio).toBe("anexo-sem-calculo");
    expect(podeCompararCenarios(semCalculo)).toBe(false);
  });

  it("NÃO compara acima do teto do Simples", () => {
    const acimaDoTeto = classificar(
      ctx({ atividadeId: "contabilidade", rbt12: 100_000_000 }),
    );
    expect(acimaDoTeto.bloqueio).toBe("acima-do-teto");
    expect(podeCompararCenarios(acimaDoTeto)).toBe(false);
  });
});
