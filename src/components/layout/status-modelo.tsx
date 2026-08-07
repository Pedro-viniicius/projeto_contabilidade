import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { resumoValidacao } from "@/features/simulacao/domain/calculation-rules";

/**
 * Situação de validação do modelo de cálculo.
 *
 * O número vem de `resumoValidacao()`, derivado das premissas reais —
 * assim que o contador marcar uma regra como validada, este indicador
 * muda sozinho. Nada aqui é escrito à mão.
 */
export function StatusModelo({ compacto }: { compacto?: boolean }) {
  const { pendentes, total } = resumoValidacao();
  const tudoValidado = pendentes === 0;

  if (compacto) {
    return (
      <Badge tom={tudoValidado ? "positivo" : "atencao"} ponto>
        {tudoValidado ? "Modelo validado" : `${pendentes} a validar`}
      </Badge>
    );
  }

  return (
    <Link
      href="/premissas"
      className="block rounded-md border border-border-base bg-surface p-2.5 transition-colors hover:bg-surface-hover"
    >
      <span className="rotulo-secao">Modelo de cálculo</span>
      <span className="mt-1.5 flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className={`size-2 shrink-0 rounded-full ${
            tudoValidado ? "bg-positivo" : "bg-atencao"
          }`}
        />
        <span className="text-[0.8125rem] font-medium text-ink">
          {tudoValidado ? "Validado" : "Em validação"}
        </span>
      </span>
      <span className="mt-0.5 block text-[0.75rem] leading-snug text-ink-subtle">
        {tudoValidado
          ? `${total} premissas revisadas`
          : `${pendentes} de ${total} premissas aguardam revisão contábil`}
      </span>
    </Link>
  );
}
