"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconeExcluir } from "@/components/ui/icone";
import { MensagemStatus } from "@/components/ui/mensagem-status";
import { formatarMoeda } from "@/lib/format";
import { useHidratado, useValorLocal } from "@/lib/armazenamento-reativo";
import { simular } from "../domain/calcular";
import { VERSAO_REGRAS } from "../domain/calculation-rules";
import { atividadePorId } from "../domain/catalogo-atividades";
import { NOME_CURTO } from "../domain/diferenca-semantica";
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
import type { SimulacaoSalva } from "../types";

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

/** Normaliza para busca: sem acento, sem caixa. */
function chaveDeBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Texto pesquisável de um registro: referência e atividade. */
function textoBuscavel(registro: SimulacaoSalva): string {
  const atividade = atividadePorId(registro.entrada.atividadeId);
  return chaveDeBusca(
    [registro.referencia ?? "", atividade?.descricao ?? "", atividade?.cnae ?? ""]
      .join(" "),
  );
}

/**
 * ANÁLISES RECENTES deste navegador.
 *
 * Abrir um registro não navega: repõe os valores no formulário e
 * recalcula na hora. Serve ao uso repetido de uma sessão de trabalho —
 * alternar entre cenários de clientes sem redigitar.
 *
 * Duas ações, com consequências diferentes e ditas antes do clique:
 *
 * - **Abrir** retoma a MESMA análise. Recalcular atualiza o registro;
 * - **Duplicar** copia os valores para uma análise NOVA. O original
 *   fica intacto — é o gesto de "e se fosse assim?".
 *
 * Não é cadastro de clientes: fica no aparelho e é descartável.
 */
export function HistoricoSimulacoes({
  idAtual,
  onAbrir,
  onDuplicar,
}: {
  /** Registro atualmente em edição, destacado na lista. */
  idAtual?: string | null;
  onAbrir: (id: string) => void;
  onDuplicar: (id: string) => void;
}) {
  const hidratado = useHidratado();
  /* Exclusão em dois passos, uma linha por vez — mesmo gesto da
     fronteira de erro: mostrar a consequência antes de executá-la. */
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const leitura = useValorLocal(CHAVE_HISTORICO, lerHistorico);
  const historico = leitura?.registros ?? [];
  const descartados = leitura?.descartados ?? 0;

  /* Lista curta por construção (`LIMITE_HISTORICO`): filtrar a cada
     render custa menos que memoizar sobre um array recriado na
     leitura do armazenamento. */
  const termo = chaveDeBusca(busca.trim());
  const filtrados =
    termo === ""
      ? historico
      : historico.filter((r) => textoBuscavel(r).includes(termo));

  if (!hidratado) {
    return (
      <p className="px-1 py-3 text-[0.8125rem] text-ink-muted" role="status">
        Carregando análises…
      </p>
    );
  }

  if (historico.length === 0) {
    return (
      <div className="space-y-2 py-2">
        {descartados > 0 && <AvisoDescartados quantidade={descartados} />}
        <p className="text-[0.8125rem] leading-snug text-ink-muted">
          Você ainda não possui análises recentes. As que você calcular ficam
          listadas aqui, neste navegador, para retomar sem redigitar os valores.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {descartados > 0 && <AvisoDescartados quantidade={descartados} />}

      {/*
        A busca aparece quando a lista já é grande o bastante para não
        caber num olhar. Abaixo disso ela seria um campo a mais para
        tabular antes de chegar na análise que está logo ali.
      */}
      {historico.length > 3 && (
        <label className="block">
          <span className="text-[0.75rem] font-medium text-ink">
            Buscar por referência ou atividade
          </span>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Ex.: Cliente XPTO, desenvolvimento, 6201"
            className="mt-1 min-h-9 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-[0.8125rem] text-ink placeholder:text-ink-subtle"
          />
        </label>
      )}

      {filtrados.length === 0 ? (
        <p role="status" className="py-2 text-[0.8125rem] leading-snug text-ink-muted">
          Nenhuma análise corresponde a “{busca.trim()}”.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {filtrados.map((registro) => {
            const s = simular(registro.entrada);
            const atual = registro.id === idAtual;
            const regraAntiga = registro.versaoRegras !== VERSAO_REGRAS;
            const atividade = atividadePorId(registro.entrada.atividadeId);
            const vencedor = s.comparacao.vencedor;

            return (
              <li
                key={registro.id}
                className={`px-1 py-2.5 ${atual ? "bg-accent-soft/60" : ""}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-ink">
                    {registro.referencia ?? "Sem referência"}
                  </p>
                  <span className="shrink-0 text-[0.6875rem] text-ink-subtle">
                    {horaDoRegistro(registro.atualizadaEm ?? registro.criadaEm)}
                  </span>
                </div>

                {/* "Em edição" é estado, não ação: é etiqueta, não botão. */}
                {atual && (
                  <p className="mt-1">
                    <Badge tom="positivo" ponto>
                      Em edição
                    </Badge>
                  </p>
                )}

                <p className="mt-0.5 truncate text-[0.75rem] text-ink-muted">
                  {atividade?.descricao ?? "Atividade não informada"}
                </p>
                <p className="tnum mt-0.5 text-[0.75rem] text-ink-muted">
                  {formatarMoeda(registro.entrada.receitaMensal)} · hoje em{" "}
                  {NOME_CURTO[registro.entrada.tipoAtuacao]}
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

                {/* Conclusão nomeada, para reconhecer a análise sem abri-la. */}
                <p className="mt-0.5 text-[0.6875rem] leading-snug text-ink-subtle">
                  {vencedor === null
                    ? "Cenários empatados"
                    : `${NOME_CURTO[vencedor]}: ${formatarMoeda(
                        s.comparacao.diferencaMensal,
                      )} a mais por mês`}
                </p>

                {/*
                  Guardamos entrada e recalculamos sempre — por isso os
                  números acima são os das regras vigentes, mesmo numa
                  análise criada sob outro modelo. Quando as versões
                  divergem, isso precisa estar dito.
                */}
                {regraAntiga && (
                  <p className="mt-1 text-[0.6875rem] leading-snug text-ink-subtle">
                    Criada com regras {registro.versaoRegras} · recalculada com
                    as atuais {VERSAO_REGRAS}
                  </p>
                )}

                {excluindo === registro.id ? (
                  /* Confirmação da exclusão: nomeia o alvo e diz que
                     não volta, antes de apagar. */
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
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    <Button
                      tamanho="sm"
                      variante="secundaria"
                      onClick={() => onAbrir(registro.id)}
                    >
                      <span aria-hidden="true">Abrir</span>
                      {/* Uma coluna de botões "Abrir" idênticos não diz
                          a um leitor de tela qual análise abre. */}
                      <span className="sr-only">
                        {nomeAcessivelAbrir(registro.referencia)}
                      </span>
                    </Button>
                    <Button
                      tamanho="sm"
                      variante="sutil"
                      onClick={() => onDuplicar(registro.id)}
                    >
                      <span aria-hidden="true">Duplicar</span>
                      <span className="sr-only">
                        Duplicar análise{" "}
                        {registro.referencia?.trim() || "sem referência"} em uma
                        análise nova
                      </span>
                    </Button>
                    <Button
                      tamanho="sm"
                      variante="destrutiva"
                      className="ml-auto"
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
      )}
    </div>
  );
}

/** Registros ilegíveis foram ignorados; os válidos continuam na lista. */
function AvisoDescartados({ quantidade }: { quantidade: number }) {
  return (
    <MensagemStatus nivel="atencao" papel="status">
      {quantidade === 1
        ? "1 registro deste navegador estava ilegível e foi ignorado."
        : `${quantidade} registros deste navegador estavam ilegíveis e foram ignorados.`}{" "}
      As demais análises continuam disponíveis.
    </MensagemStatus>
  );
}
