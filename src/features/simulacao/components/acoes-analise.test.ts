import { describe, expect, it } from "vitest";
import {
  nomeAcessivelAbrir,
  nomeAcessivelExcluir,
  novaAnaliseDescartaTrabalho,
  perguntaExclusao,
  rotuloCalculo,
  type ContextoNovaAnalise,
} from "./acoes-analise";

const contexto = (
  parcial: Partial<ContextoNovaAnalise> = {},
): ContextoNovaAnalise => ({
  jaCalculou: false,
  desatualizado: false,
  temValoresPreenchidos: false,
  ...parcial,
});

describe("rótulo da ação de cálculo", () => {
  it("nomeia o objeto no primeiro cálculo", () => {
    expect(rotuloCalculo(false)).toBe("Calcular análise");
  });

  it("distingue atualizar de calcular", () => {
    /* As duas ações têm consequências diferentes: uma cria o
       resultado, a outra traz o resultado exibido de volta aos
       valores que estão nos campos. */
    expect(rotuloCalculo(true)).toBe("Atualizar resultados");
    expect(rotuloCalculo(true)).not.toBe(rotuloCalculo(false));
  });

  it("nunca devolve rótulo de uma palavra só", () => {
    for (const jaCalculou of [true, false]) {
      expect(rotuloCalculo(jaCalculou).split(" ").length).toBeGreaterThan(1);
    }
  });
});

describe("nova análise: quando confirmar", () => {
  it("NÃO confirma com o formulário intocado", () => {
    expect(novaAnaliseDescartaTrabalho(contexto())).toBe(false);
  });

  it("NÃO confirma quando a análise calculada está salva e sem edição", () => {
    /* Está no histórico: o clique não perde nada, e pedir confirmação
       aqui só ensinaria a confirmar sem ler. */
    expect(
      novaAnaliseDescartaTrabalho(
        contexto({ jaCalculou: true, temValoresPreenchidos: true }),
      ),
    ).toBe(false);
  });

  it("confirma com valores digitados e nunca calculados", () => {
    /* Nada foi ao histórico: o que está nos campos morre no clique. */
    expect(
      novaAnaliseDescartaTrabalho(contexto({ temValoresPreenchidos: true })),
    ).toBe(true);
  });

  it("confirma com edição por cima de uma análise já calculada", () => {
    /* O cálculo está salvo; as alterações posteriores, não. */
    expect(
      novaAnaliseDescartaTrabalho(
        contexto({
          jaCalculou: true,
          desatualizado: true,
          temValoresPreenchidos: true,
        }),
      ),
    ).toBe(true);
  });
});

describe("nomes acessíveis do histórico", () => {
  it("identifica a análise pela referência", () => {
    expect(nomeAcessivelAbrir("Cliente XPTO")).toBe(
      "Abrir análise Cliente XPTO",
    );
    expect(nomeAcessivelExcluir("Cliente XPTO")).toBe(
      "Excluir análise Cliente XPTO",
    );
  });

  it("não deixa o controle anônimo sem referência", () => {
    for (const vazia of [undefined, null, "", "   "]) {
      expect(nomeAcessivelAbrir(vazia)).toBe("Abrir análise sem referência");
      expect(nomeAcessivelExcluir(vazia)).toBe("Excluir análise sem referência");
    }
  });

  it("avisa que a exclusão não volta", () => {
    expect(perguntaExclusao("Cliente XPTO")).toContain("Cliente XPTO");
    expect(perguntaExclusao("Cliente XPTO")).toContain("desfazer");
  });
});
