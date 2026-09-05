import { Painel } from "@/components/ui/painel";
import type { Classificacao } from "../domain/classificacao";
import type { EntradaSimulacaoValidada } from "../schemas/simulacao-schema";

interface Requisito {
  readonly rotulo: string;
  readonly apoio: string;
  readonly ok: boolean;
}

/**
 * O que ainda falta para haver comparação.
 *
 * Derivado da entrada real — nunca uma lista fixa. Uma checagem
 * decorativa que marca "✓ Receita mensal" com o campo vazio é pior que
 * checagem nenhuma: ensina o contador a ignorar o indicador.
 */
export function requisitosPendentes(
  entrada: EntradaSimulacaoValidada,
  classificacao: Classificacao,
): readonly Requisito[] {
  return [
    {
      rotulo: "Receita bruta mensal",
      apoio: "Base dos dois cenários.",
      ok: entrada.receitaMensal > 0,
    },
    {
      rotulo: "Custos do negócio",
      apoio: "Pode ser zero.",
      ok: entrada.custosMensais >= 0,
    },
    {
      rotulo: "Atividade do cliente",
      apoio: "Define o anexo do Simples e o Fator R.",
      ok: classificacao.anexo !== null,
    },
  ];
}

/**
 * ESTADO VAZIO DA ZONA DE DECISÃO.
 *
 * Responde três perguntas, nesta ordem: o que vai aparecer aqui, o
 * que ainda falta, e o que fazer em seguida. Nada de ilustração — a
 * resposta útil é a lista de pendências reais.
 *
 * A largura é contida de propósito. Até a v2.5 este bloco era um
 * retângulo vazio da largura inteira da zona de resultado: ocupava
 * metade da tela para dizer três frases, e o vazio parecia defeito de
 * carregamento em vez de estado esperado.
 *
 * O bloco também NÃO oferece botão de calcular. "Calcular análise" já
 * é a ação primária fixa no rodapé da coluna de dados, e um segundo
 * botão idêntico visível ao mesmo tempo obrigaria a decidir em qual
 * clicar antes de decidir o que fazer.
 */
export function EstadoVazioResultado({
  entrada,
  classificacao,
}: {
  entrada: EntradaSimulacaoValidada;
  classificacao: Classificacao;
}) {
  const requisitos = requisitosPendentes(entrada, classificacao);
  const faltando = requisitos.filter((r) => !r.ok).length;

  return (
    <Painel className="max-w-[34rem] px-4 py-5">
      <p className="rotulo-secao">Zona de decisão</p>
      <h2 className="mt-1.5 text-[1.0625rem] font-semibold tracking-tight text-ink">
        Pronto para comparar
      </h2>
      <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-muted">
        Preencha os dados ao lado e calcule. Aqui aparecem a conclusão, a
        diferença mensal e anual, a composição dos encargos e as premissas
        que sustentam cada número.
      </p>

      <dl
        id="minimo-necessario"
        className="mt-4 divide-y divide-[var(--border)] border-t border-border-base"
      >
        {requisitos.map((requisito) => (
          <div
            key={requisito.rotulo}
            className="flex items-baseline gap-2.5 py-2"
          >
            {/* Marcador + texto acessível: o estado nunca depende só da cor. */}
            <span
              aria-hidden="true"
              className={`shrink-0 text-[0.8125rem] leading-none ${
                requisito.ok ? "text-accent" : "text-ink-subtle"
              }`}
            >
              {requisito.ok ? "✓" : "○"}
            </span>
            <dt
              className={`shrink-0 text-[0.8125rem] ${
                requisito.ok ? "text-ink-muted" : "font-medium text-ink"
              }`}
            >
              {requisito.rotulo}
              <span className="sr-only">
                {requisito.ok ? " — preenchido" : " — pendente"}
              </span>
            </dt>
            <dd className="min-w-0 text-right text-[0.75rem] leading-snug text-ink-subtle">
              {requisito.apoio}
            </dd>
          </div>
        ))}
      </dl>

      <p
        role="status"
        className="mt-3 text-[0.75rem] font-medium text-ink-muted"
      >
        {faltando === 0
          ? "Tudo preenchido — calcule para ver a comparação."
          : faltando === 1
            ? "Falta 1 informação."
            : `Faltam ${faltando} informações.`}
      </p>
    </Painel>
  );
}
