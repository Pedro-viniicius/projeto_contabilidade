/**
 * URL pública do site, usada em metadata, Open Graph, robots e sitemap.
 *
 * Resolvida em tempo de build, na ordem:
 *  1. NEXT_PUBLIC_SITE_URL — domínio próprio, quando houver;
 *  2. VERCEL_PROJECT_PRODUCTION_URL — domínio de produção do projeto;
 *  3. VERCEL_URL — URL única do deploy (preview);
 *  4. localhost, em desenvolvimento.
 *
 * Assim um deploy funciona com metadados corretos sem configurar nada.
 * Este módulo é importado apenas por código de servidor (layout, robots,
 * sitemap), então as variáveis sem prefixo NEXT_PUBLIC_ são acessíveis.
 */
function resolverUrlBase(): string {
  const explicita = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicita) return explicita.replace(/\/$/, "");

  const producao = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (producao) return `https://${producao}`;

  const deploy = process.env.VERCEL_URL;
  if (deploy) return `https://${deploy}`;

  return "http://localhost:3000";
}

export const URL_BASE = resolverUrlBase();

/** Deploys de preview não devem ser indexados por buscadores. */
export const EH_PRODUCAO =
  process.env.VERCEL_ENV === undefined || process.env.VERCEL_ENV === "production";
