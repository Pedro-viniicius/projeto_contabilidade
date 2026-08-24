import { describe, expect, it } from "vitest";
import {
  anexoTemCalculo,
  atingeFatorR,
  calcularAliquotaEfetiva,
  calcularFatorR,
  faixaDoRbt12,
  rbt12Aplicada,
  resolverAnexoPorFatorR,
  tabelaDoAnexo,
} from "./simples-nacional";
import { REGRAS, type Anexo } from "./calculation-rules";

const ANEXOS: readonly Anexo[] = ["I", "II", "III", "IV", "V"];

/*
 * INTEGRIDADE DAS TABELAS.
 *
 * Uma faixa fora de ordem, sobreposta ou com limite errado não quebra
 * nada em tempo de execução: apenas devolve o imposto do cliente
 * errado, em silêncio. Estes testes existem para que uma transcrição
 * mal copiada falhe no CI, e não na mesa do contador.
 */
describe.each(ANEXOS)("tabela do Anexo %s", (anexo) => {
  const tabela = tabelaDoAnexo(anexo);

  it("tem as seis faixas de RBT12 previstas na lei", () => {
    expect(tabela).toHaveLength(6);
  });

  it("está em ordem crescente e sem sobreposição", () => {
    for (let i = 1; i < tabela.length; i += 1) {
      expect(tabela[i].ate).toBeGreaterThan(tabela[i - 1].ate);
    }
  });

  it("é fechada e termina exatamente no teto do Simples Nacional", () => {
    /* Nenhuma faixa aberta: acima do teto não existe Simples. */
    expect(tabela.at(-1)?.ate).toBe(REGRAS.simplesNacional.limiteRbt12.valor);
  });

  it("tem alíquotas plausíveis e crescentes", () => {
    for (const faixa of tabela) {
      expect(faixa.aliquota).toBeGreaterThan(0);
      expect(faixa.aliquota).toBeLessThan(1);
    }
    for (let i = 1; i < tabela.length; i += 1) {
      expect(tabela[i].aliquota).toBeGreaterThan(tabela[i - 1].aliquota);
    }
  });

  it("não tem parcela a deduzir negativa, e a primeira faixa não deduz", () => {
    expect(tabela[0].parcelaADeduzir).toBe(0);
    for (const faixa of tabela) {
      expect(faixa.parcelaADeduzir).toBeGreaterThanOrEqual(0);
    }
  });

  it("nunca produz alíquota efetiva maior que a nominal da faixa", () => {
    /* A parcela a deduzir só pode REDUZIR a carga. Se uma transcrição
       invertesse o sinal, este teste pegaria. */
    for (const faixa of tabela) {
      const efetiva = calcularAliquotaEfetiva(faixa.ate, anexo);
      expect(efetiva.aliquota).toBeLessThanOrEqual(faixa.aliquota);
      expect(efetiva.aliquota).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("faixaDoRbt12", () => {
  it("usa o limite superior de forma inclusiva", () => {
    /* Exatamente R$ 180.000 ainda é a PRIMEIRA faixa. */
    expect(faixaDoRbt12(180_000, "III").aliquota).toBe(0.06);
    expect(faixaDoRbt12(180_000.01, "III").aliquota).toBe(0.112);
  });

  it("cai na última faixa acima do teto, sem inventar faixa nova", () => {
    expect(faixaDoRbt12(9_000_000, "III")).toEqual(tabelaDoAnexo("III").at(-1));
  });
});

describe("calcularAliquotaEfetiva", () => {
  it("aplica a fórmula da LC 123 na segunda faixa do Anexo III", () => {
    /* (300.000 × 11,2% − 9.360) ÷ 300.000 = 8,08% */
    const r = calcularAliquotaEfetiva(300_000, "III");
    expect(r.aliquota).toBeCloseTo(0.0808, 6);
    expect(r.faixa.parcelaADeduzir).toBe(9_360);
  });

  it("aplica a fórmula na terceira faixa do Anexo V", () => {
    /* (500.000 × 19,5% − 9.900) ÷ 500.000 = 17,52% */
    expect(calcularAliquotaEfetiva(500_000, "V").aliquota).toBeCloseTo(
      0.1752,
      6,
    );
  });

  it("na primeira faixa a efetiva é igual à nominal", () => {
    expect(calcularAliquotaEfetiva(100_000, "III").aliquota).toBeCloseTo(
      0.06,
      6,
    );
    expect(calcularAliquotaEfetiva(100_000, "V").aliquota).toBeCloseTo(
      0.155,
      6,
    );
  });

  it("NÃO divide por zero quando a RBT12 é zero", () => {
    const r = calcularAliquotaEfetiva(0, "III");
    expect(Number.isFinite(r.aliquota)).toBe(true);
    /* Sem receita acumulada não há o que deduzir: sobra a nominal. */
    expect(r.aliquota).toBe(0.06);
  });

  it("trata RBT12 negativa ou inválida como zero", () => {
    expect(calcularAliquotaEfetiva(-50_000, "V").aliquota).toBe(0.155);
    expect(calcularAliquotaEfetiva(Number.NaN, "V").rbt12).toBe(0);
  });

  it("sinaliza quando a RBT12 estoura o teto do Simples", () => {
    expect(calcularAliquotaEfetiva(4_800_000, "III").acimaDoTeto).toBe(false);
    expect(calcularAliquotaEfetiva(4_800_000.01, "III").acimaDoTeto).toBe(true);
  });

  it("é determinística", () => {
    expect(calcularAliquotaEfetiva(720_000, "V")).toEqual(
      calcularAliquotaEfetiva(720_000, "V"),
    );
  });
});

describe("calcularFatorR", () => {
  it("divide folha por receita dos últimos 12 meses", () => {
    expect(calcularFatorR(28_000, 100_000)).toBeCloseTo(0.28, 6);
  });

  it("devolve null — e não zero — quando não há RBT12", () => {
    /* Zero significaria "folha nenhuma" e classificaria no Anexo V
       uma empresa sobre a qual não sabemos nada. */
    expect(calcularFatorR(10_000, 0)).toBeNull();
  });

  it("trata folha negativa como zero", () => {
    expect(calcularFatorR(-5_000, 100_000)).toBe(0);
  });
});

describe("atingeFatorR — limites", () => {
  const limite = REGRAS.simplesNacional.fatorRLimite.valor;

  it("abaixo do limite não atinge", () => {
    expect(atingeFatorR(limite - 0.0001)).toBe(false);
  });

  it("EXATAMENTE no limite já atinge — a regra é inclusiva", () => {
    expect(atingeFatorR(limite)).toBe(true);
  });

  it("acima do limite atinge", () => {
    expect(atingeFatorR(limite + 0.0001)).toBe(true);
  });

  it("sem Fator R apurável, não atinge", () => {
    expect(atingeFatorR(null)).toBe(false);
  });
});

describe("resolverAnexoPorFatorR", () => {
  it("Fator R no limite leva ao Anexo III", () => {
    expect(resolverAnexoPorFatorR(0.28, ["III", "V"])).toBe("III");
  });

  it("Fator R abaixo do limite leva ao Anexo V", () => {
    expect(resolverAnexoPorFatorR(0.2799, ["III", "V"])).toBe("V");
  });

  it("candidato único dispensa o Fator R", () => {
    expect(resolverAnexoPorFatorR(null, ["IV"])).toBe("IV");
  });

  it("sem Fator R apurável e com dois candidatos, não escolhe", () => {
    expect(resolverAnexoPorFatorR(null, ["III", "V"])).toBeNull();
  });
});

describe("anexoTemCalculo", () => {
  it("suporta os anexos de serviço com CPP dentro do DAS", () => {
    expect(anexoTemCalculo("III")).toBe(true);
    expect(anexoTemCalculo("V")).toBe(true);
  });

  it("NÃO suporta o Anexo IV, cuja CPP fica fora da guia única", () => {
    expect(anexoTemCalculo("IV")).toBe(false);
  });
});

describe("rbt12Aplicada", () => {
  it("usa a RBT12 informada quando ela existe", () => {
    expect(rbt12Aplicada(240_000, 10_000)).toEqual({
      valor: 240_000,
      projetada: false,
    });
  });

  it("projeta 12 meses da receita quando a RBT12 está em branco", () => {
    const r = rbt12Aplicada(0, 10_000);
    expect(r.valor).toBe(120_000);
    /* A projeção é declarada, para que a interface consiga avisar. */
    expect(r.projetada).toBe(true);
  });
});
