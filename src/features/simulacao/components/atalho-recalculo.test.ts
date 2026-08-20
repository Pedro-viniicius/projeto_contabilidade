import { describe, expect, it } from "vitest";
import { atalhoDeveCalcular, type ContextoAtalho } from "./atalho-recalculo";

const contexto = (parcial: Partial<ContextoAtalho> = {}): ContextoAtalho => ({
  ctrlKey: true,
  metaKey: false,
  key: "Enter",
  dentroDeDialogo: false,
  gavetaAberta: false,
  ...parcial,
});

describe("atalho de recálculo", () => {
  it("calcula com Ctrl+Enter na área de trabalho", () => {
    expect(atalhoDeveCalcular(contexto())).toBe(true);
  });

  it("calcula com Cmd+Enter na área de trabalho", () => {
    expect(atalhoDeveCalcular(contexto({ ctrlKey: false, metaKey: true }))).toBe(
      true,
    );
  });

  it("NÃO calcula com o foco dentro de um diálogo", () => {
    /* Painel de feedback aberto, foco no textarea: Ctrl+Enter ali é
       "enviar esta observação", não "recalcular a análise atrás". */
    expect(atalhoDeveCalcular(contexto({ dentroDeDialogo: true }))).toBe(false);
  });

  it("NÃO calcula com painel lateral aberto, mesmo com o foco fora dele", () => {
    expect(atalhoDeveCalcular(contexto({ gavetaAberta: true }))).toBe(false);
  });

  it("NÃO calcula com diálogo e gaveta abertos ao mesmo tempo", () => {
    expect(
      atalhoDeveCalcular(contexto({ dentroDeDialogo: true, gavetaAberta: true })),
    ).toBe(false);
  });

  it("ignora Enter sem modificador", () => {
    expect(atalhoDeveCalcular(contexto({ ctrlKey: false }))).toBe(false);
  });

  it("ignora outras teclas com modificador", () => {
    for (const key of ["a", "s", "Escape", "Tab", "NumpadEnter"]) {
      expect(atalhoDeveCalcular(contexto({ key }))).toBe(false);
    }
  });
});
