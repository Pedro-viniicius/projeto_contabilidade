"use client";

import { useEffect, useState } from "react";
import { registrarEvento } from "@/lib/analytics";

/** Evento não padronizado, suportado por navegadores Chromium. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Instalação do PWA, discreta na barra superior.
 * Só aparece quando o navegador sinaliza que a instalação é possível —
 * nunca é um botão que não faz nada.
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
      title="Instalar o Clareza neste aparelho"
      className="inline-flex size-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
    >
      <span aria-hidden="true" className="text-[0.875rem] leading-none">
        ⬇
      </span>
      <span className="sr-only">Instalar aplicativo</span>
    </button>
  );
}
