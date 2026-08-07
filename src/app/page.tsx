import { ButtonLink } from "@/components/ui/button";
import { BotaoInstalar } from "@/components/pwa/botao-instalar";
import { RetomarSimulacao } from "@/features/simulacao/components/retomar-simulacao";

const PASSOS = [
  {
    titulo: "Responda 4 perguntas",
    texto:
      "Quanto entra, quanto sai e como você atua hoje. Sem jargão contábil.",
  },
  {
    titulo: "Veja quanto sobra",
    texto:
      "Resultado líquido no mês e no ano, com os encargos estimados separados.",
  },
  {
    titulo: "Compare os cenários",
    texto:
      "Pessoa Física e CNPJ lado a lado, com a diferença em reais por mês.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6">
      {/* Hero: um único caminho de conversão dominante (Lei de Hick). */}
      <section className="pb-10 pt-12 sm:pb-14 sm:pt-20">
        <p className="text-sm font-medium text-accent">
          Para autônomos e prestadores de serviço
        </p>
        <h1 className="mt-3 text-[2rem] font-semibold leading-[1.15] tracking-tight text-ink sm:text-5xl">
          Entenda melhor seus números antes de tomar uma decisão.
        </h1>
        <p className="mt-4 max-w-xl text-[1.05rem] leading-relaxed text-ink-muted sm:text-lg">
          O Clareza simula quanto realmente sobra do seu faturamento e mostra a
          diferença entre atuar como Pessoa Física ou com CNPJ — sem você
          precisar entender de contabilidade.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/simulacao" tamanho="lg" className="sm:px-8">
            Fazer uma simulação
          </ButtonLink>
          <ButtonLink href="/como-funciona" variante="secundaria" tamanho="lg">
            Como funciona
          </ButtonLink>
        </div>

        <RetomarSimulacao />
      </section>

      <section aria-labelledby="passos" className="border-t border-border-base py-10">
        <h2 id="passos" className="text-xl font-semibold tracking-tight text-ink">
          Como funciona, em três passos
        </h2>
        <ol className="mt-6 grid gap-5 sm:grid-cols-3">
          {PASSOS.map((passo, i) => (
            <li key={passo.titulo}>
              <span
                aria-hidden="true"
                className="flex size-8 items-center justify-center rounded-lg bg-accent-soft text-sm font-semibold text-accent-ink"
              >
                {i + 1}
              </span>
              <h3 className="mt-3 font-medium text-ink">{passo.titulo}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                {passo.texto}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-border-base py-10">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          Cálculo aberto, não caixa-preta
        </h2>
        <p className="mt-3 max-w-xl leading-relaxed text-ink-muted">
          Toda simulação mostra a conta que foi feita, as alíquotas usadas e as
          premissas assumidas. Esta versão é um MVP em validação: as regras
          estão documentadas justamente para que um contador possa revisá-las.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/premissas" variante="secundaria">
            Ver premissas de cálculo
          </ButtonLink>
          <BotaoInstalar />
        </div>
      </section>
    </div>
  );
}
