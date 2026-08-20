import { z } from "zod";

/**
 * Categorias pensadas para a revisão com o contador — cada uma vira um
 * tipo de ajuste diferente no backlog.
 */
export const CATEGORIAS_FEEDBACK = [
  { valor: "calculo-incorreto", rotulo: "Cálculo incorreto" },
  { valor: "termo-confuso", rotulo: "Termo confuso" },
  { valor: "campo-faltando", rotulo: "Falta um campo importante" },
  { valor: "campo-desnecessario", rotulo: "Campo desnecessário" },
  { valor: "premissa-errada", rotulo: "Premissa contábil errada" },
  { valor: "usabilidade", rotulo: "Problema de usabilidade" },
  { valor: "sugestao", rotulo: "Sugestão" },
  { valor: "outro", rotulo: "Outro" },
] as const;

export const categoriaFeedbackSchema = z.enum(
  CATEGORIAS_FEEDBACK.map((c) => c.valor) as [string, ...string[]],
  { error: "Escolha o tipo do feedback." },
);

export const feedbackSchema = z.object({
  categoria: categoriaFeedbackSchema,
  mensagem: z
    .string({ error: "Escreva o que você observou." })
    .trim()
    .min(10, { message: "Escreva pelo menos 10 caracteres." })
    .max(2000, { message: "Mensagem muito longa (máximo de 2.000 caracteres)." }),
  /* Opcional: sem cadastro, sem obrigar identificação. */
  contato: z
    .string()
    .trim()
    .max(120, { message: "Contato muito longo." })
    .optional()
    .or(z.literal("")),
});

export type EntradaFeedback = z.infer<typeof feedbackSchema>;

/**
 * Registro persistido completo.
 *
 * Mesma regra do histórico de simulações: o que vem do aparelho é
 * `unknown` até passar por schema. Antes da v2.1.1 só os campos de
 * formulário eram revalidados, e a interface lia `contexto.versaoRegras`
 * de um objeto que podia não existir.
 */
export const feedbackRegistradoSchema = z.object({
  id: z.string().min(1).max(120),
  criadoEm: z
    .string()
    .min(1)
    .refine((v) => Number.isFinite(new Date(v).getTime()), {
      message: "Data do registro é inválida.",
    }),
  categoria: categoriaFeedbackSchema,
  mensagem: z.string().min(1).max(2000),
  contato: z.string().max(120).optional(),
  contexto: z.object({
    versaoRegras: z.string().min(1).max(60),
    rota: z.string().max(200),
    entradaSimulacao: z.unknown().nullable(),
  }),
});
