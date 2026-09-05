/**
 * Validação do acesso demonstrativo.
 *
 * ATENÇÃO: isto NÃO é autenticação. Não há servidor, banco, token nem
 * verificação de credencial. O schema existe por dois motivos
 * legítimos: dar mensagens de erro decentes no formulário e revalidar
 * o que vem do localStorage (regra 6 do projeto) antes de confiar no
 * dado.
 *
 * POR QUE NÃO HÁ SENHA AQUI (mudou na v2.5): até a v2.4 o formulário
 * pedia senha, validava que não estava vazia e a descartava. Nada era
 * comparado, gravado ou transmitido — a senha era cenário. Pedir uma
 * credencial que não credencia cobra trabalho do contador em troca de
 * nada e, pior, sugere uma proteção que o sistema não tem. O e-mail
 * ficou porque é usado de verdade: dele sai o nome exibido no menu de
 * conta (`nomeExibido`).
 */

import { z } from "zod";

export const acessoDemoSchema = z.object({
  email: z
    .string({ error: "Informe seu e-mail." })
    .trim()
    .min(1, { message: "Informe seu e-mail." })
    .max(160, { message: "E-mail muito longo." })
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), {
      message: "Informe um e-mail válido.",
    }),
  lembrar: z.boolean().optional(),
});

export type AcessoDemo = z.infer<typeof acessoDemoSchema>;

/** Sessão demonstrativa gravada no aparelho. Sem senha, por definição. */
export const sessaoDemoSchema = z.object({
  email: z.string().trim().min(3).max(160),
  iniciadaEm: z.string().min(1),
});

export type SessaoDemo = z.infer<typeof sessaoDemoSchema>;
