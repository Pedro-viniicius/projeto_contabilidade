"use client";

import { useEffect } from "react";

/**
 * Registra o service worker depois que a página carrega, para não
 * competir com o carregamento inicial. Falha em silêncio: o app precisa
 * funcionar mesmo sem suporte a service worker (progressive enhancement).
 */
export function RegistrarServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const registrar = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* Sem service worker o app segue funcionando online. */
      });
    };

    if (document.readyState === "complete") {
      registrar();
      return;
    }
    window.addEventListener("load", registrar);
    return () => window.removeEventListener("load", registrar);
  }, []);

  return null;
}
