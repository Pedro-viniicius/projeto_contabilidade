
/**
 * Service worker do Clareza.
 *
 * Estratégia deliberadamente simples (KISS), sem Workbox:
 *  - navegações: network-first com fallback para cache e, por último,
 *    para a página /offline;
 *  - estáticos imutáveis do Next (/_next/static): cache-first;
 *  - demais requisições: passam direto.
 *
 * Nada de cachear POST, chamadas de API ou dados do usuário.
 */

/* Bump obrigatório a cada mudança de casca: sem isso o usuário que já
   instalou continua vendo a interface antiga vinda do cache. */
const VERSAO = "clareza-v2-3-0";
const CACHE_SHELL = `${VERSAO}-shell`;
const CACHE_ESTATICOS = `${VERSAO}-estaticos`;

/**
 * Casca mínima que garante o app utilizável offline.
 *
 * Com a consolidação em tela única sobrou pouca coisa: acesso, área de
 * trabalho e o aviso de indisponibilidade. Premissas, histórico,
 * auditoria e feedback deixaram de ser rotas — vivem dentro da área de
 * trabalho e são cobertos pelo mesmo documento em cache.
 *
 * Uma sessão demonstrativa existente continua valendo offline: ela vive
 * no localStorage e o cálculo é local. Nenhuma senha é gravada nem
 * cacheada — não há requisição de autenticação para interceptar.
 */
const SHELL = [
  "/login",
  "/workspace",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) =>
      /* addAll falha inteiro se um item falhar; add individual é tolerante. */
      Promise.all(SHELL.map((url) => cache.add(url).catch(() => undefined))),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(
          chaves
            .filter((chave) => !chave.startsWith(VERSAO))
            .map((chave) => caches.delete(chave)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(navegacao(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons")) {
    event.respondWith(cachePrimeiro(request));
  }
});

async function navegacao(request) {
  try {
    const resposta = await fetch(request);
    if (resposta.ok) {
      const cache = await caches.open(CACHE_SHELL);
      cache.put(request, resposta.clone());
    }
    return resposta;
  } catch {
    const cache = await caches.open(CACHE_SHELL);
    const emCache = await cache.match(request);
    if (emCache) return emCache;
    const offline = await cache.match("/offline");
    if (offline) return offline;
    return new Response("Você está offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function cachePrimeiro(request) {
  const cache = await caches.open(CACHE_ESTATICOS);
  const emCache = await cache.match(request);
  if (emCache) return emCache;
  try {
    const resposta = await fetch(request);
    if (resposta.ok) cache.put(request, resposta.clone());
    return resposta;
  } catch {
    return new Response("", { status: 504 });
  }
}
