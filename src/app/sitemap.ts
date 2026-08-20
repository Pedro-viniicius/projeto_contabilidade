import type { MetadataRoute } from "next";
import { URL_BASE } from "@/lib/site";

/*
 * Só as duas rotas reais entram. A área de trabalho depende de dados
 * locais do aparelho e não tem o que oferecer a um buscador.
 */
const ROTAS = [
  { caminho: "/", prioridade: 1 },
  { caminho: "/login", prioridade: 0.8 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const agora = new Date();
  return ROTAS.map(({ caminho, prioridade }) => ({
    url: `${URL_BASE}${caminho}`,
    lastModified: agora,
    changeFrequency: "monthly" as const,
    priority: prioridade,
  }));
}
