import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  instalarArmazenamentoFalso,
  type ArmazenamentoFalso,
} from "@/lib/armazenamento-falso";
import {
  CHAVE_FEEDBACK,
  lerFeedbacks,
  salvarFeedback,
} from "./feedback-storage";

const observacao = {
  categoria: "premissa-errada",
  mensagem: "A alíquota efetiva não corresponde ao anexo desta atividade.",
  contato: "",
};

const contexto = { rota: "/workspace", entradaSimulacao: null };

let armazenamento: ArmazenamentoFalso;
let desinstalar: () => void;

beforeEach(() => {
  ({ armazenamento, desinstalar } = instalarArmazenamentoFalso());
});
afterEach(() => desinstalar());

describe("registro de observações", () => {
  it("grava e lê de volta com o contexto de auditoria", () => {
    const r = salvarFeedback(observacao, contexto);
    expect(r.sucesso).toBe(true);

    const registrados = lerFeedbacks();
    expect(registrados).toHaveLength(1);
    expect(registrados[0].contexto.versaoRegras).toMatch(/^v\d/);
    expect(registrados[0].contexto.rota).toBe("/workspace");
  });

  it("relata falha em vez de confirmar registro que não aconteceu", () => {
    armazenamento.falharAoGravar("QuotaExceededError");
    const r = salvarFeedback(observacao, contexto);

    expect(r.sucesso).toBe(false);
    expect(r.sucesso === false && r.motivo).toBe("sem-espaco");
    expect(lerFeedbacks()).toHaveLength(0);
  });

  it("ignora registro sem contexto em vez de quebrar ao lê-lo", () => {
    /* A interface lê `contexto.versaoRegras`: sem o objeto, o acesso
       lançava TypeError durante o render. */
    armazenamento.semear(
      CHAVE_FEEDBACK,
      JSON.stringify([
        {
          id: "sem-contexto",
          criadoEm: "2026-08-20T10:00:00.000Z",
          categoria: "sugestao",
          mensagem: "mensagem com dez ou mais caracteres",
        },
      ]),
    );

    expect(() => lerFeedbacks()).not.toThrow();
    expect(lerFeedbacks()).toHaveLength(0);
  });

  it("ignora registro com data ilegível e preserva os válidos", () => {
    salvarFeedback(observacao, contexto);
    const bons = JSON.parse(armazenamento.getItem(CHAVE_FEEDBACK)!);
    armazenamento.semear(
      CHAVE_FEEDBACK,
      JSON.stringify([{ ...bons[0], id: "ruim", criadoEm: "ontem" }, ...bons]),
    );

    const registrados = lerFeedbacks();
    expect(registrados).toHaveLength(1);
    expect(registrados[0].id).not.toBe("ruim");
  });

  it("devolve lista vazia quando o armazenamento está corrompido", () => {
    armazenamento.semear(CHAVE_FEEDBACK, "{{{ quebrado");
    expect(lerFeedbacks()).toEqual([]);

    armazenamento.semear(CHAVE_FEEDBACK, JSON.stringify({ nao: "e lista" }));
    expect(lerFeedbacks()).toEqual([]);
  });
});
