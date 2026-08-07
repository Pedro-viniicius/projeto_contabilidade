"use client";

import { useEffect, useState } from "react";
import { registrarEvento } from "@/lib/analytics";

/** Evento não padronizado, suportado por navegadores Chromium. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Instalação do PWA, discreta no rodapé da navegação.
 * Só aparece quando o navegador sinaliza que a instalação é possível.
 */
export function BotaoInstalar() {
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const aoDisponibilizar = (e: Event) => {
      e.preventDefault();
      setEvento(e as BeforeInstallPromptEvent);
    };
    const aoInstalar = () => setEvento(null);

    window.addEventListener("beforeinstallprompt", aoDisponibilizar);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", aoDisponibilizar);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  if (!evento) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        registrarEvento("pwa_install_clicked");
        await evento.prompt();
        await evento.userChoice;
        setEvento(null);
      }}
      className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-[0.8125rem] text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
    >
      <span aria-hidden="true">⬇</span> Instalar aplicativo
    </button>
  );
}
