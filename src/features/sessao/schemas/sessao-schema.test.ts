import { describe, expect, it } from "vitest";
import { acessoDemoSchema, sessaoDemoSchema } from "./sessao-schema";

describe("acesso demonstrativo", () => {
  it("não pede senha — não há o que autenticar", () => {
    /* Até a v2.4 o formulário exigia uma senha que era descartada em
       seguida. Pedir credencial que não credencia sugere uma proteção
       que o sistema não tem. */
    expect(Object.keys(acessoDemoSchema.shape).sort()).toEqual([
      "email",
      "lembrar",
    ]);
  });

  it("aceita o e-mail com a lembrança opcional", () => {
    const r = acessoDemoSchema.safeParse({ email: " a@b.com.br " });
    expect(r.success).toBe(true);
    expect(r.success && r.data.email).toBe("a@b.com.br");
  });

  it("cobra o e-mail quando vazio", () => {
    const r = acessoDemoSchema.safeParse({ email: "   ", lembrar: false });
    expect(r.success).toBe(false);
    expect(r.success === false && r.error.issues[0]?.message).toBe(
      "Informe seu e-mail.",
    );
  });

  it("recusa formato inválido sem despejar detalhe técnico", () => {
    const r = acessoDemoSchema.safeParse({ email: "contador@escritorio" });
    expect(r.success).toBe(false);
    expect(r.success === false && r.error.issues[0]?.message).toBe(
      "Informe um e-mail válido.",
    );
  });
});

describe("sessão gravada", () => {
  it("guarda apenas e-mail e horário", () => {
    expect(Object.keys(sessaoDemoSchema.shape).sort()).toEqual([
      "email",
      "iniciadaEm",
    ]);
  });
});
