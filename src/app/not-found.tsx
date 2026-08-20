import { ButtonLink } from "@/components/ui/button";
import { Painel } from "@/components/ui/painel";

export default function NaoEncontrado() {
  return (
    <main id="conteudo" className="mx-auto max-w-[1100px] px-4 py-5 sm:px-6">
      <Painel className="px-4 py-12 text-center">
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
