/**
 * Sessão demonstrativa — armazenamento local, sem back-end.
 *
 * O que existe aqui é uma marca no aparelho dizendo "alguém entrou pela
 * tela de acesso". Não há verificação de identidade, expiração nem
 * segredo: qualquer pessoa com acesso ao navegador pode gravar a mesma
 * marca pelo console. É proposital — a tela de acesso é protótipo de
 * experiência, não controle de segurança.
 *
 * Quando houver autenticação real, apenas este módulo muda: as funções
 * abaixo passam a falar com a API e o resto da aplicação continua igual.
 */

import { gravarJson, lerJson, remover } from "@/lib/storage";
import { sessaoDemoSchema, type SessaoDemo } from "../schemas/sessao-schema";

export const CHAVE_SESSAO = "clareza:demo:sessao";
export const CHAVE_EMAIL_LEMBRADO = "clareza:demo:email";

/** Nome exibido, derivado do e-mail. Nada é inventado além disso. */
export function nomeExibido(email: string): string {
  const local = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  if (!local) return "Contador";
  return local
    .split(/\s+/)
    .map((p) => p.charAt(0).toLocaleUpperCase("pt-BR") + p.slice(1))
    .join(" ");
}

/** Resultado de abrir a sessão demonstrativa neste aparelho. */
export type AberturaSessao =
  | { readonly sucesso: true; readonly sessao: SessaoDemo }
  | { readonly sucesso: false; readonly motivo: "sem-espaco" | "indisponivel" };

/**
 * Abre a sessão demonstrativa.
 *
 * A marca de sessão vive no aparelho: se a gravação falhar, não há
 * sessão nenhuma. Antes da v2.1.1 o retorno era ignorado, a tela
 * navegava para a área de trabalho e a área de trabalho devolvia o
 * contador para o acesso — um laço sem explicação.
 */
export function iniciarSessaoDemo(
  email: string,
  lembrar = false,
): AberturaSessao {
  const sessao: SessaoDemo = {
    email: email.trim(),
    iniciadaEm: new Date().toISOString(),
  };

  const gravacao = gravarJson(CHAVE_SESSAO, sessao);
  if (!gravacao.sucesso) return { sucesso: false, motivo: gravacao.motivo };

  /* Só o e-mail, e só quando pedido. Senha nunca é gravada.
     Falhar aqui não impede o acesso: é conveniência, não sessão. */
  if (lembrar) gravarJson(CHAVE_EMAIL_LEMBRADO, sessao.email);
  else remover(CHAVE_EMAIL_LEMBRADO);

  return { sucesso: true, sessao };
}

/** Lê e revalida — dado de localStorage nunca é confiável. */
export function lerSessaoDemo(): SessaoDemo | null {
  const bruto = lerJson<unknown>(CHAVE_SESSAO);
  if (!bruto) return null;
  const resultado = sessaoDemoSchema.safeParse(bruto);
  if (!resultado.success) {
    remover(CHAVE_SESSAO);
    return null;
  }
  return resultado.data;
}

export function lerEmailLembrado(): string {
  const bruto = lerJson<unknown>(CHAVE_EMAIL_LEMBRADO);
  return typeof bruto === "string" ? bruto : "";
}

/** Encerra a sessão local. Não apaga simulações nem feedback. */
export function encerrarSessaoDemo(): void {
  remover(CHAVE_SESSAO);
}
