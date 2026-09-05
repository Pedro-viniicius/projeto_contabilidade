"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { AlternarTema } from "@/components/tema/alternar-tema";
import { MensagemStatus } from "@/components/ui/mensagem-status";
import { useHidratado, useValorLocal } from "@/lib/armazenamento-reativo";
import { resumoValidacao } from "@/features/simulacao/domain/calculation-rules";
import { acessoDemoSchema } from "../schemas/sessao-schema";
import { ETAPAS_DO_FLUXO, avisoDoModelo } from "./convite-acesso";
import {
  CHAVE_EMAIL_LEMBRADO,
  CHAVE_SESSAO,
  iniciarSessaoDemo,
  lerEmailLembrado,
  lerSessaoDemo,
} from "../services/sessao-demo";

/**
 * TELA DE ACESSO — a porta da área de trabalho, não uma vitrine.
 *
 * NÃO HÁ AUTENTICAÇÃO, e a tela passou a dizer isso pela forma, não só
 * por escrito. Até a v2.4 havia campo de senha: ela era validada como
 * "não vazia" e descartada em seguida, sem ser comparada, gravada ou
 * enviada. Um formulário assim ensina a coisa errada — cobra uma
 * credencial e devolve a impressão de que existe uma conta protegida
 * atrás dela. Foi removido.
 *
 * O e-mail continua sendo pedido porque tem uso real: dele sai o nome
 * que aparece no menu de conta da área de trabalho. É o único dado
 * necessário, e é o único pedido.
 *
 * As três zonas da tela:
 *
 *   ESQUERDA  o que o contador vai fazer aqui — o fluxo do produto em
 *             três passos, mais o escopo do modelo;
 *   DIREITA   entrar, em um campo;
 *   CELULAR   a ordem se inverte, porque quem volta não deve rolar uma
 *             apresentação para alcançar o acesso.
 */
export function TelaLogin() {
  const router = useRouter();
  const idEmail = useId();
  const idAjudaEmail = useId();
  const idLembrar = useId();
  const idEstado = useId();

  const hidratado = useHidratado();
  const sessao = useValorLocal(CHAVE_SESSAO, lerSessaoDemo);
  const emailLembrado = useValorLocal(CHAVE_EMAIL_LEMBRADO, lerEmailLembrado);

  /*
   * Rascunho sobre o valor lembrado, no mesmo padrão da área de
   * trabalho: enquanto o contador não digita, valem os dados do
   * aparelho. Evita semear o formulário por efeito, que provocaria
   * render em cascata e divergência de hidratação.
   */
  const [emailRascunho, setEmailRascunho] = useState<string | null>(null);
  const [lembrarRascunho, setLembrarRascunho] = useState<boolean | null>(null);
  const [erroEmail, setErroEmail] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  const email = emailRascunho ?? emailLembrado ?? "";
  const lembrar = lembrarRascunho ?? Boolean(emailLembrado);

  const emailRef = useRef<HTMLInputElement>(null);

  /* Já há sessão neste aparelho: não faz sentido pedir acesso de novo. */
  useEffect(() => {
    if (hidratado && sessao) router.replace("/workspace");
  }, [hidratado, sessao, router]);

  function entrar(e: React.FormEvent) {
    e.preventDefault();
    const resultado = acessoDemoSchema.safeParse({ email, lembrar });

    if (!resultado.success) {
      /* O que foi digitado permanece; o foco vai para o problema. */
      setErroEmail(resultado.error.issues[0]?.message ?? "Informe seu e-mail.");
      setErroGeral(null);
      emailRef.current?.focus();
      return;
    }

    const abertura = iniciarSessaoDemo(resultado.data.email, lembrar);

    /*
     * A sessão demonstrativa é uma marca no aparelho. Se ela não pôde
     * ser gravada, não há sessão — navegar mandaria o contador para a
     * área de trabalho, que o devolveria para cá, num laço sem
     * explicação. Melhor dizer o que aconteceu, em consequência e não
     * em exceção técnica.
     */
    if (!abertura.sucesso) {
      setErroGeral(
        abertura.motivo === "sem-espaco"
          ? "O armazenamento deste navegador está cheio e o acesso não pôde ser aberto. Libere espaço e tente de novo."
          : "Este navegador está bloqueando o armazenamento local, necessário para abrir a área de trabalho. Verifique se a navegação anônima ou o bloqueio de dados de site está ativo.",
      );
      return;
    }

    /*
     * Não há atraso artificial: o estado existe porque a navegação
     * leva um instante real, e nesse instante o botão não deve aceitar
     * um segundo clique.
     */
    setEntrando(true);
    router.replace("/workspace");
  }

  const aviso = avisoDoModelo(resumoValidacao());

  return (
    <main
      id="conteudo"
      className="grid min-h-dvh lg:grid-cols-[minmax(0,58fr)_minmax(25rem,42fr)]"
    >
      {/* ================= ACESSO ================= */}
      {/*
        `order` inverte as zonas no celular. Quem já conhece o produto
        abre esta tela para entrar, e não deve precisar rolar uma
        apresentação para chegar ao campo.
      */}
      <section className="order-1 flex flex-col px-6 py-6 lg:order-2 lg:px-10 lg:py-8">
        <div className="flex items-center justify-between gap-3">
          {/* No desktop a marca vive na zona de apresentação. */}
          <span className="flex items-center gap-2.5 lg:invisible">
            <Logo className="size-7 shrink-0" />
            <span className="text-[0.9375rem] font-semibold tracking-tight text-ink">
              Clareza
            </span>
          </span>
          {/*
            O controle de tema ganhou contorno. Sozinho num canto vazio
            o glifo não se lia como botão — parecia estado, ou pior,
            indicador de carregamento.
          */}
          <AlternarTema className="border border-border-base bg-surface" />
        </div>

        <div className="my-auto w-full max-w-[24rem] self-center py-10">
          {/*
            Mesma forma do `.rotulo-secao`, escrita à mão por um motivo:
            a classe global fixa `--ink-subtle`, que sobre o fundo claro
            mede 3,48:1 — abaixo do mínimo de 4,5:1 para texto pequeno.
            E, por não estar em `@layer`, ela venceria qualquer utilitária
            de cor aplicada por cima. Este rótulo é a declaração de
            honestidade da tela: tem de ser legível.
          */}
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-ink-muted">
            Ambiente de demonstração
          </p>
          <h1 className="mt-1.5 text-lg font-semibold tracking-tight text-ink">
            Acesse sua área de trabalho
          </h1>
          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-muted">
            Suas análises ficam salvas neste navegador e não são
            sincronizadas entre aparelhos.
          </p>

          <form onSubmit={entrar} noValidate className="mt-6">
            <label
              htmlFor={idEmail}
              className="block text-[0.8125rem] font-medium text-ink"
            >
              E-mail
            </label>
            <input
              ref={emailRef}
              id={idEmail}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(ev) => {
                setEmailRascunho(ev.target.value);
                setErroEmail(null);
                setErroGeral(null);
              }}
              aria-invalid={erroEmail ? true : undefined}
              aria-describedby={
                erroEmail ? `${idEmail}-erro ${idAjudaEmail}` : idAjudaEmail
              }
              placeholder="nome@escritorio.com.br"
              className={`mt-1 min-h-10 w-full rounded-md border bg-surface px-3 text-[0.875rem] text-ink placeholder:text-ink-subtle ${
                erroEmail ? "border-negativo" : "border-border-strong"
              }`}
            />
            {erroEmail && (
              <MensagemStatus
                nivel="erro"
                papel="alert"
                id={`${idEmail}-erro`}
                className="mt-1"
              >
                {erroEmail}
              </MensagemStatus>
            )}
            {/* Por que pedimos: o campo tem uso, e o uso é dito. */}
            <p
              id={idAjudaEmail}
              className="mt-1 text-[0.75rem] leading-snug text-ink-muted"
            >
              Usado apenas para identificar você na área de trabalho.
            </p>

            <div className="mt-3.5 flex items-center gap-2">
              <input
                id={idLembrar}
                type="checkbox"
                checked={lembrar}
                onChange={(ev) => setLembrarRascunho(ev.target.checked)}
                className="size-4 shrink-0 accent-[var(--accent)]"
              />
              <label
                htmlFor={idLembrar}
                className="text-[0.8125rem] text-ink-muted"
              >
                Lembrar meu e-mail neste navegador
              </label>
            </div>

            {erroGeral && (
              <MensagemStatus
                nivel="erro"
                papel="alert"
                id={idEstado}
                className="mt-3.5"
              >
                {erroGeral}
              </MensagemStatus>
            )}

            <Button
              type="submit"
              tamanho="lg"
              disabled={entrando}
              className="mt-4 w-full"
            >
              {entrando ? "Entrando…" : "Entrar na demonstração"}
            </Button>
          </form>

          {/*
            O detalhe técnico existe e é verdadeiro, mas não é o que a
            tela precisa dizer primeiro. Fica atrás de uma revelação,
            para quem for procurar.
          */}
          <details className="group mt-5 border-t border-border-base pt-4">
            <summary className="alvo-toque inline-flex cursor-pointer list-none items-center gap-1 rounded-sm text-[0.75rem] font-medium text-ink-muted hover:text-ink">
              <span
                aria-hidden="true"
                className="transition-transform group-open:rotate-90"
              >
                ›
              </span>
              Como funciona este acesso
            </summary>
            <p className="mt-2 text-[0.75rem] leading-relaxed text-ink-muted">
              Esta versão não tem servidor de autenticação nem cadastro:
              entrar apenas abre a área de trabalho neste navegador. Por
              isso não pedimos senha — ela não protegeria nada. Nenhum
              dado é enviado para fora do aparelho.
            </p>
          </details>
        </div>
      </section>

      {/* ================= APRESENTAÇÃO ================= */}
      <section className="order-2 flex flex-col border-t border-border-base bg-surface px-6 py-8 lg:order-1 lg:border-r lg:border-t-0 lg:px-12 lg:py-8">
        <div className="hidden items-center gap-2.5 lg:flex">
          <Logo className="size-7 shrink-0" />
          <span className="text-[0.9375rem] font-semibold tracking-tight text-ink">
            Clareza
          </span>
        </div>

        {/* `my-auto` alinha a apresentação com o formulário ao lado, em
            vez de espalhá-la entre a borda de cima e a de baixo. */}
        <div className="max-w-lg lg:my-auto lg:py-10">
          <h2 className="text-xl font-semibold leading-tight tracking-tight text-ink lg:text-2xl">
            Compare cenários tributários com clareza.
          </h2>
          <p className="mt-2.5 text-[0.875rem] leading-relaxed text-ink-muted">
            Preencha os dados uma vez, compare Pessoa Física e CNPJ lado a
            lado e entenda rapidamente o impacto no resultado do cliente.
          </p>

          <ol className="mt-7 space-y-4 border-t border-border-base pt-6">
            {ETAPAS_DO_FLUXO.map((etapa) => (
              <li key={etapa.numero} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="tnum mt-px inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[0.6875rem] font-semibold text-accent-ink"
                >
                  {etapa.numero}
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.8125rem] font-medium text-ink">
                    {etapa.titulo}
                  </span>
                  <span className="mt-0.5 block text-[0.8125rem] leading-snug text-ink-muted">
                    {etapa.apoio}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          {/*
            Escopo do modelo, junto da explicação do produto — não na
            borda inferior da tela. O contador assina o que apresenta
            ao cliente; o limite da ferramenta é parte do que ele
            precisa saber antes de entrar, não uma nota de rodapé.
          */}
          <div className="mt-7 rounded-md border border-border-base bg-surface-muted px-3.5 py-3">
            <p className="text-[0.8125rem] font-medium text-ink">
              {aviso.titulo}
            </p>
            <p className="mt-1 text-[0.75rem] leading-relaxed text-ink-muted">
              {aviso.texto}
            </p>
            <p className="mt-1.5 text-[0.75rem] leading-relaxed text-ink-muted">
              {aviso.detalhe}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
