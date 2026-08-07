import Link from "next/link";
import { AvisoContabil } from "@/components/ui/aviso-contabil";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border-base bg-surface-muted">
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-6">
        <AvisoContabil />
        <nav aria-label="Navegação do rodapé">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <li>
              <Link
                href="/como-funciona"
                className="text-ink-muted underline-offset-4 hover:text-ink hover:underline"
              >
                Como funciona
              </Link>
            </li>
            <li>
              <Link
                href="/premissas"
                className="text-ink-muted underline-offset-4 hover:text-ink hover:underline"
              >
                Premissas de cálculo
              </Link>
            </li>
            <li>
              <Link
                href="/feedback"
                className="text-ink-muted underline-offset-4 hover:text-ink hover:underline"
              >
                Enviar feedback
              </Link>
            </li>
          </ul>
        </nav>
        <p className="text-xs text-ink-subtle">
          Clareza — versão 1 (MVP). As premissas de cálculo ainda estão em
          validação contábil.
        </p>
      </div>
    </footer>
  );
}
