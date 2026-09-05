import type { ReactNode } from "react";

export type NivelMensagem = "erro" | "atencao" | "informacao" | "sucesso";

/*
 * Marcador + cor, sempre os dois. A cor reforça; quem carrega o
 * significado é o símbolo e o texto — em monocromático, ou para quem
 * não distingue as cores, a leitura continua inteira.
 */
const ESTILO: Record<NivelMensagem, { marcador: string; classe: string }> = {
  erro: { marcador: "⚠", classe: "text-negativo" },
  atencao: { marcador: "⚠", classe: "text-atencao" },
  informacao: { marcador: "ⓘ", classe: "text-ink-muted" },
  sucesso: { marcador: "✓", classe: "text-ink-muted" },
};

/**
 * Linha de estado — erro, conferência, informação ou confirmação.
 *
 * Existe para que os quatro níveis tenham sempre a mesma forma: até a
 * v2.3 cada um era escrito à mão no componente onde aparecia, e o
 * mesmo tipo de mensagem mudava de símbolo e de tom conforme o arquivo.
 */
export function MensagemStatus({
  nivel,
  children,
  id,
  papel,
  className,
}: {
  nivel: NivelMensagem;
  children: ReactNode;
  id?: string;
  /** `alert` para erro de campo; `status` para o que apenas informa. */
  papel?: "alert" | "status";
  className?: string;
}) {
  const { marcador, classe } = ESTILO[nivel];
  return (
    <p
      id={id}
      role={papel}
      className={[
        "flex items-start gap-1.5 text-[0.75rem] leading-snug",
        classe,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span aria-hidden="true" className="shrink-0">
        {marcador}
      </span>
      <span className="min-w-0">{children}</span>
    </p>
  );
}
