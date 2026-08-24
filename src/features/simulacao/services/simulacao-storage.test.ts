import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  instalarArmazenamentoFalso,
  type ArmazenamentoFalso,
} from "@/lib/armazenamento-falso";
import { VERSAO_REGRAS } from "../domain/calculation-rules";
import {
  abrirDoHistorico,
  CHAVE_ATUAL,
  CHAVE_HISTORICO,
  descartarSimulacaoAtual,
  LIMITE_HISTORICO,
  lerHistorico,
  lerSimulacaoAtual,
  removerDoHistorico,
  salvarSimulacao,
} from "./simulacao-storage";
import type { EntradaSimulacao } from "../types";

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

let armazenamento: ArmazenamentoFalso;
let desinstalar: () => void;

beforeEach(() => {
  ({ armazenamento, desinstalar } = instalarArmazenamentoFalso());
});
afterEach(() => desinstalar());

/* ------------------------------------------------------------------ */
/* Identidade da análise — o defeito P0-01 da auditoria               */
/* ------------------------------------------------------------------ */

describe("identidade da análise", () => {
  it("recalcular a mesma análise atualiza o registro em vez de duplicar", () => {
    const primeira = salvarSimulacao(entrada(), "Cliente C");
    const id = primeira.registro.id;

    for (let i = 0; i < 20; i += 1) {
      salvarSimulacao(entrada({ receitaMensal: 10_000 + i }), "Cliente C", id);
    }

    const { registros } = lerHistorico();
    expect(registros).toHaveLength(1);
    expect(registros[0].id).toBe(id);
    expect(registros[0].entrada.receitaMensal).toBe(10_019);
  });

  it("recalcular 20 vezes não expulsa as análises de outros clientes", () => {
    const a = salvarSimulacao(entrada({ receitaMensal: 5_000 }), "Cliente A");
    const b = salvarSimulacao(entrada({ receitaMensal: 8_000 }), "Cliente B");
    const c = salvarSimulacao(entrada({ receitaMensal: 12_000 }), "Cliente C");

    for (let i = 0; i < 20; i += 1) {
      salvarSimulacao(
        entrada({ receitaMensal: 12_000 + i }),
        "Cliente C",
        c.registro.id,
      );
    }

    const { registros } = lerHistorico();
    expect(registros).toHaveLength(3);
    const referencias = registros.map((r) => r.referencia);
    expect(referencias).toContain("Cliente A");
    expect(referencias).toContain("Cliente B");
    expect(referencias).toContain("Cliente C");
    expect(registros.filter((r) => r.referencia === "Cliente C")).toHaveLength(1);
    expect(registros.map((r) => r.id)).toEqual(
      expect.arrayContaining([a.registro.id, b.registro.id, c.registro.id]),
    );
  });

  it("abrir uma análise antiga e recalcular mantém o mesmo id", () => {
    const a = salvarSimulacao(entrada({ receitaMensal: 5_000 }), "Cliente A");
    salvarSimulacao(entrada({ receitaMensal: 8_000 }), "Cliente B");

    const aberta = abrirDoHistorico(a.registro.id);
    expect(aberta?.id).toBe(a.registro.id);

    salvarSimulacao(
      entrada({ receitaMensal: 6_000 }),
      "Cliente A",
      aberta!.id,
    );

    const { registros } = lerHistorico();
    expect(registros.filter((r) => r.referencia === "Cliente A")).toHaveLength(1);
    const atualizada = registros.find((r) => r.id === a.registro.id);
    expect(atualizada?.entrada.receitaMensal).toBe(6_000);
    expect(registros).toHaveLength(2);
  });

  it("nova análise depois de editar uma antiga gera id novo", () => {
    const a = salvarSimulacao(entrada(), "Cliente A");
    salvarSimulacao(entrada({ receitaMensal: 6_000 }), "Cliente A", a.registro.id);

    /* "Nova análise" descarta a análise em edição. */
    descartarSimulacaoAtual();
    const nova = salvarSimulacao(entrada({ receitaMensal: 9_000 }), "Cliente Z");

    expect(nova.registro.id).not.toBe(a.registro.id);
    expect(lerHistorico().registros).toHaveLength(2);
  });

  it("trocar apenas o rótulo não cria análise nova", () => {
    const a = salvarSimulacao(entrada(), "Rascunho");
    salvarSimulacao(entrada(), "Cliente XPTO — cenário 01", a.registro.id);

    const { registros } = lerHistorico();
    expect(registros).toHaveLength(1);
    expect(registros[0].id).toBe(a.registro.id);
    expect(registros[0].referencia).toBe("Cliente XPTO — cenário 01");
  });

  it("preserva criadaEm e marca atualizadaEm no recálculo", () => {
    const a = salvarSimulacao(entrada(), "Cliente A");
    expect(a.registro.atualizadaEm).toBeUndefined();

    const b = salvarSimulacao(entrada({ receitaMensal: 11_000 }), "Cliente A", a.registro.id);
    expect(b.registro.criadaEm).toBe(a.registro.criadaEm);
    expect(b.registro.atualizadaEm).toBeDefined();
  });

  it("preserva a versão de regras da criação ao recalcular", () => {
    armazenamento.semear(
      CHAVE_HISTORICO,
      JSON.stringify([
        {
          id: "antigo",
          criadaEm: "2026-07-01T10:00:00.000Z",
          entrada: base,
          versaoRegras: "v1.0-2026-07",
          referencia: "Cliente Antigo",
        },
      ]),
    );

    const r = salvarSimulacao(entrada({ receitaMensal: 7_000 }), "Cliente Antigo", "antigo");
    expect(r.registro.versaoRegras).toBe("v1.0-2026-07");
    expect(r.registro.versaoRegras).not.toBe(VERSAO_REGRAS);
  });

  it("o limite do histórico conta análises distintas", () => {
    const ids: string[] = [];
    for (let i = 0; i < LIMITE_HISTORICO + 3; i += 1) {
      descartarSimulacaoAtual();
      ids.push(
        salvarSimulacao(entrada({ receitaMensal: 10_000 + i * 100 }), `Cliente ${i}`)
          .registro.id,
      );
    }

    const { registros } = lerHistorico();
    expect(registros).toHaveLength(LIMITE_HISTORICO);
    /* As mais recentes sobrevivem; as três primeiras saem. */
    expect(registros.map((r) => r.id)).not.toContain(ids[0]);
    expect(registros.map((r) => r.id)).toContain(ids[ids.length - 1]);
  });

  it("remover a análise aberta também fecha a edição", () => {
    const a = salvarSimulacao(entrada(), "Cliente A");
    expect(lerSimulacaoAtual().registro?.id).toBe(a.registro.id);

    removerDoHistorico(a.registro.id);

    expect(lerHistorico().registros).toHaveLength(0);
    expect(lerSimulacaoAtual().registro).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Dados corrompidos — o defeito P1-01 da auditoria                   */
/* ------------------------------------------------------------------ */

describe("registros corrompidos", () => {
  const registroValido = {
    id: "bom",
    criadaEm: "2026-08-20T10:00:00.000Z",
    entrada: base,
    versaoRegras: "v1.1-2026-08",
    referencia: "Cliente OK",
  };

  it("data inválida no histórico é ignorada e o resto sobrevive", () => {
    armazenamento.semear(
      CHAVE_HISTORICO,
      JSON.stringify([
        registroValido,
        { ...registroValido, id: "ruim", criadaEm: "data-invalida" },
      ]),
    );

    const { registros, descartados } = lerHistorico();
    expect(registros).toHaveLength(1);
    expect(registros[0].id).toBe("bom");
    expect(descartados).toBe(1);
  });

  it("a data que sobrevive é sempre interpretável por Date", () => {
    armazenamento.semear(
      CHAVE_HISTORICO,
      JSON.stringify([
        { ...registroValido, id: "sem-data", criadaEm: undefined },
        { ...registroValido, id: "data-nula", criadaEm: null },
        { ...registroValido, id: "data-numero", criadaEm: 12345 },
        { ...registroValido, id: "data-lixo", criadaEm: "ontem" },
        registroValido,
      ]),
    );

    const { registros, descartados } = lerHistorico();
    expect(descartados).toBe(4);
    for (const r of registros) {
      expect(Number.isFinite(new Date(r.criadaEm).getTime())).toBe(true);
      /* É esta chamada que lançava RangeError e derrubava a tela. */
      expect(() =>
        new Intl.DateTimeFormat("pt-BR").format(new Date(r.criadaEm)),
      ).not.toThrow();
    }
  });

  it("rejeita registro sem id, sem versão de regras ou com entrada inválida", () => {
    armazenamento.semear(
      CHAVE_HISTORICO,
      JSON.stringify([
        { ...registroValido, id: "" },
        { ...registroValido, id: "sem-versao", versaoRegras: undefined },
        {
          ...registroValido,
          id: "entrada-ruim",
          entrada: { ...base, receitaMensal: -1 },
        },
        { ...registroValido, id: "entrada-ausente", entrada: undefined },
        "isto nem é um objeto",
        null,
      ]),
    );

    const { registros, descartados } = lerHistorico();
    expect(registros).toHaveLength(0);
    expect(descartados).toBe(6);
  });

  it("histórico que não é lista devolve vazio sem lançar", () => {
    armazenamento.semear(CHAVE_HISTORICO, JSON.stringify({ nao: "e lista" }));
    expect(lerHistorico()).toEqual({ registros: [], descartados: 0 });

    armazenamento.semear(CHAVE_HISTORICO, "{{{ json quebrado");
    expect(lerHistorico()).toEqual({ registros: [], descartados: 0 });
  });

  it("análise em edição corrompida é sinalizada, não apagada durante a leitura", () => {
    armazenamento.semear(
      CHAVE_ATUAL,
      JSON.stringify({ ...registroValido, criadaEm: "data-invalida" }),
    );

    const leitura = lerSimulacaoAtual();
    expect(leitura.registro).toBeNull();
    expect(leitura.descartado).toBe(true);

    /* Leitor puro: a chave continua onde estava (é sobrescrita no
       próximo cálculo). Ler de novo não muda o resultado. */
    expect(armazenamento.getItem(CHAVE_ATUAL)).not.toBeNull();
    expect(lerSimulacaoAtual()).toEqual(leitura);
  });

  it("um registro corrompido não apaga o histórico inteiro", () => {
    armazenamento.semear(
      CHAVE_HISTORICO,
      JSON.stringify([
        { ...registroValido, id: "ruim", criadaEm: "x" },
        { ...registroValido, id: "a" },
        { ...registroValido, id: "b" },
      ]),
    );

    expect(lerHistorico().registros.map((r) => r.id)).toEqual(["a", "b"]);
    /* Nada foi reescrito só por ter sido lido. */
    expect(JSON.parse(armazenamento.getItem(CHAVE_HISTORICO)!)).toHaveLength(3);
  });

  it("aceita registro antigo sem atualizadaEm", () => {
    armazenamento.semear(CHAVE_HISTORICO, JSON.stringify([registroValido]));
    const { registros, descartados } = lerHistorico();
    expect(descartados).toBe(0);
    expect(registros[0].atualizadaEm).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ */
/* Falha de gravação — o defeito P1-04 da auditoria                   */
/* ------------------------------------------------------------------ */

describe("falha de gravação", () => {
  it("devolve persistido: false quando o aparelho recusa a escrita", () => {
    armazenamento.falharAoGravar("QuotaExceededError");
    const r = salvarSimulacao(entrada(), "Cliente A");

    expect(r.persistido).toBe(false);
    expect(r.motivo).toBe("sem-espaco");
    /* O cálculo continua válido: o registro é devolvido mesmo assim. */
    expect(r.registro.entrada.receitaMensal).toBe(10_000);
    expect(lerHistorico().registros).toHaveLength(0);
  });

  it("distingue armazenamento indisponível de cota estourada", () => {
    armazenamento.falharAoGravar("SecurityError");
    expect(salvarSimulacao(entrada()).motivo).toBe("indisponivel");
  });

  it("gravação bem-sucedida reporta persistido: true", () => {
    const r = salvarSimulacao(entrada(), "Cliente A");
    expect(r.persistido).toBe(true);
    expect(r.motivo).toBeUndefined();
    expect(lerHistorico().registros).toHaveLength(1);
  });
});
