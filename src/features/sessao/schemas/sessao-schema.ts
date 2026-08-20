/**
 * Validação do acesso demonstrativo.
 *
 * ATENÇÃO: isto NÃO é autenticação. Não há servidor, banco, token nem
 * verificação de credencial. O schema existe por dois motivos legítimos:
 * dar mensagens de erro decentes no formulário e revalidar o que vem do
 * localStorage (regra 6 do projeto) antes de confiar no dado.
 *
 * A senha é validada apenas como "não vazia" e nunca sai deste módulo:
 * não é comparada, não é derivada e não é persistida em lugar nenhum.
 */

import { z } from "zod";

export const credenciaisSchema = z.object({
  email: z
    .string({ error: "Informe o e-mail de acesso." })
    .trim()
    .min(1, { message: "Informe o e-mail de acesso." })
    .max(160, { message: "E-mail muito longo." })
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), {
      message: "Informe um e-mail em formato válido, como nome@escritorio.com.br.",
    }),
  senha: z
    .string({ error: "Informe a senha." })
    .min(1, { message: "Informe a senha." })
    .max(200, { message: "Senha muito longa." }),
  lembrar: z.boolean().optional(),
});

export type Credenciais = z.infer<typeof credenciaisSchema>;

/** Sessão demonstrativa gravada no aparelho. Sem senha, por definição. */
export const sessaoDemoSchema = z.object({
  email: z.string().trim().min(3).max(160),
  iniciadaEm: z.string().min(1),
});

export type SessaoDemo = z.infer<typeof sessaoDemoSchema>;
