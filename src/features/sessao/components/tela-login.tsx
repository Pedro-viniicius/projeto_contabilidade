"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { AlternarTema } from "@/components/tema/alternar-tema";
import { MensagemStatus } from "@/components/ui/mensagem-status";
import { useHidratado, useValorLocal } from "@/lib/armazenamento-reativo";
import {
  VERSAO_REGRAS,
  resumoValidacao,
} from "@/features/simulacao/domain/calculation-rules";
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
      /*
        Proporção 58/42. A apresentação fica sobre o FUNDO DA
        APLICAÇÃO e o acesso sobre a SUPERFÍCIE branca — a mesma
        relação de camadas que a área de trabalho usa do outro lado
        da porta. Até a v2.5 era o inverso, e a coluna de acesso
        parecia uma barra técnica cinza colada na borda da tela.
      */
      className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,58fr)_minmax(26rem,42fr)]"
    >
      {/* ================= ACESSO ================= */}
      {/*
        `order` inverte as zonas no celular. Quem já conhece o produto
        abre esta tela para entrar, e não deve precisar rolar uma
        apresentação para chegar ao campo.
      */}
      <section className="order-1 flex flex-col border-border-base bg-surface px-6 py-5 lg:order-2 lg:border-l lg:px-12 lg:py-7">
        <div className="flex items-center justify-between gap-3">
          {/* No desktop a marca vive na zona de apresentação. */}
          <span className="flex items-center gap-2.5 lg:invisible">
            <Logo className="size-7 shrink-0" />
            <span className="text-[0.9375rem] font-semibold tracking-tight text-ink">
              Clareza
            </span>
          </span>
          {/*
            O seletor de tema traz o próprio contorno e mostra as duas
            opções. Antes era um glifo solto num canto vazio, que não se
            lia como controle — parecia estado, ou pior, indicador de
            carregamento.
          */}
          <AlternarTema />
        </div>

        <div className="my-auto w-full max-w-[23rem] self-center py-8">
          {/*
            `.rotulo-secao` pode ser usado direto desde a v2.6: o token
            `--ink-subtle` foi elevado a 4,8:1 sobre superfície clara e
            passou a atender AA em texto pequeno. Antes disso este
            rótulo precisava reescrever a regra à mão — e a declaração
            de honestidade da tela é justamente o que não pode ficar
            ilegível.
          */}
          <p className="rotulo-secao">Ambiente de demonstração</p>
          <h1 className="mt-2 text-[1.25rem] font-semibold tracking-tight text-ink">
            Acesse sua área de trabalho
          </h1>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-muted">
            Suas análises ficam salvas neste navegador e não são
            sincronizadas entre aparelhos.
          </p>

          <form onSubmit={entrar} noValidate className="mt-7">
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
              className={`mt-1.5 min-h-10 w-full rounded-md border bg-surface px-3 text-[0.875rem] text-ink transition-colors duration-[140ms] placeholder:text-ink-subtle ${
                erroEmail
                  ? "border-negativo"
                  : "border-border-strong focus:border-accent"
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

            <div className="mt-4 flex items-center gap-2">
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
              className="mt-5 w-full"
            >
              {entrando ? "Entrando…" : "Entrar na demonstração"}
            </Button>
          </form>

          {/*
            O detalhe técnico existe e é verdadeiro, mas não é o que a
            tela precisa dizer primeiro. Fica atrás de uma revelação,
            para quem for procurar.
          */}
          <details className="group mt-6 border-t border-border-base pt-4">
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

        {/*
          Rodapé da coluna de acesso. Serve a duas coisas ao mesmo
          tempo: ancora o formulário, que sem ele flutuava no meio de
          uma superfície branca alta, e responde a uma pergunta real do
          contador — sob QUAIS regras este cálculo é feito. A versão
          vem do domínio; não há como a tela divergir do motor.
        */}
        <p className="tnum mt-auto text-[0.75rem] text-ink-subtle">
          Regras de cálculo {VERSAO_REGRAS}
        </p>
      </section>

      {/* ================= APRESENTAÇÃO ================= */}
      <section className="order-2 flex flex-col px-6 py-8 lg:order-1 lg:px-14 lg:py-7">
        <div className="hidden items-center gap-2.5 lg:flex">
          <Logo className="size-7 shrink-0" />
          <span className="text-[0.9375rem] font-semibold tracking-tight text-ink">
            Clareza
          </span>
        </div>

        {/*
          `my-auto` alinha a apresentação com o formulário ao lado, em
          vez de espalhá-la entre a borda de cima e a de baixo. A
          largura é contida em 30rem: sem isso o texto se esticava por
          uma coluna de 800px e a tela virava uma folha em branco com
          um parágrafo perdido no meio.
        */}
        <div className="w-full max-w-[32rem] lg:my-auto lg:py-8 xl:mx-auto">
          {/* `text-balance` evita a órfã "clareza." sozinha na segunda
              linha — a manchete é o primeiro contato com o produto. */}
          <h2 className="text-balance text-[1.5rem] font-semibold leading-[1.2] tracking-tight text-ink lg:text-[1.75rem]">
            Compare cenários tributários com clareza.
          </h2>
          <p className="mt-3 max-w-prose text-[0.875rem] leading-relaxed text-ink-muted">
            Preencha os dados uma vez, compare Pessoa Física e CNPJ lado a
            lado e entenda rapidamente o impacto no resultado do cliente.
          </p>

          {/*
            A NUMERAÇÃO É PARTE DA IDENTIDADE.

            "01 / 02 / 03" em numeral tabular, alinhados numa coluna
            própria, com um filete ligando um passo ao seguinte: é o
            mesmo vocabulário de precisão que a área de trabalho usa
            nas colunas de reais. Não são cartões — são passos.
          */}
          <ol className="mt-8 border-t border-border-base pt-7">
            {ETAPAS_DO_FLUXO.map((etapa, indice) => (
              <li key={etapa.numero} className="relative flex gap-4 pb-5 last:pb-0">
                {indice < ETAPAS_DO_FLUXO.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-1 left-[0.6875rem] top-6 w-px bg-border-strong"
                  />
                )}
                <span
                  aria-hidden="true"
                  className="tnum relative z-10 shrink-0 text-[0.8125rem] font-semibold tabular-nums text-accent"
                >
                  {String(etapa.numero).padStart(2, "0")}
                </span>
                <span className="min-w-0 pb-0.5">
                  <span className="block text-[0.875rem] font-semibold text-ink">
                    {etapa.titulo}
                  </span>
                  <span className="mt-1 block text-[0.8125rem] leading-snug text-ink-muted">
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

            Superfície de INFORMAÇÃO, não de alerta: fundo branco sobre
            o cinza da coluna, marcador "ⓘ" e nada de âmbar. Não há erro
            acontecendo — há um escopo a declarar.
          */}
          <div className="mt-8 rounded-md border border-border-base bg-surface px-4 py-3.5 shadow-sutil">
            <p className="flex items-center gap-2 text-[0.8125rem] font-semibold text-ink">
              <span aria-hidden="true" className="text-ink-subtle">
                ⓘ
              </span>
              {aviso.titulo}
            </p>
            <p className="mt-1.5 text-[0.75rem] leading-relaxed text-ink-muted">
              {aviso.texto}
            </p>
            <p className="tnum mt-2 border-t border-border-base pt-2 text-[0.75rem] leading-relaxed text-ink-muted">
              {aviso.detalhe}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
