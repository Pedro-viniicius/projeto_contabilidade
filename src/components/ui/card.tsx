import type { ComponentProps, ReactNode } from "react";

export function Card({
  className,
  children,
  ...props
}: ComponentProps<"section"> & { children: ReactNode }) {
  return (
    <section
      className={[
        "rounded-2xl border border-border-base bg-surface p-5 sm:p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardTitulo({
  children,
  as: Tag = "h2",
}: {
  children: ReactNode;
  as?: "h2" | "h3";
}) {
  return (
    <Tag className="text-lg font-semibold tracking-tight text-ink">
      {children}
    </Tag>
  );
}

export function CardDescricao({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm text-ink-muted">{children}</p>;
}
