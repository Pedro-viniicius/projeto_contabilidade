import { describe, expect, it } from "vitest";
import {
  acaoDoEnquadramento,
  rotuloDetalhe,
  textoAnexosPossiveis,
  textoFatorR,
} from "./acao-enquadramento";
import { classificar } from "../domain/classificacao";
import type { ContextoClassificacao } from "../domain/classificacao";

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

const semAtividade = classificar(ctx({ atividadeId: null }));
const semReceita = classificar(
  ctx({ atividadeId: "engenharia", receitaMensal: 0, rbt12: 0 }),
);
const resolvida = classificar(ctx({ atividadeId: "contabilidade" }));

describe("acaoDoEnquadramento", () => {
  it("sem atividade, o próximo passo é informar a atividade", () => {
    const acao = acaoDoEnquadramento(semAtividade);
    expect(acao?.campo).toBe("atividade");
    expect(acao?.rotulo).toBe("Informar atividade");
  });

  it("com atividade mas sem receita, o próximo passo é a RECEITA", () => {
    /* Mandar informar a atividade aqui faria o contador mexer num
       campo que ele já preencheu. */
    const acao = acaoDoEnquadramento(semReceita);
    expect(acao?.campo).toBe("receita");
    expect(acao?.rotulo).toBe("Informar receita mensal");
  });

  it("com anexo resolvido não há próximo passo obrigatório", () => {
    expect(acaoDoEnquadramento(resolvida)).toBeNull();
  });

  it("com anexo manual também não há pendência", () => {
    const manual = classificar(ctx({ anexoManual: "III" }));
    expect(acaoDoEnquadramento(manual)).toBeNull();
  });

  it("todo rótulo de ação é um verbo com objeto, nunca uma palavra só", () => {
    for (const c of [semAtividade, semReceita]) {
      const acao = acaoDoEnquadramento(c)!;
      expect(acao.rotulo.trim().split(/\s+/).length).toBeGreaterThan(1);
      expect(acao.motivo.length).toBeGreaterThan(20);
    }
  });
});

describe("rotuloDetalhe", () => {
  it("pendente pergunta pela PENDÊNCIA, não pela classificação", () => {
    /* "Por que esta classificação?" não faz sentido quando não existe
       classificação nenhuma para justificar. */
    expect(rotuloDetalhe(semAtividade)).toBe(
      "Por que o enquadramento está pendente?",
    );
  });

  it("resolvida pergunta pela classificação", () => {
    expect(rotuloDetalhe(resolvida)).toBe("Por que esta classificação?");
  });
});

describe("textoFatorR", () => {
  it("sem atividade NÃO afirma que o Fator R não se aplica", () => {
    /* O domínio não sabe: dizer "não se aplica" seria afirmar algo que
       ninguém apurou. */
    expect(textoFatorR(semAtividade)).toBe(
      "A definir após informar a atividade",
    );
  });

  it("atividade fora do Fator R diz isso explicitamente", () => {
    expect(textoFatorR(resolvida)).toBe("Não se aplica a esta atividade");
  });

  it("atividade sujeita, sem receita, explica o que falta", () => {
    expect(textoFatorR(semReceita)).toBe(
      "Sem receita de 12 meses para apurar",
    );
  });

  it("apurado mostra o valor contra o limite", () => {
    const c = classificar(
      ctx({ atividadeId: "engenharia", rbt12: 100_000, folha12m: 28_000 }),
    );
    expect(textoFatorR(c)).toBe("28,0% — limite 28,0%");
  });
});

describe("textoAnexosPossiveis", () => {
  it("sem atividade, aguarda em vez de dizer 'Indeterminado'", () => {
    expect(textoAnexosPossiveis(semAtividade)).toBe("Aguardando a atividade");
  });

  it("lista os candidatos quando existem", () => {
    expect(textoAnexosPossiveis(semReceita)).toBe("Anexo III ou Anexo V");
    expect(textoAnexosPossiveis(resolvida)).toBe("Anexo III");
  });
});
