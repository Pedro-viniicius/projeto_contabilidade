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

export function iniciarSessaoDemo(email: string, lembrar = false): SessaoDemo {
  const sessao: SessaoDemo = {
    email: email.trim(),
    iniciadaEm: new Date().toISOString(),
  };
  gravarJson(CHAVE_SESSAO, sessao);
  /* Só o e-mail, e só quando pedido. Senha nunca é gravada. */
  if (lembrar) gravarJson(CHAVE_EMAIL_LEMBRADO, sessao.email);
  else remover(CHAVE_EMAIL_LEMBRADO);
  return sessao;
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
