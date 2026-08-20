import type { ReactNode } from "react";

/**
 * Indicador numérico da área de trabalho.
 *
 * Escala contida de propósito: o contador lê vários números em
 * sequência e compara entre si. Um "número herói" gigante ajuda quem
 * vê a tela uma vez e atrapalha quem trabalha nela o dia todo.
 */
export function Metrica({
  rotulo,
  valor,
  apoio,
  enfase,
}: {
  rotulo: string;
  valor: ReactNode;
  apoio?: ReactNode;
  /** Reserva o maior peso visual para o número que responde à pergunta. */
  enfase?: boolean;
}) {
  return (
    <div className="px-4 py-2.5">
      <p className="rotulo-secao">{rotulo}</p>
      <p
        className={`tnum mt-1 leading-tight text-ink ${
          enfase
            ? "text-[1.0625rem] font-semibold"
            : "text-[0.9375rem] font-medium"
        }`}
      >
        {valor}
      </p>
      {apoio && (
        <p className="tnum mt-0.5 text-[0.75rem] leading-snug text-ink-muted">
          {apoio}
        </p>
      )}
    </div>
  );
}
