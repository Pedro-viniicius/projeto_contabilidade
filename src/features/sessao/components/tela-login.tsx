"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { AlternarTema } from "@/components/tema/alternar-tema";
import { useHidratado, useValorLocal } from "@/lib/armazenamento-reativo";
import { credenciaisSchema } from "../schemas/sessao-schema";
import {
  CHAVE_EMAIL_LEMBRADO,
  CHAVE_SESSAO,
  iniciarSessaoDemo,
  lerEmailLembrado,
  lerSessaoDemo,
} from "../services/sessao-demo";

type Erros = { email?: string; senha?: string };

/**
 * Tela de acesso.
 *
 * PROTÓTIPO DE INTERFACE — não há autenticação. Nenhuma credencial é
 * verificada, enviada ou comparada: o formulário confere apenas o
 * formato do e-mail e se a senha foi preenchida, e então grava uma
 * marca local de sessão. A senha existe como campo para que o contador
 * avalie a experiência, e é descartada no submit.
 */
export function TelaLogin() {
  const router = useRouter();
  const idEmail = useId();
  const idSenha = useId();
  const idLembrar = useId();

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
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erros, setErros] = useState<Erros>({});

  const email = emailRascunho ?? emailLembrado ?? "";
  const lembrar = lembrarRascunho ?? Boolean(emailLembrado);

  const emailRef = useRef<HTMLInputElement>(null);
  const senhaRef = useRef<HTMLInputElement>(null);

  /* Já há sessão neste aparelho: não faz sentido pedir acesso de novo. */
  useEffect(() => {
    if (hidratado && sessao) router.replace("/workspace");
  }, [hidratado, sessao, router]);

  function entrar(e: React.FormEvent) {
    e.preventDefault();
    const resultado = credenciaisSchema.safeParse({ email, senha, lembrar });

    if (!resultado.success) {
      const novos: Erros = {};
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0] as keyof Erros;
        if (campo && !novos[campo]) novos[campo] = issue.message;
      }
      setErros(novos);
      /* Foco no primeiro campo com problema, sem apagar o que foi digitado. */
      (novos.email ? emailRef : senhaRef).current?.focus();
      return;
    }

    /* A senha morre aqui: não é gravada, derivada nem transmitida. */
    iniciarSessaoDemo(resultado.data.email, lembrar);
    setSenha("");
    router.replace("/workspace");
  }

  return (
    <main
      id="conteudo"
      className="grid min-h-dvh grid-rows-[1fr] lg:grid-cols-[minmax(0,1fr)_minmax(24rem,30rem)]"
    >
      {/* Apresentação. No celular vira um cabeçalho curto, não um banner. */}
      <section className="flex flex-col justify-between gap-8 border-b border-border-base bg-surface px-6 py-8 lg:border-b-0 lg:border-r lg:px-12 lg:py-12">
        <div className="flex items-center gap-2.5">
          <Logo className="size-7" />
          <span className="text-[0.9375rem] font-semibold tracking-tight text-ink">
            Clareza
          </span>
        </div>

        <div className="max-w-md">
          <h1 className="text-xl font-semibold leading-tight tracking-tight text-ink lg:text-2xl">
            Inteligência para decisões contábeis
          </h1>
          <p className="mt-2.5 text-[0.875rem] leading-relaxed text-ink-muted">
            Simule, compare e audite cenários de enquadramento em uma única
            área de trabalho. Cada número exibe a base de cálculo, a alíquota
            aplicada e o estágio de validação da premissa que o gerou.
          </p>

          <dl className="mt-6 grid gap-x-6 gap-y-3 border-t border-border-base pt-5 sm:grid-cols-2">
            {[
              ["Comparativo", "Pessoa Física × CNPJ lado a lado"],
              ["Auditoria", "Base × alíquota de cada encargo"],
              ["Premissas", "Status de validação sempre visível"],
              ["Histórico", "Simulações recentes do aparelho"],
            ].map(([rotulo, texto]) => (
              <div key={rotulo}>
                <dt className="rotulo-secao">{rotulo}</dt>
                <dd className="mt-0.5 text-[0.8125rem] leading-snug text-ink-muted">
                  {texto}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="hidden text-[0.75rem] leading-snug text-ink-subtle lg:block">
          Modelo de cálculo em validação contábil. Os resultados são
          estimativas de apoio à decisão, não apuração fiscal.
        </p>
      </section>

      {/* Acesso. */}
      <section className="flex flex-col px-6 py-8 lg:px-10 lg:py-12">
        <div className="flex justify-end">
          <AlternarTema />
        </div>

        <div className="my-auto w-full max-w-sm self-center py-8">
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Acesse sua conta
          </h2>
          <p className="mt-1 text-[0.8125rem] leading-snug text-ink-muted">
            Informe suas credenciais para abrir a área de trabalho.
          </p>

          <form onSubmit={entrar} noValidate className="mt-6 space-y-3.5">
            <div>
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
                onChange={(e) => {
                  setEmailRascunho(e.target.value);
                  setErros((a) => ({ ...a, email: undefined }));
                }}
                aria-invalid={erros.email ? true : undefined}
                aria-describedby={erros.email ? `${idEmail}-erro` : undefined}
                placeholder="nome@escritorio.com.br"
                className={`mt-1 min-h-10 w-full rounded-md border bg-surface px-3 text-[0.875rem] text-ink placeholder:text-ink-subtle ${
                  erros.email ? "border-negativo" : "border-border-strong"
                }`}
              />
              {erros.email && <Erro id={`${idEmail}-erro`}>{erros.email}</Erro>}
            </div>

            <div>
              <label
                htmlFor={idSenha}
                className="block text-[0.8125rem] font-medium text-ink"
              >
                Senha
              </label>
              <div
                className={`mt-1 flex items-center rounded-md border bg-surface pr-1 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ${
                  erros.senha ? "border-negativo" : "border-border-strong"
                }`}
              >
                <input
                  ref={senhaRef}
                  id={idSenha}
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    setErros((a) => ({ ...a, senha: undefined }));
                  }}
                  aria-invalid={erros.senha ? true : undefined}
                  aria-describedby={erros.senha ? `${idSenha}-erro` : undefined}
                  className="campo-composto min-h-10 w-full rounded-md bg-transparent px-3 text-[0.875rem] text-ink"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-pressed={mostrarSenha}
                  className="shrink-0 rounded-sm px-2 py-1 text-[0.75rem] font-medium text-ink-muted hover:text-ink"
                >
                  {mostrarSenha ? "Ocultar" : "Mostrar"}
                  <span className="sr-only"> senha</span>
                </button>
              </div>
              {erros.senha && <Erro id={`${idSenha}-erro`}>{erros.senha}</Erro>}
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <input
                id={idLembrar}
                type="checkbox"
                checked={lembrar}
                onChange={(e) => setLembrarRascunho(e.target.checked)}
                className="size-4 shrink-0 accent-[var(--accent)]"
              />
              <label
                htmlFor={idLembrar}
                className="text-[0.8125rem] text-ink-muted"
              >
                Lembrar meu e-mail neste aparelho
              </label>
            </div>

            <Button type="submit" tamanho="lg" className="w-full">
              Entrar
            </Button>
          </form>

          <div className="mt-6 border-t border-border-base pt-4">
            <p className="rotulo-secao">Ambiente demonstrativo</p>
            <p className="mt-1 text-[0.75rem] leading-relaxed text-ink-subtle">
              Esta versão não possui servidor de autenticação. O acesso apenas
              abre a área de trabalho neste navegador e a senha digitada é
              descartada — não é gravada nem enviada a lugar nenhum.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

/** Erro de campo: ícone + texto, nunca só cor. */
function Erro({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p
      id={id}
      role="alert"
      className="mt-1 flex items-start gap-1 text-[0.75rem] leading-snug text-negativo"
    >
      <span aria-hidden="true">⚠</span>
      <span>{children}</span>
    </p>
  );
}
