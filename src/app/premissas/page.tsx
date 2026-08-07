import type { Metadata } from "next";
import { Card, CardTitulo } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { AvisoContabil } from "@/components/ui/aviso-contabil";
import {
  listarPremissas,
  VERSAO_REGRAS,
} from "@/features/simulacao/domain/calculation-rules";
import { TabelaPremissas } from "@/features/simulacao/components/tabela-premissas";

export const metadata: Metadata = {
  title: "Premissas de cálculo",
  description:
    "Todas as alíquotas, tetos e simplificações usadas pelo simulador do Clareza, com o status de validação de cada uma.",
  alternates: { canonical: "/premissas" },
};

const GRUPOS = ["Geral", "Pessoa Física", "CNPJ"] as const;

export default function PremissasPage() {
  const premissas = listarPremissas();

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Premissas de cálculo
        </h1>
        <p className="mt-3 leading-relaxed text-ink-muted">
          Esta página existe para que um contador possa auditar o simulador sem
          abrir o código. Cada premissa mostra o valor usado, por que ela existe
          e em que estágio de validação está.
        </p>
        <p className="mt-2 text-sm text-ink-subtle">
          Versão das regras: {VERSAO_REGRAS}
        </p>
      </header>

      <Card className="border-warning-soft bg-warning-soft">
        <p className="text-sm leading-relaxed text-warning-ink">
          <strong className="font-semibold">Atenção:</strong> nenhuma premissa
          desta versão foi validada por um contador. Os valores são referências
          de MVP, escolhidas para tornar a simulação compreensível e fácil de
          corrigir — não para produzir precisão fiscal.
        </p>
      </Card>

      {GRUPOS.map((grupo) => {
        const doGrupo = premissas.filter((p) => p.grupo === grupo);
        if (doGrupo.length === 0) return null;
        return (
          <Card key={grupo}>
            <CardTitulo>{grupo}</CardTitulo>
            <TabelaPremissas premissas={doGrupo} />
          </Card>
        );
      })}

      <Card>
        <CardTitulo>A maior simplificação desta versão</CardTitulo>
        <p className="mt-3 leading-relaxed text-ink-muted">
          O cenário CNPJ usa <strong>uma única alíquota efetiva</strong> sobre o
          faturamento no lugar das tabelas do Simples Nacional. Não calculamos
          RBT12, Fator R, troca de anexo nem a partilha entre tributos. Foi uma
          decisão consciente: preferimos um número compreensível e
          explicitamente aproximado a uma precisão inventada.
        </p>
        <ButtonLink href="/feedback" variante="secundaria" className="mt-5">
          Apontar uma premissa incorreta
        </ButtonLink>
      </Card>

      <AvisoContabil className="px-1 pt-2" />
    </div>
  );
}
