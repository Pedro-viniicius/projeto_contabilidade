"use client";

import { Button } from "@/components/ui/button";
import { formatarMoeda } from "@/lib/format";
import { useHidratado, useValorLocal } from "@/lib/armazenamento-reativo";
import { simular } from "../domain/calcular";
import {
  CHAVE_HISTORICO,
  lerHistorico,
  removerDoHistorico,
} from "../services/simulacao-storage";

const horaCurta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Análises recentes do aparelho, dentro da própria área de trabalho.
 *
 * Abrir um registro não navega: repõe os valores no formulário ao lado
 * e recalcula na hora. Serve ao uso repetido de uma sessão de trabalho
 * — alternar entre cenários de clientes sem redigitar. Não é cadastro
 * de clientes: é histórico local e descartável.
 */
export function HistoricoSimulacoes({
  idAtual,
  onAbrir,
}: {
  /** Registro atualmente em edição, destacado na lista. */
  idAtual?: string | null;
  onAbrir: (id: string) => void;
}) {
  const hidratado = useHidratado();
  const historico = useValorLocal(CHAVE_HISTORICO, lerHistorico) ?? [];

  if (!hidratado) {
    return (
      <p className="px-3 py-3 text-[0.8125rem] text-ink-muted" role="status">
        Carregando…
      </p>
    );
  }

  if (historico.length === 0) {
    return (
      <p className="px-3 py-3 text-[0.8125rem] leading-snug text-ink-muted">
        Nenhuma análise neste aparelho ainda. As que você calcular ficam
        listadas aqui para retomar sem redigitar os valores.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--border)]">
      {historico.map((registro) => {
        const s = simular(registro.entrada);
        const atual = registro.id === idAtual;
        return (
          <li
            key={registro.id}
            className={`px-3 py-2.5 ${atual ? "bg-accent-soft/60" : ""}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-ink">
                {registro.referencia ?? "Sem referência"}
              </p>
              <span className="shrink-0 text-[0.6875rem] text-ink-subtle">
                {horaCurta.format(new Date(registro.criadaEm))}
              </span>
            </div>

            <p className="tnum mt-0.5 text-[0.75rem] text-ink-muted">
              {formatarMoeda(registro.entrada.receitaMensal)} ·{" "}
              {registro.entrada.tipoAtuacao === "cnpj"
                ? "CNPJ"
                : "Pessoa Física"}
            </p>

            <dl className="mt-1.5 grid grid-cols-2 gap-x-3 text-[0.75rem]">
              <div className="flex items-baseline justify-between gap-1.5">
                <dt className="text-ink-subtle">PF</dt>
                <dd className="tnum text-ink">
                  {formatarMoeda(s.comparacao.pessoaFisica.liquidoMensal)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-1.5">
                <dt className="text-ink-subtle">CNPJ</dt>
                <dd className="tnum text-ink">
                  {formatarMoeda(s.comparacao.cnpj.liquidoMensal)}
                </dd>
              </div>
            </dl>

            <div className="mt-1.5 flex items-center gap-1">
              <Button
                tamanho="sm"
                variante="secundaria"
                onClick={() => onAbrir(registro.id)}
              >
                {atual ? "Em edição" : "Abrir"}
              </Button>
              <Button
                tamanho="sm"
                variante="sutil"
                onClick={() => removerDoHistorico(registro.id)}
              >
                <span aria-hidden="true">✕</span>
                <span className="sr-only">
                  Remover análise {registro.referencia ?? "sem referência"}
                </span>
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
