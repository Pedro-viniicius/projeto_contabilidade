"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { IconeNovaAnalise } from "@/components/ui/icone";
import { novaAnaliseDescartaTrabalho } from "./acoes-analise";

/**
 * "Nova análise" — a ação que abre uma análise separada da atual.
 *
 * Componente único, hoje usado em um lugar só — a barra superior.
 * Concentrar a ação primária num ponto fixo e previsível vale mais que
 * repeti-la: dois botões idênticos na mesma tela obrigam a decidir
 * qual clicar antes de decidir o que fazer.
 *
 * A distinção que precisa ficar óbvia antes do clique:
 *
 * - **Recalcular análise** atualiza a análise aberta;
 * - **Nova análise** começa outra, com identidade própria.
 *
 * A confirmação é condicional e some quando não há o que perder — ver
 * `novaAnaliseDescartaTrabalho`. Confirmar o inofensivo é o que ensina
 * a confirmar sem ler.
 */
export function BotaoNovaAnalise({
  jaCalculou,
  desatualizado,
  temValoresPreenchidos,
  onNovaAnalise,
  tamanho = "sm",
  variante = "primaria",
  className,
}: {
  jaCalculou: boolean;
  desatualizado: boolean;
  temValoresPreenchidos: boolean;
  onNovaAnalise: () => void;
  tamanho?: "sm" | "md";
  variante?: "primaria" | "secundaria" | "sutil";
  className?: string;
}) {
  const [pediuConfirmacao, setPediuConfirmacao] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const gatilhoRef = useRef<HTMLButtonElement>(null);
  const confirmarRef = useRef<HTMLButtonElement>(null);

  const precisaConfirmar = novaAnaliseDescartaTrabalho({
    jaCalculou,
    desatualizado,
    temValoresPreenchidos,
  });

  /*
   * Estado derivado, não sincronizado por efeito: se o contador
   * recalcular com a confirmação aberta, ela deixa de ter motivo e
   * some no mesmo render — sem cascata e sem um instante em que a
   * pergunta na tela já não corresponde ao estado da análise.
   */
  const confirmando = pediuConfirmacao && precisaConfirmar;

  useEffect(() => {
    if (!confirmando) return;

    confirmarRef.current?.focus();

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      /* Não deixa o Escape vazar para o painel lateral que possa estar
         atrás: aqui ele cancela a confirmação, e só isso. */
      e.stopPropagation();
      setPediuConfirmacao(false);
      gatilhoRef.current?.focus();
    };
    const aoClicarFora = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setPediuConfirmacao(false);
      }
    };

    document.addEventListener("keydown", aoTeclar, true);
    document.addEventListener("mousedown", aoClicarFora);
    return () => {
      document.removeEventListener("keydown", aoTeclar, true);
      document.removeEventListener("mousedown", aoClicarFora);
    };
  }, [confirmando]);

  return (
    <div ref={containerRef} className="relative">
      <Button
        ref={gatilhoRef}
        type="button"
        tamanho={tamanho}
        variante={variante}
        aria-expanded={precisaConfirmar ? confirmando : undefined}
        className={className}
        onClick={() => {
          if (precisaConfirmar) setPediuConfirmacao((a) => !a);
          else onNovaAnalise();
        }}
      >
        <IconeNovaAnalise />
        Nova análise
      </Button>

      {confirmando && (
        <div
          role="alertdialog"
          aria-modal="false"
          aria-label="Confirmar nova análise"
          className="absolute right-0 top-[calc(100%+0.375rem)] z-50 w-72 rounded-md border border-border-base bg-surface p-3 shadow-[0_8px_24px_rgba(0,0,0,0.16)]"
        >
          <p className="text-[0.75rem] leading-snug text-ink-muted">
            {jaCalculou
              ? "As alterações feitas depois do último cálculo não foram salvas e serão perdidas. A análise calculada continua no histórico."
              : "Os valores digitados ainda não foram calculados e não estão no histórico. Começar outra análise apaga o que está nos campos."}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Button
              ref={confirmarRef}
              type="button"
              tamanho="sm"
              onClick={() => {
                setPediuConfirmacao(false);
                onNovaAnalise();
              }}
            >
              Começar nova análise
            </Button>
            <Button
              type="button"
              tamanho="sm"
              variante="sutil"
              onClick={() => {
                setPediuConfirmacao(false);
                gatilhoRef.current?.focus();
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
