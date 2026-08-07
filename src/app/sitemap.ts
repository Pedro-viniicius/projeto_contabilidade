import type { MetadataRoute } from "next";
import { URL_BASE } from "@/lib/site";

const ROTAS = [
  { caminho: "/", prioridade: 1 },
  { caminho: "/simulacao", prioridade: 0.9 },
  { caminho: "/como-funciona", prioridade: 0.7 },
  { caminho: "/premissas", prioridade: 0.6 },
  { caminho: "/feedback", prioridade: 0.4 },
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
