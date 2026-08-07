import type { ReactNode } from "react";

/**
 * Contêiner de rolagem horizontal para tabelas largas.
 *
 * `relative` não é decorativo: sem um ancestral posicionado, elementos
 * `position:absolute` — como todo texto `sr-only` (legendas de tabela,
 * descrições de marcadores) — escapam do recorte da rolagem e ancoram no
 * documento, criando rolagem horizontal na página inteira. Isso quebrou o
 * layout em 390px. Posicionando o contêiner, eles voltam a ser recortados
 * aqui dentro.
 */
export function AreaRolavel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={["relative overflow-x-auto", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
