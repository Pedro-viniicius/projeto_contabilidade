import { ButtonLink } from "@/components/ui/button";

export default function NaoEncontrado() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <p className="text-sm font-medium text-accent">Erro 404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Página não encontrada
      </h1>
      <p className="mt-3 leading-relaxed text-ink-muted">
        O endereço que você tentou abrir não existe por aqui.
      </p>
      <ButtonLink href="/" tamanho="lg" className="mt-7">
        Ir para o início
      </ButtonLink>
    </div>
  );
}
