/**
 * Aviso de caráter informativo.
 * Presente e legível, mas discreto — a intenção é ser honesto sem
 * destruir a confiança no produto.
 */
export function AvisoContabil({ className }: { className?: string }) {
  return (
    <p
      className={[
        "flex items-start gap-2 text-sm leading-relaxed text-ink-muted",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span aria-hidden="true" className="mt-0.5 shrink-0">
        ℹ️
      </span>
      <span>
        Esta simulação possui caráter informativo e utiliza premissas
        simplificadas. Consulte um contador para decisões fiscais ou
        tributárias.
      </span>
    </p>
  );
}
