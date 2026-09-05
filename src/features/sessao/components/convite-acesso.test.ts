import { describe, expect, it } from "vitest";
import { resumoValidacao } from "@/features/simulacao/domain/calculation-rules";
import { ETAPAS_DO_FLUXO, avisoDoModelo } from "./convite-acesso";

describe("etapas do fluxo", () => {
  it("descreve o trabalho do contador, na ordem em que ele acontece", () => {
    expect(ETAPAS_DO_FLUXO.map((e) => e.numero)).toEqual([1, 2, 3]);
    expect(ETAPAS_DO_FLUXO.map((e) => e.titulo)).toEqual([
      "Preencha os dados do cliente",
      "Compare os cenários",
      "Revise antes de apresentar",
    ]);
  });

  it("não apresenta o produto por nome de subsistema", () => {
    /* O que a tela dizia até a v2.4 e não deve voltar a dizer: os
       quatro módulos internos como se fossem o produto. */
    const texto = ETAPAS_DO_FLUXO.map((e) => `${e.titulo} ${e.apoio}`)
      .join(" ")
      .toLowerCase();

    for (const jargao of ["comparativo", "auditoria", "histórico", "módulo"]) {
      expect(texto).not.toContain(jargao);
    }
  });

  it("mantém o apoio curto — é reconhecimento, não treinamento", () => {
    for (const etapa of ETAPAS_DO_FLUXO) {
      expect(etapa.apoio.length).toBeLessThanOrEqual(70);
    }
  });
});

describe("aviso do modelo", () => {
  it("declara o escopo sem prometer validação contábil", () => {
    const aviso = avisoDoModelo({
      total: 18,
      pendentes: 13,
      validadas: 5,
      porStatus: {
        "hipotese-temporaria": 6,
        "a-validar": 7,
        "validada-tecnicamente": 5,
        "nao-aplicavel": 0,
      },
    });

    expect(aviso.titulo).toBe("Ferramenta de apoio à decisão");
    expect(aviso.texto).toContain("não substituem a apuração fiscal");
    expect(aviso.detalhe).toBe(
      "13 premissas ainda aguardam revisão de um contador, de 18 no modelo.",
    );
  });

  it("concorda no singular", () => {
    const aviso = avisoDoModelo({
      total: 18,
      pendentes: 1,
      validadas: 17,
      porStatus: {
        "hipotese-temporaria": 1,
        "a-validar": 0,
        "validada-tecnicamente": 17,
        "nao-aplicavel": 0,
      },
    });

    expect(aviso.detalhe).toBe(
      "1 premissa ainda aguarda revisão de um contador, de 18 no modelo.",
    );
  });

  it("muda de mensagem quando não há mais pendência", () => {
    const aviso = avisoDoModelo({
      total: 18,
      pendentes: 0,
      validadas: 18,
      porStatus: {
        "hipotese-temporaria": 0,
        "a-validar": 0,
        "validada-tecnicamente": 18,
        "nao-aplicavel": 0,
      },
    });

    expect(aviso.detalhe).toBe(
      "As 18 premissas do modelo já foram validadas tecnicamente.",
    );
  });

  it("acompanha o domínio real, sem número escrito à mão", () => {
    /* Se uma premissa mudar de status em calculation-rules.ts, a tela
       de acesso muda junto — não há como texto e modelo divergirem. */
    const real = resumoValidacao();
    const aviso = avisoDoModelo(real);
    expect(aviso.detalhe).toContain(String(real.total));
  });
});
