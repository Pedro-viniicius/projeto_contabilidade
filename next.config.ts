import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança aplicados a todas as rotas.
 * O app não faz requisição a terceiros nem embute conteúdo externo,
 * então a política pode ser restritiva sem quebrar nada.
 */
const cabecalhosSeguranca = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/:path*", headers: cabecalhosSeguranca },
      {
        /* O service worker precisa ser revalidado a cada carga, senão
           uma versão antiga do cache fica presa no navegador. */
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
