"use client";

import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { Painel, PainelCabecalho } from "@/components/ui/painel";
import { formatarMoeda } from "@/lib/format";
import { useHidratado, useValorLocal } from "@/lib/armazenamento-reativo";
import { simular } from "../domain/calcular";
import { AreaRolavel } from "@/components/ui/area-rolavel";
import {
  abrirDoHistorico,
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
 * Simulações recentes do aparelho.
 *
 * Serve ao uso repetido dentro de uma sessão de trabalho: alternar
 * entre cenários já calculados sem redigitar. Não é cadastro de
 * clientes — é histórico local e descartável.
 */
export function HistoricoSimulacoes() {
  const router = useRouter();
  const hidratado = useHidratado();
  const historico = useValorLocal(CHAVE_HISTORICO, lerHistorico) ?? [];

  if (!hidratado) return null;

  if (historico.length === 0) {
    return (
      <Painel>
        <PainelCabecalho titulo="Simulações recentes" />
        <div className="px-4 py-8 text-center">
          <p className="text-[0.875rem] font-medium text-ink">
            Nenhuma simulação neste aparelho
          </p>
          <p className="mx-auto mt-1 max-w-md text-[0.8125rem] leading-snug text-ink-muted">
            As simulações executadas ficam listadas aqui para você retomar sem
            redigitar os valores.
          </p>
          <ButtonLink href="/simulacao" className="mt-4">
            Nova simulação
          </ButtonLink>
        </div>
      </Painel>
    );
  }

  return (
    <Painel>
      <PainelCabecalho
        titulo="Simulações recentes"
        descricao={`${historico.length} no armazenamento local deste aparelho.`}
      />

      <AreaRolavel>
        <table className="tabela-dados min-w-[38rem] text-[0.8125rem]">
          <caption className="sr-only">
            Simulações executadas neste aparelho, com receita informada e
            resultado líquido estimado em cada cenário.
          </caption>
          <thead>
            <tr>
              <th scope="col">Referência</th>
              <th scope="col" className="num">
                Receita
              </th>
              <th scope="col" className="num">
                Líquido PF
              </th>
              <th scope="col" className="num">
                Líquido CNPJ
              </th>
              <th scope="col">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {historico.map((registro) => {
              const s = simular(registro.entrada);
              return (
                <tr key={registro.id} className="hover:bg-surface-hover">
                  <th scope="row" className="font-normal">
                    <span className="block text-ink">
                      {registro.referencia ?? "Sem referência"}
                    </span>
                    <span className="block text-[0.75rem] text-ink-subtle">
                      {horaCurta.format(new Date(registro.criadaEm))} ·{" "}
                      {registro.entrada.tipoAtuacao === "cnpj"
                        ? "CNPJ"
                        : "Pessoa Física"}
                    </span>
                  </th>
                  <td className="num text-ink">
                    {formatarMoeda(registro.entrada.receitaMensal)}
                  </td>
                  <td className="num text-ink-muted">
                    {formatarMoeda(s.comparacao.pessoaFisica.liquidoMensal)}
                  </td>
                  <td className="num text-ink-muted">
                    {formatarMoeda(s.comparacao.cnpj.liquidoMensal)}
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Button
                        tamanho="sm"
                        variante="secundaria"
                        onClick={() => {
                          abrirDoHistorico(registro.id);
                          router.push("/simulacao");
                        }}
                      >
                        Abrir
                      </Button>
                      <Button
                        tamanho="sm"
                        variante="sutil"
                        onClick={() => removerDoHistorico(registro.id)}
                      >
                        <span aria-hidden="true">✕</span>
                        <span className="sr-only">
                          Remover simulação{" "}
                          {registro.referencia ?? "sem referência"}
                        </span>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AreaRolavel>
    </Painel>
  );
}
