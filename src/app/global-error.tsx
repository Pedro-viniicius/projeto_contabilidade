"use client";

/**
 * Última fronteira: erro no próprio layout raiz.
 *
 * Substitui o documento inteiro, então precisa trazer `<html>` e
 * `<body>` e não pode depender do CSS da aplicação — que pode ser
 * justamente o que falhou. Por isso o estilo aqui é mínimo e inline,
 * e as cores acompanham o esquema do aparelho.
 *
 * Não oferece limpeza de dados: nesta altura não há garantia de que os
 * módulos da aplicação carregaram. Recarregar é a única ação segura.
 */
export default function ErroGlobal({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "Canvas",
          color: "CanvasText",
          colorScheme: "light dark",
        }}
      >
        <main style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>
            O Clareza não conseguiu carregar
          </h1>
          <p
            style={{
              fontSize: "0.8125rem",
              lineHeight: 1.6,
              margin: "0.5rem 0 1.25rem",
              opacity: 0.75,
            }}
          >
            Nenhum dado foi enviado a servidor: o cálculo é local. Recarregue a
            página para tentar de novo.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: "2.25rem",
              padding: "0 1rem",
              borderRadius: "0.375rem",
              border: "1px solid currentColor",
              background: "transparent",
              color: "inherit",
              font: "inherit",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Recarregar
          </button>
        </main>
      </body>
    </html>
  );
}
