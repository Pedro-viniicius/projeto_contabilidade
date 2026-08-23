"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconeExcluir } from "@/components/ui/icone";
import { formatarMoeda } from "@/lib/format";
import { useHidratado, useValorLocal } from "@/lib/armazenamento-reativo";
import { simular } from "../domain/calcular";
import { VERSAO_REGRAS } from "../domain/calculation-rules";
import {
  CHAVE_HISTORICO,
  lerHistorico,
  removerDoHistorico,
} from "../services/simulacao-storage";
import {
  nomeAcessivelAbrir,
  nomeAcessivelExcluir,
  perguntaExclusao,
} from "./acoes-analise";

const horaCurta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Data curta do registro, tolerante a valor inválido.
 *
 * `Intl.DateTimeFormat.format` lança `RangeError` em data inválida, e
 * uma exceção no render derruba a área de trabalho inteira. O schema
 * de `simulacao-storage` já barra isso na fronteira; esta guarda é a
 * segunda camada, no mesmo espírito de `formatarData`.
 */
function horaDoRegistro(iso: string): string {
  const data = new Date(iso);
  return Number.isFinite(data.getTime()) ? horaCurta.format(data) : "—";
}

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
  /* Exclusão em dois passos, uma linha por vez — mesmo gesto da
     fronteira de erro: mostrar a consequência antes de executá-la. */
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const leitura = useValorLocal(CHAVE_HISTORICO, lerHistorico);
  const historico = leitura?.registros ?? [];
  const descartados = leitura?.descartados ?? 0;

  if (!hidratado) {
    return (
      <p className="px-3 py-3 text-[0.8125rem] text-ink-muted" role="status">
        Carregando…
      </p>
    );
  }

  if (historico.length === 0) {
    return (
      <>
        {descartados > 0 && <AvisoDescartados quantidade={descartados} />}
        <p className="px-3 py-3 text-[0.8125rem] leading-snug text-ink-muted">
          Nenhuma análise neste aparelho ainda. As que você calcular ficam
          listadas aqui para retomar sem redigitar os valores.
        </p>
      </>
    );
  }

  return (
    <>
      {descartados > 0 && <AvisoDescartados quantidade={descartados} />}
      <ul className="divide-y divide-[var(--border)]">
        {historico.map((registro) => {
          const s = simular(registro.entrada);
          const atual = registro.id === idAtual;
          const regraAntiga = registro.versaoRegras !== VERSAO_REGRAS;
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
                  {horaDoRegistro(registro.atualizadaEm ?? registro.criadaEm)}
                </span>
              </div>

              {/* "Em edição" é estado, não ação: virou etiqueta. Antes
                  era o rótulo de um botão, que dizia o que a análise
                  *é* em vez do que o clique faria. */}
              {atual && (
                <p className="mt-1">
                  <Badge tom="positivo" ponto>
                    Em edição
                  </Badge>
                </p>
              )}

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

              {/*
                Guardamos entrada e recalculamos sempre — por isso os
                números acima são os das regras vigentes, mesmo numa
                análise criada sob outro modelo. Quando as versões
                divergem, isso precisa estar dito.
              */}
              {regraAntiga && (
                <p className="mt-1 text-[0.6875rem] leading-snug text-ink-subtle">
                  Criada com regras {registro.versaoRegras} · recalculada com as
                  atuais {VERSAO_REGRAS}
                </p>
              )}

              {excluindo === registro.id ? (
                /* Confirmação da exclusão: nomeia o alvo e diz que não
                   volta, antes de apagar. */
                <div
                  role="alertdialog"
                  aria-label={nomeAcessivelExcluir(registro.referencia)}
                  className="mt-1.5 rounded-md border border-negativo/40 bg-negativo-soft p-2"
                >
                  <p className="text-[0.75rem] leading-snug text-ink">
                    {perguntaExclusao(registro.referencia)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button
                      autoFocus
                      tamanho="sm"
                      variante="destrutiva"
                      onClick={() => {
                        setExcluindo(null);
                        removerDoHistorico(registro.id);
                      }}
                    >
                      Excluir análise
                    </Button>
                    <Button
                      tamanho="sm"
                      variante="sutil"
                      onClick={() => setExcluindo(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-1.5 flex items-center gap-1">
                  <Button
                    tamanho="sm"
                    variante="secundaria"
                    onClick={() => onAbrir(registro.id)}
                  >
                    <span aria-hidden="true">Abrir</span>
                    {/* Uma coluna de botões "Abrir" idênticos não diz a
                        um leitor de tela qual análise abre. */}
                    <span className="sr-only">
                      {nomeAcessivelAbrir(registro.referencia)}
                    </span>
                  </Button>
                  <Button
                    tamanho="sm"
                    variante="destrutiva"
                    onClick={() => setExcluindo(registro.id)}
                  >
                    <IconeExcluir />
                    <span className="sr-only">
                      {nomeAcessivelExcluir(registro.referencia)}
                    </span>
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** Registros ilegíveis foram ignorados; os válidos continuam na lista. */
function AvisoDescartados({ quantidade }: { quantidade: number }) {
  return (
    <p
      role="status"
      className="px-3 py-2 text-[0.6875rem] leading-snug text-atencao"
    >
      <span aria-hidden="true">⚠ </span>
      {quantidade === 1
        ? "1 registro deste aparelho estava ilegível e foi ignorado."
        : `${quantidade} registros deste aparelho estavam ilegíveis e foram ignorados.`}{" "}
      As demais análises continuam disponíveis.
    </p>
  );
}
