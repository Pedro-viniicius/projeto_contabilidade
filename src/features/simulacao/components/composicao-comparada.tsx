"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AreaRolavel } from "@/components/ui/area-rolavel";
import { formatarMoeda, formatarPercentual } from "@/lib/format";
import { listarPremissas, ROTULO_STATUS } from "../domain/calculation-rules";
import { TOM_STATUS } from "./tom-status";
import {
  compararEncargos,
  type LadoEncargo,
  type LinhaEncargoComparada,
} from "../domain/comparar-encargos";
import type { CategoriaEncargo, Comparacao, Encargo } from "../types";

/**
 * COMPOSIÇÃO DOS ENCARGOS, LADO A LADO.
 *
 * Substitui as abas "Pessoa Física" e "CNPJ" como visão padrão. A
 * comparação em abas exigia inspecionar um lado, DECORAR os valores,
 * trocar de aba e subtrair de cabeça — quatro passos e uma chance de
 * erro para responder "onde está a diferença?".
 *
 * Aqui a resposta está numa linha só. O detalhe de cada lado —  base,
 * alíquota, premissa e estágio de validação — abre no lugar, para os
 * dois cenários ao mesmo tempo: reconhecimento no lugar de memória.
 */
export function ComposicaoComparada({
  comparacao,
  /** Categorias que mais pesam, realçadas na leitura. */
  destaques = [],
}: {
  comparacao: Comparacao;
  destaques?: readonly CategoriaEncargo[];
}) {
  const { linhas, total } = compararEncargos(comparacao);
  const premissas = listarPremissas();
  const [aberta, setAberta] = useState<CategoriaEncargo | null>(null);

  if (linhas.length === 0) {
    return (
      <p className="px-4 py-3.5 text-[0.8125rem] leading-snug text-ink-muted">
        No momento, não há encargos aplicáveis a estes cenários.
      </p>
    );
  }

  return (
    <AreaRolavel>
      <table className="tabela-dados min-w-[36rem] text-[0.8125rem]">
        <caption className="sr-only">
          Composição dos encargos nos dois cenários, com valor mensal de cada
          um e a diferença nomeando o cenário de maior custo. Cada linha abre a
          base de cálculo, a alíquota e a premissa utilizada.
        </caption>
        <thead>
          <tr>
            <th scope="col">Encargo</th>
            <th scope="col" className="num">
              Pessoa Física
            </th>
            <th scope="col" className="num">
              CNPJ
            </th>
            <th scope="col">Diferença</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <LinhaComparada
              key={linha.categoria}
              linha={linha}
              premissas={premissas}
              destacada={destaques.includes(linha.categoria)}
              aberta={aberta === linha.categoria}
              onAlternar={() =>
                setAberta(aberta === linha.categoria ? null : linha.categoria)
              }
            />
          ))}

          <tr className="bg-surface-muted">
            <th scope="row" className="font-medium text-ink">
              Total de encargos
              <span className="mt-0.5 block text-[0.6875rem] font-normal text-ink-subtle">
                {formatarPercentual(total.cargaPessoaFisica)} contra{" "}
                {formatarPercentual(total.cargaCnpj)} da receita
              </span>
            </th>
            <td className="num font-semibold text-ink">
              {formatarMoeda(total.pessoaFisica)}
            </td>
            <td className="num font-semibold text-ink">
              {formatarMoeda(total.cnpj)}
            </td>
            <td className="text-[0.75rem] font-medium leading-snug text-ink">
              {total.diferenca.texto}
              <span className="mt-0.5 block font-normal text-ink-muted">
                {total.diferencaCarga.texto}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </AreaRolavel>
  );
}

function LinhaComparada({
  linha,
  premissas,
  destacada,
  aberta,
  onAlternar,
}: {
  linha: LinhaEncargoComparada;
  premissas: ReturnType<typeof listarPremissas>;
  destacada: boolean;
  aberta: boolean;
  onAlternar: () => void;
}) {
  const id = `encargo-${linha.categoria}`;

  return (
    <>
      <tr className="hover:bg-surface-hover">
        <th scope="row" className="font-normal">
          <button
            type="button"
            onClick={onAlternar}
            aria-expanded={aberta}
            aria-controls={id}
            className="alvo-toque flex w-full items-start gap-1.5 rounded-sm text-left text-ink"
          >
            <span
              aria-hidden="true"
              className={`mt-px shrink-0 text-ink-subtle transition-transform ${
                aberta ? "rotate-90" : ""
              }`}
            >
              ›
            </span>
            <span className={destacada ? "font-medium" : undefined}>
              {linha.rotulo}
              {/*
                O realce diz POR QUE a linha foi destacada, em texto. Um
                negrito sozinho seria decoração; aqui ele é a resposta
                de "o que explica a diferença?".
              */}
              {destacada && (
                <span className="mt-0.5 block text-[0.6875rem] font-normal text-ink-subtle">
                  Maior peso na diferença
                </span>
              )}
            </span>
          </button>
        </th>

        <CelulaLado lado={linha.pessoaFisica} />
        <CelulaLado lado={linha.cnpj} />

        <td
          className={`text-[0.75rem] leading-snug ${
            linha.diferenca.empate ? "text-ink-subtle" : "text-ink-muted"
          }`}
        >
          {linha.diferenca.texto}
        </td>
      </tr>

      {aberta && (
        <tr id={id} className="bg-surface-muted">
          <td colSpan={4} className="px-4 py-3">
            {/*
              Os dois lados abertos ao mesmo tempo: é a diferença entre
              conferir uma conta e comparar duas.
            */}
            <div className="grid gap-4 sm:grid-cols-2">
              <DetalheLado
                titulo="Pessoa Física"
                lado={linha.pessoaFisica}
                premissas={premissas}
              />
              <DetalheLado
                titulo="CNPJ"
                lado={linha.cnpj}
                premissas={premissas}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/**
 * Célula de um lado.
 *
 * Categoria ausente vira "—" com leitura acessível de "não se aplica",
 * nunca R$ 0,00: zero sugeriria isenção onde o encargo simplesmente
 * não existe naquele regime.
 */
function CelulaLado({ lado }: { lado: LadoEncargo | null }) {
  if (!lado) {
    return (
      <td className="num text-ink-subtle">
        <span aria-hidden="true">—</span>
        <span className="sr-only">não se aplica a este cenário</span>
      </td>
    );
  }
  return (
    <td className="num font-medium text-ink">
      {formatarMoeda(lado.valorMensal)}
    </td>
  );
}

function DetalheLado({
  titulo,
  lado,
  premissas,
}: {
  titulo: string;
  lado: LadoEncargo | null;
  premissas: ReturnType<typeof listarPremissas>;
}) {
  return (
    <div className="min-w-0">
      <p className="rotulo-secao">{titulo}</p>
      {lado ? (
        <div className="mt-1 space-y-3">
          {lado.encargos.map((encargo) => (
            <DetalheEncargo
              key={encargo.rotulo}
              encargo={encargo}
              premissa={premissas.find((p) => p.chave === encargo.premissa)}
            />
          ))}
        </div>
      ) : (
        <p className="mt-1 text-[0.8125rem] leading-snug text-ink-muted">
          Não se aplica a este cenário.
        </p>
      )}
    </div>
  );
}

function DetalheEncargo({
  encargo,
  premissa,
}: {
  encargo: Encargo;
  premissa: ReturnType<typeof listarPremissas>[number] | undefined;
}) {
  return (
    <div>
      <p className="text-[0.8125rem] font-medium text-ink">{encargo.rotulo}</p>

      <dl className="mt-1 space-y-1">
        <LinhaConta
          rotulo="Base de cálculo"
          valor={
            encargo.base !== undefined ? formatarMoeda(encargo.base) : "—"
          }
        />
        <LinhaConta
          rotulo="Alíquota aplicada"
          valor={
            encargo.aliquota !== undefined
              ? formatarPercentual(encargo.aliquota)
              : "—"
          }
        />
        {encargo.parcelaADeduzir !== undefined &&
          encargo.parcelaADeduzir > 0 && (
            <LinhaConta
              rotulo="Parcela a deduzir"
              valor={`− ${formatarMoeda(encargo.parcelaADeduzir)}`}
            />
          )}
        <LinhaConta
          rotulo="Resultado"
          valor={formatarMoeda(encargo.valorMensal)}
          destaque
        />
      </dl>

      <p className="mt-1.5 text-[0.75rem] leading-relaxed text-ink-muted">
        {premissa?.descricao ?? encargo.explicacao}
      </p>

      {premissa && (
        <p className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge tom={TOM_STATUS[premissa.status]}>
            {ROTULO_STATUS[premissa.status]}
          </Badge>
        </p>
      )}
    </div>
  );
}

function LinhaConta({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 ${
        destaque ? "border-t border-border-base pt-1" : ""
      }`}
    >
      <dt className="text-[0.75rem] text-ink-muted">{rotulo}</dt>
      <dd
        className={`tnum text-[0.75rem] ${
          destaque ? "font-semibold text-ink" : "text-ink"
        }`}
      >
        {valor}
      </dd>
    </div>
  );
}
