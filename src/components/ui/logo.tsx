/** Marca do produto: três barras ascendentes dentro de um quadrado. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <g fill="var(--sobre-acento)">
        <rect x="8" y="18" width="4" height="7" rx="1.4" />
        <rect x="14" y="13" width="4" height="12" rx="1.4" />
        <rect x="20" y="7" width="4" height="18" rx="1.4" />
      </g>
    </svg>
  );
}
