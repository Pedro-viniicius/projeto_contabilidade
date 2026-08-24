import { describe, expect, it } from "vitest";
import {
  atividadePorId,
  buscarAtividades,
  CATALOGO_ATIVIDADES,
} from "./catalogo-atividades";

describe("integridade do catálogo", () => {
  it("não tem id repetido", () => {
    const ids = CATALOGO_ATIVIDADES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("não tem CNAE repetido", () => {
    const cnaes = CATALOGO_ATIVIDADES.map((a) => a.cnae);
    expect(new Set(cnaes).size).toBe(cnaes.length);
  });

  it("toda atividade tem CNAE no formato 0000-0/00", () => {
    for (const a of CATALOGO_ATIVIDADES) {
      expect(a.cnae).toMatch(/^\d{4}-\d\/\d{2}$/);
    }
  });

  it("toda atividade tem ao menos um anexo possível", () => {
    for (const a of CATALOGO_ATIVIDADES) {
      expect(a.simples.anexosPossiveis.length).toBeGreaterThan(0);
    }
  });

  it("atividade sujeita ao Fator R transita exatamente entre III e V", () => {
    for (const a of CATALOGO_ATIVIDADES) {
      if (!a.simples.sujeitaFatorR) continue;
      expect(a.simples.anexosPossiveis).toEqual(["III", "V"]);
    }
  });

  it("atividade não sujeita ao Fator R tem anexo único", () => {
    for (const a of CATALOGO_ATIVIDADES) {
      if (a.simples.sujeitaFatorR) continue;
      expect(a.simples.anexosPossiveis).toHaveLength(1);
    }
  });

  it("toda atividade carrega fonte e status de validação", () => {
    for (const a of CATALOGO_ATIVIDADES) {
      expect(a.fonte.referencia).toContain("LC 123/2006");
      expect(a.fonte.ano).toBeGreaterThanOrEqual(2026);
      expect(a.status).toBeDefined();
    }
  });

  it("nenhuma entrada se declara validada sem aceite do contador", () => {
    /* Marcar "validada-tecnicamente" aqui seria inventar respaldo
       profissional que ainda não recebemos. */
    for (const a of CATALOGO_ATIVIDADES) {
      expect(a.status).not.toBe("validada-tecnicamente");
    }
  });
});

describe("atividadePorId", () => {
  it("encontra a atividade existente", () => {
    expect(atividadePorId("engenharia")?.cnae).toBe("7112-0/00");
  });

  it("devolve null para id inexistente, nulo ou vazio", () => {
    expect(atividadePorId("nao-existe")).toBeNull();
    expect(atividadePorId(null)).toBeNull();
    expect(atividadePorId("")).toBeNull();
  });
});

describe("buscarAtividades", () => {
  it("busca por descrição", () => {
    const r = buscarAtividades("engenharia");
    expect(r[0].id).toBe("engenharia");
  });

  it("ignora acento e caixa", () => {
    expect(buscarAtividades("MEDICA")[0].categoria).toBe("Saúde");
    expect(buscarAtividades("odontologica")[0].id).toBe("odontologia");
  });

  it("busca por CNAE, com ou sem pontuação", () => {
    expect(buscarAtividades("6201-5/01")[0].id).toBe("software-sob-encomenda");
    expect(buscarAtividades("6201501")[0].id).toBe("software-sob-encomenda");
    expect(buscarAtividades("7112")[0].id).toBe("engenharia");
  });

  it("busca por sinônimo que não aparece na descrição", () => {
    /* "dentista" não está no texto "Atividade odontológica". */
    expect(buscarAtividades("dentista")[0].id).toBe("odontologia");
    expect(buscarAtividades("software").map((a) => a.categoria)).toContain(
      "Tecnologia",
    );
  });

  it("prefere quem COMEÇA com o termo", () => {
    const r = buscarAtividades("consultoria");
    expect(r[0].descricao.toLowerCase().startsWith("consultoria")).toBe(true);
  });

  it("devolve o catálogo quando o termo está vazio", () => {
    expect(buscarAtividades("").length).toBeGreaterThan(0);
  });

  it("devolve lista vazia — nunca um palpite — para termo sem correspondência", () => {
    expect(buscarAtividades("zzzzzzz")).toEqual([]);
  });

  it("respeita o limite de resultados", () => {
    expect(buscarAtividades("a", 3).length).toBeLessThanOrEqual(3);
  });
});
