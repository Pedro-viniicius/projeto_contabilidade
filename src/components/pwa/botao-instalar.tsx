"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { registrarEvento } from "@/lib/analytics";

/** Evento não padronizado, suportado por navegadores Chromium. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Botão discreto de instalação.
 * Só aparece quando o navegador sinaliza que a instalação é possível —
 * nada de banner agressivo ou instrução para quem não pode instalar.
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
    <Button
      variante="secundaria"
      onClick={async () => {
        registrarEvento("pwa_install_clicked");
        await evento.prompt();
        await evento.userChoice;
        setEvento(null);
      }}
    >
      <span aria-hidden="true">⬇</span> Instalar aplicativo
    </Button>
  );
}
