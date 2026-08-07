import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-base bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg"
          aria-label="Clareza — página inicial"
        >
          <Logo className="size-8" />
          <span className="text-[1.05rem] font-semibold tracking-tight text-ink">
            Clareza
          </span>
        </Link>

        <nav aria-label="Navegação principal">
          <ul className="flex items-center gap-1 text-sm">
            <li>
              <Link
                href="/como-funciona"
                className="inline-flex min-h-11 items-center rounded-lg px-3 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
              >
                Como funciona
              </Link>
            </li>
            <li>
              <Link
                href="/simulacao"
                className="inline-flex min-h-11 items-center rounded-lg px-3 font-medium text-accent transition-colors hover:bg-accent-soft"
              >
                Simular
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
