import { describe, expect, it } from "vitest";
import { estadoDaRevisao, etiquetaDaAnalise } from "./revisao-calculo";
import { resumoValidacao } from "../domain/calculation-rules";
import type { ResumoValidacao } from "../domain/calculation-rules";

const resumo = (parcial: Partial<ResumoValidacao> = {}): ResumoValidacao => ({
  total: 18,
  validadas: 5,
  pendentes: 13,
  porStatus: {
    "hipotese-temporaria": 4,
    "a-validar": 9,
    "validada-tecnicamente": 5,
    "nao-aplicavel": 0,
  },
  ...parcial,
});

describe("estado da revisão do cálculo", () => {
  it("nomeia uma TAREFA, não o estado interno do modelo", () => {
    const e = estadoDaRevisao(resumo());
    expect(e.rotulo).toBe("Revisar cálculo");
    /* "Modelo", "validação" e a fração eram vocabulário de sistema. */
    expect(e.rotulo).not.toMatch(/modelo|premissa|valida/i);
    expect(e.rotulo).not.toMatch(/\d/);
  });

  it("dimensiona o trabalho pendente em vez de exibir um placar", () => {
    expect(estadoDaRevisao(resumo()).detalhe).toBe("13 pendências");
    /* O número é o que FALTA, não o que já foi feito. */
    expect(estadoDaRevisao(resumo()).detalhe).not.toContain("18");
  });

  it("concorda em número", () => {
    expect(estadoDaRevisao(resumo({ pendentes: 1 })).detalhe).toBe(
      "1 pendência",
    );
    expect(estadoDaRevisao(resumo({ pendentes: 2 })).detalhe).toBe(
      "2 pendências",
    );
  });

  it("pede atenção, e só quando há o que revisar", () => {
    expect(estadoDaRevisao(resumo()).precisaAtencao).toBe(true);
    expect(
      estadoDaRevisao(resumo({ pendentes: 0, validadas: 18 })).precisaAtencao,
    ).toBe(false);
  });

  it("com tudo revisado, muda de rótulo e some com o contador", () => {
    const e = estadoDaRevisao(resumo({ pendentes: 0, validadas: 18 }));
    expect(e.rotulo).toBe("Cálculo revisado");
    expect(e.detalhe).toBeNull();
  });

  it("nunca promete validação contábil ou legal", () => {
    /* O domínio significa "conferida contra a fonte citada na
       premissa". Prometer mais que isso é exatamente o que o produto
       existe para evitar. */
    for (const e of [
      estadoDaRevisao(resumo()),
      estadoDaRevisao(resumo({ pendentes: 0, validadas: 18 })),
    ]) {
      const texto = `${e.rotulo} ${e.detalhe ?? ""} ${e.resumo} ${e.nomeAcessivel}`;
      expect(texto).not.toMatch(/contad|contábil|contabil|legal|aprovad/i);
    }
  });

  it("mantém o nome acessível completo quando o rótulo encolhe", () => {
    const e = estadoDaRevisao(resumo());
    /* O detalhe some visualmente em telas estreitas; o nome acessível
       não pode encolher junto com a janela. */
    expect(e.nomeAcessivel).toContain("13");
    expect(e.nomeAcessivel).toContain("18");
    /* "Label in name": começa pelo texto visível. */
    expect(e.nomeAcessivel.startsWith(e.rotulo)).toBe(true);
    /* Diz o que o clique abre. */
    expect(e.nomeAcessivel).toMatch(/abre/i);
  });

  it("o resumo cita os dois números reais do domínio", () => {
    expect(estadoDaRevisao(resumo()).resumo).toBe(
      "5 de 18 premissas validadas tecnicamente",
    );
  });

  it("consome o resumo real sem nada fixado à mão", () => {
    /* Se o contador revisar uma premissa, o cabeçalho acompanha. */
    const real = resumoValidacao();
    const e = estadoDaRevisao(real);
    expect(e.precisaAtencao).toBe(real.pendentes > 0);
    if (real.pendentes > 0) {
      expect(e.detalhe).toContain(String(real.pendentes));
    }
  });
});

describe("etiqueta de estado da análise", () => {
  it("não etiqueta uma análise nunca calculada", () => {
    /* O formulário vazio já diz isso; a etiqueta seria ruído. */
    expect(
      etiquetaDaAnalise({ jaCalculou: false, desatualizado: false }),
    ).toBeNull();
  });

  it("avisa em âmbar quando há alteração não calculada", () => {
    const e = etiquetaDaAnalise({ jaCalculou: true, desatualizado: true })!;
    expect(e.texto).toBe("Desatualizada");
    expect(e.tom).toBe("atencao");
    expect(e.complemento).toMatch(/não calculad/i);
  });

  it("confirma em tom neutro quando o resultado está em dia", () => {
    const e = etiquetaDaAnalise({ jaCalculou: true, desatualizado: false })!;
    expect(e.texto).toBe("Salva");
    expect(e.tom).toBe("neutro");
    /* Sem prometer nuvem: o dado vive neste navegador. */
    expect(e.complemento).toMatch(/navegador/i);
  });

  it("nunca usa tom de erro — pendência não é falha", () => {
    for (const desatualizado of [true, false]) {
      const e = etiquetaDaAnalise({ jaCalculou: true, desatualizado });
      expect(["atencao", "neutro"]).toContain(e!.tom);
    }
  });
});
