import type { MetadataRoute } from "next";

/** Gerado pelo Next em /manifest.webmanifest. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Clareza — simulador tributário para contadores",
    short_name: "Clareza",
    description:
      "Compare cenários Pessoa Física e CNPJ, veja o impacto mensal e anual e audite as premissas de cálculo.",
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    /* Sem travar orientação: a área de trabalho é desktop-first. */
    background_color: "#f6f7f8",
    theme_color: "#0e7c66",
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
        name: "Nova simulação",
        short_name: "Simular",
        url: "/simulacao",
      },
      {
        name: "Premissas de cálculo",
        short_name: "Premissas",
        url: "/premissas",
      },
    ],
  };
}
