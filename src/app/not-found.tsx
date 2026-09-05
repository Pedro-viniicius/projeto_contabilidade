import { ButtonLink } from "@/components/ui/button";
import { Painel } from "@/components/ui/painel";

export default function NaoEncontrado() {
  return (
    /* Telas de estado ficam centradas na janela: um painel colado no
       topo de uma área vazia parece carregamento interrompido. */
    <main
      id="conteudo"
      className="mx-auto flex min-h-dvh max-w-[34rem] flex-col justify-center px-4 py-8 sm:px-6"
    >
      <Painel className="px-5 py-8 text-center">
        <p className="rotulo-secao">Erro 404</p>
        <h1 className="mt-1.5 text-base font-semibold tracking-tight text-ink">
          Página não encontrada
        </h1>
        <p className="mx-auto mt-1.5 max-w-md text-[0.8125rem] text-ink-muted">
          O endereço acessado não existe nesta aplicação.
        </p>
        <ButtonLink href="/workspace" className="mt-5">
          Ir para a área de trabalho
        </ButtonLink>
      </Painel>
    </main>
  );
}
