import type { MetadataRoute } from "next";

/** Gerado pelo Next em /manifest.webmanifest. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Clareza — área de trabalho tributária para contadores",
    short_name: "Clareza",
    description:
      "Compare cenários Pessoa Física e CNPJ, audite a composição dos encargos e as premissas de cálculo em uma única tela.",
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/workspace",
    scope: "/",
    display: "standalone",
    /* Sem travar orientação: a área de trabalho é desktop-first. */
    /* Mesmos valores da paleta clara, que é o padrão do produto. */
    background_color: "#eceff0",
    theme_color: "#07765f",
    categories: ["finance", "business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Nova análise",
        short_name: "Analisar",
        url: "/workspace",
      },
      {
        name: "Análises recentes",
        short_name: "Histórico",
        url: "/workspace?painel=historico",
      },
      {
        name: "Premissas de cálculo",
        short_name: "Premissas",
        url: "/workspace?painel=premissas",
      },
    ],
  };
}
