import { describe, expect, it } from "vitest";
import {
  mesmaEntrada,
  proLaboreSugerido,
  simulacaoSalvaSchema,
  simulacaoSchema,
  valoresPadrao,
  RECEITA_MAXIMA,
} from "./simulacao-schema";
import { REGRAS } from "../domain/calculation-rules";

const valida = {
  atividadeId: null,
  anexoManual: null,
  tipoAtuacao: "pessoa-fisica" as const,
  receitaMensal: 10_000,
  custosMensais: 1_500,
  proLabore: 2_800,
  honorariosContabeisPf: 0,
  honorariosContabeisPj: 300,
  rbt12: 0,
  folha12m: 0,
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
  it("parte dos honorários definidos em premissas SEPARADAS por cenário", () => {
    expect(valoresPadrao().honorariosContabeisPj).toBe(
      REGRAS.cnpj.custoContabilidadeMensal.valor,
    );
    expect(valoresPadrao().honorariosContabeisPf).toBe(
      REGRAS.pessoaFisica.custoContabilidadeMensal.valor,
    );
  });

  /*
   * O custo contábil da PF era ZERO até a v2.7, porque nenhuma
   * referência profissional tinha sido recebida — e inventar um número
   * ali inclinaria a comparação em silêncio.
   *
   * A validação de setembro/2026 respondeu (R$ 150,00), então o teste
   * deixou de guardar "é zero" e passou a guardar o que continua sendo
   * verdade: os dois honorários vêm de premissas SEPARADAS, nenhum
   * deles é zero — uma PF sem custo contábil nenhum favoreceria a
   * Pessoa Física por construção — e um não pode ser derivado do outro.
   */
  it("não deixa nenhum dos cenários entrar sem custo contábil", () => {
    expect(valoresPadrao().honorariosContabeisPf).toBeGreaterThan(0);
    expect(valoresPadrao().honorariosContabeisPj).toBeGreaterThan(0);
  });

  it("mantém os honorários de PF e PJ independentes entre si", () => {
    /* A revisão de agosto/2026 vetou amarrar um ao outro: a diferença
       entre eles é parte do que a comparação mede. */
    expect(valoresPadrao().honorariosContabeisPf).not.toBe(
      valoresPadrao().honorariosContabeisPj,
    );
  });

  /*
   * REGRESSÃO DA v2.8. Até a v2.7, digitar a receita escrevia 28% dela
   * no campo de pró-labore. A validação de setembro/2026 vetou:
   * os 28% são o patamar do FATOR R, e usá-los como valor de partida
   * transforma uma estratégia de enquadramento em dado do cliente.
   *
   * O padrão precisa continuar em zero. Se alguém voltar a semear o
   * campo, é aqui que aparece.
   */
  it("começa sem pró-labore — os 28% são sugestão, nunca padrão", () => {
    expect(valoresPadrao().proLabore).toBe(0);
  });

  it("começa sem atividade — classificação pendente, nunca chutada", () => {
    expect(valoresPadrao().atividadeId).toBeNull();
    expect(valoresPadrao().anexoManual).toBeNull();
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

describe("mesmaEntrada", () => {
  const a = {
    atividadeId: null,
    anexoManual: null,
    tipoAtuacao: "cnpj" as const,
    receitaMensal: 10_000,
    custosMensais: 1_500,
    proLabore: 2_800,
    honorariosContabeisPf: 0,
    honorariosContabeisPj: 300,
    rbt12: 0,
    folha12m: 0,
  };

  it("reconhece entradas idênticas", () => {
    expect(mesmaEntrada(a, { ...a })).toBe(true);
  });

  it("não depende da ordem das chaves", () => {
    /* O `JSON.stringify` que isto substituiu dizia "alterado" só porque
       o objeto foi montado noutra ordem. */
    const invertida = {
      honorariosContabeisPf: 0,
      honorariosContabeisPj: 300,
      rbt12: 0,
      folha12m: 0,
      proLabore: 2_800,
      custosMensais: 1_500,
      receitaMensal: 10_000,
      anexoManual: null,
      atividadeId: null,
      tipoAtuacao: "cnpj" as const,
    };
    expect(mesmaEntrada(a, invertida)).toBe(true);
  });

  it("ignora chave extra que tenha sobrevivido ao armazenamento", () => {
    const comLixo = { ...a, campoAntigo: "sobra" } as unknown as typeof a;
    expect(mesmaEntrada(a, comLixo)).toBe(true);
  });

  it("detecta alteração em cada campo da entrada", () => {
    expect(mesmaEntrada(a, { ...a, receitaMensal: 10_000.01 })).toBe(false);
    expect(mesmaEntrada(a, { ...a, custosMensais: 0 })).toBe(false);
    expect(mesmaEntrada(a, { ...a, proLabore: 2_801 })).toBe(false);
    expect(mesmaEntrada(a, { ...a, honorariosContabeisPj: 299 })).toBe(false);
    expect(mesmaEntrada(a, { ...a, tipoAtuacao: "pessoa-fisica" })).toBe(false);
    /* Os honorários de PF e PJ são campos distintos: mexer em um NÃO
       pode passar despercebido só porque o outro ficou igual. */
    expect(mesmaEntrada(a, { ...a, honorariosContabeisPf: 150 })).toBe(false);
    expect(mesmaEntrada(a, { ...a, atividadeId: "engenharia" })).toBe(false);
    expect(mesmaEntrada(a, { ...a, anexoManual: "V" })).toBe(false);
    expect(mesmaEntrada(a, { ...a, rbt12: 120_000 })).toBe(false);
    expect(mesmaEntrada(a, { ...a, folha12m: 40_000 })).toBe(false);
  });
});

describe("simulacaoSalvaSchema", () => {
  const valido = {
    id: "abc",
    criadaEm: "2026-08-20T10:00:00.000Z",
    entrada: {
      tipoAtuacao: "pessoa-fisica" as const,
      receitaMensal: 10_000,
      custosMensais: 1_500,
      proLabore: 2_800,
      honorariosContabeisPf: 0,
      honorariosContabeisPj: 300,
      rbt12: 0,
      folha12m: 0,
    },
    versaoRegras: "v1.1-2026-08",
    referencia: "Cliente XPTO",
  };

  it("aceita um registro completo", () => {
    expect(simulacaoSalvaSchema.safeParse(valido).success).toBe(true);
  });

  it("aceita registro antigo, sem atualizadaEm", () => {
    expect("atualizadaEm" in valido).toBe(false);
    expect(simulacaoSalvaSchema.safeParse(valido).success).toBe(true);
  });

  it("aceita registro com atualizadaEm válida", () => {
    expect(
      simulacaoSalvaSchema.safeParse({
        ...valido,
        atualizadaEm: "2026-08-21T09:00:00.000Z",
      }).success,
    ).toBe(true);
  });

  it("rejeita atualizadaEm inválida", () => {
    expect(
      simulacaoSalvaSchema.safeParse({ ...valido, atualizadaEm: "nunca" })
        .success,
    ).toBe(false);
  });

  it("aceita registro sem referência", () => {
    const semReferencia = { ...valido, referencia: undefined };
    expect(simulacaoSalvaSchema.safeParse(semReferencia).success).toBe(true);
  });

  it("rejeita data que o Date não interpreta", () => {
    for (const criadaEm of ["", "ontem", "2026-13-45", null, 12345, undefined]) {
      expect(
        simulacaoSalvaSchema.safeParse({ ...valido, criadaEm }).success,
      ).toBe(false);
    }
  });

  it("rejeita id vazio e versão de regras ausente", () => {
    expect(simulacaoSalvaSchema.safeParse({ ...valido, id: "" }).success).toBe(
      false,
    );
    expect(
      simulacaoSalvaSchema.safeParse({ ...valido, versaoRegras: undefined })
        .success,
    ).toBe(false);
  });

  it("rejeita entrada que o motor não aceitaria", () => {
    expect(
      simulacaoSalvaSchema.safeParse({
        ...valido,
        entrada: { ...valido.entrada, receitaMensal: -1 },
      }).success,
    ).toBe(false);
  });
});

/*
 * MIGRAÇÃO DE REGISTRO ANTIGO.
 *
 * Rejeitar o formato da v2.1 apagaria o histórico do contador numa
 * atualização — trabalho que ele não pediu para perder.
 */
describe("registro gravado antes da v2.2.0", () => {
  const legado = {
    id: "antigo",
    criadaEm: "2026-08-01T10:00:00.000Z",
    versaoRegras: "v1.1-2026-08",
    referencia: "Cliente XPTO",
    entrada: {
      tipoAtuacao: "cnpj" as const,
      receitaMensal: 10_000,
      custosMensais: 1_500,
      proLabore: 2_800,
      custoContabilidade: 300,
    },
  };

  it("continua sendo aceito", () => {
    expect(simulacaoSalvaSchema.safeParse(legado).success).toBe(true);
  });

  it("o honorário único vira o da EMPRESA, não o do autônomo", () => {
    const r = simulacaoSalvaSchema.parse(legado);
    expect(r.entrada.honorariosContabeisPj).toBe(300);
    /* O custo contábil da PF nunca existiu naquela versão: replicá-lo
       inventaria uma despesa que o contador nunca informou. */
    expect(r.entrada.honorariosContabeisPf).toBe(0);
  });

  it("volta como CLASSIFICAÇÃO PENDENTE, sem anexo atribuído", () => {
    const r = simulacaoSalvaSchema.parse(legado);
    expect(r.entrada.atividadeId).toBeNull();
    expect(r.entrada.anexoManual).toBeNull();
  });

  it("RBT12 e folha entram zeradas, para o motor projetar e avisar", () => {
    const r = simulacaoSalvaSchema.parse(legado);
    expect(r.entrada.rbt12).toBe(0);
    expect(r.entrada.folha12m).toBe(0);
  });

  it("preserva identidade, datas e rótulo", () => {
    const r = simulacaoSalvaSchema.parse(legado);
    expect(r.id).toBe("antigo");
    expect(r.criadaEm).toBe(legado.criadaEm);
    expect(r.referencia).toBe("Cliente XPTO");
    expect(r.versaoRegras).toBe("v1.1-2026-08");
  });

  it("registro atual atravessa a migração sem ser alterado", () => {
    const atual = { ...legado, entrada: { ...valida, tipoAtuacao: "cnpj" as const } };
    const r = simulacaoSalvaSchema.parse(atual);
    expect(r.entrada).toEqual(atual.entrada);
  });

  it("registro sem entrada nenhuma continua sendo rejeitado", () => {
    /* Migrar não pode virar "aceitar qualquer coisa". */
    expect(
      simulacaoSalvaSchema.safeParse({ ...legado, entrada: { foo: 1 } }).success,
    ).toBe(false);
  });

  it("atividade que saiu do catálogo não ressuscita classificada", () => {
    expect(
      simulacaoSalvaSchema.safeParse({
        ...legado,
        entrada: { ...valida, atividadeId: "atividade-extinta" },
      }).success,
    ).toBe(false);
  });
});
