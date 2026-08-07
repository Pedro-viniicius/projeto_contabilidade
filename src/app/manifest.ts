import type { MetadataRoute } from "next";

/** Gerado pelo Next em /manifest.webmanifest. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Clareza — simulador financeiro",
    short_name: "Clareza",
    description:
      "Simule cenários financeiros como autônomo ou CNPJ e entenda quanto sobra no fim do mês.",
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafaf8",
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
    ],
  };
}
