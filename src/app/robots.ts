import type { MetadataRoute } from "next";
import { EH_PRODUCAO, URL_BASE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  /* Deploys de preview ficam fora dos buscadores para não competir
     com o domínio de produção nem indexar versão em validação. */
  if (!EH_PRODUCAO) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      /* Páginas dependentes de dados locais não têm valor em busca. */
      disallow: ["/resultado", "/offline"],
    },
    sitemap: `${URL_BASE}/sitemap.xml`,
  };
}
