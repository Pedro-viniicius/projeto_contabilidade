/**
 * CLASSIFICAÇÃO TRIBUTÁRIA — funções puras.
 *
 * Traduz o raciocínio do contador em código:
 *
 *     atividade
 *       → anexos possíveis
 *       → Fator R, quando a atividade estiver sujeita
 *       → anexo aplicável
 *
 * Este arquivo é a ÚNICA fonte de "qual anexo se aplica". Nenhum
 * componente React decide enquadramento; a interface apenas exibe o
 * que sai daqui, incluindo o motivo.
 *
 * Compromisso central: quando não dá para afirmar, o resultado é
 * `pendente`. Nunca um anexo chutado.
 */

import { REGRAS, type Anexo } from "./calculation-rules";
import {
  atividadePorId,
  type AtividadeTributaria,
} from "./catalogo-atividades";
import {
  anexoTemCalculo,
  atingeFatorR,
  calcularFatorR,
  rbt12Aplicada,
} from "./simples-nacional";

/** Como o anexo foi determinado. */
export type OrigemAnexo =
  /** A atividade só admite um anexo. */
  | "unico"
  /** O Fator R decidiu entre os candidatos. */
  | "fator-r"
  /** O contador sobrepôs a classificação automática. */
  | "manual"
  /** Não foi possível determinar. */
  | "pendente";

/** Por que o cálculo do cenário CNPJ não pode rodar. */
export type BloqueioCalculo =
  /** Atividade fora do catálogo desta versão. */
  | "classificacao-pendente"
  /** Anexo identificado, mas sem cálculo suportado (ex.: Anexo IV). */
  | "anexo-sem-calculo"
  /** RBT12 acima do teto do Simples Nacional. */
  | "acima-do-teto";

/** Fator R apurado, com os números que o produziram. */
export interface ApuracaoFatorR {
  /** Fração. `null` quando não há RBT12 para dividir. */
  readonly valor: number | null;
  readonly folha12m: number;
  readonly rbt12: number;
  readonly limite: number;
  readonly atinge: boolean;
  /** A RBT12 foi projetada a partir da receita mensal. */
  readonly rbt12Projetada: boolean;
}

/**
 * Resultado completo da classificação.
 *
 * Carrega o "porquê" junto do "quê": a interface de auditoria não
 * recalcula nada, apenas exibe estes campos.
 */
export interface Classificacao {
  readonly atividade: AtividadeTributaria | null;
  readonly anexosPossiveis: readonly Anexo[];
  /** Anexo aplicável. `null` = classificação pendente. */
  readonly anexo: Anexo | null;
  readonly origem: OrigemAnexo;
  /** A atividade transita entre anexos conforme o Fator R. */
  readonly sujeitaFatorR: boolean;
  /** Presente apenas quando a atividade está sujeita ao Fator R. */
  readonly fatorR: ApuracaoFatorR | null;
  /** Motivo em pt-BR, pronto para exibição. */
  readonly motivo: string;
  /** `null` quando o cenário CNPJ pode ser calculado. */
  readonly bloqueio: BloqueioCalculo | null;
  /** Quando o contador sobrepôs a classificação. */
  readonly manual: boolean;
  readonly motivoManual?: string;
}

/** O que a classificação precisa saber do cenário. */
export interface ContextoClassificacao {
  readonly atividadeId: string | null;
  /** Anexo escolhido à mão pelo contador. `null` = automático. */
  readonly anexoManual: Anexo | null;
  readonly motivoAnexoManual?: string;
  readonly receitaMensal: number;
  readonly rbt12: number;
  readonly folha12m: number;
}

const pct = (v: number) =>
  `${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

/**
 * Classifica a atividade e resolve o anexo aplicável.
 *
 * Determinística: mesma entrada, mesmo resultado. Sem relógio, sem
 * rede, sem consulta externa — o catálogo é interno de propósito, para
 * que o simulador não dependa de nenhuma página de terceiro em tempo
 * de cálculo.
 */
export function classificar(ctx: ContextoClassificacao): Classificacao {
  const atividade = atividadePorId(ctx.atividadeId);
  const { valor: rbt12, projetada } = rbt12Aplicada(
    ctx.rbt12,
    ctx.receitaMensal,
  );
  const acimaDoTeto = rbt12 > REGRAS.simplesNacional.limiteRbt12.valor;

  /* Override manual vem primeiro, e nunca se disfarça de automático. */
  if (ctx.anexoManual) {
    return {
      atividade,
      anexosPossiveis: atividade?.simples.anexosPossiveis ?? [ctx.anexoManual],
      anexo: ctx.anexoManual,
      origem: "manual",
      sujeitaFatorR: atividade?.simples.sujeitaFatorR ?? false,
      fatorR: null,
      motivo: `Anexo ${ctx.anexoManual} definido manualmente pelo contador. A classificação automática não foi usada.`,
      bloqueio: bloqueioDe(ctx.anexoManual, acimaDoTeto),
      manual: true,
      motivoManual: ctx.motivoAnexoManual,
    };
  }

  if (!atividade) {
    return {
      atividade: null,
      anexosPossiveis: [],
      anexo: null,
      origem: "pendente",
      sujeitaFatorR: false,
      fatorR: null,
      motivo:
        "Atividade não identificada. Sem atividade, não há como afirmar o anexo — o cenário CNPJ fica sem enquadramento.",
      bloqueio: "classificacao-pendente",
      manual: false,
    };
  }

  const { anexosPossiveis, sujeitaFatorR } = atividade.simples;

  if (!sujeitaFatorR) {
    const anexo = anexosPossiveis[0];
    return {
      atividade,
      anexosPossiveis,
      anexo,
      origem: "unico",
      sujeitaFatorR: false,
      fatorR: null,
      motivo: `${atividade.descricao} admite apenas o Anexo ${anexo}. O Fator R não se aplica a esta atividade.`,
      bloqueio: bloqueioDe(anexo, acimaDoTeto),
      manual: false,
    };
  }

  const limite = REGRAS.simplesNacional.fatorRLimite.valor;
  const valor = calcularFatorR(ctx.folha12m, rbt12);
  const atinge = atingeFatorR(valor);
  const apuracao: ApuracaoFatorR = {
    valor,
    folha12m: ctx.folha12m,
    rbt12,
    limite,
    atinge,
    rbt12Projetada: projetada,
  };

  if (valor === null) {
    return {
      atividade,
      anexosPossiveis,
      anexo: null,
      origem: "pendente",
      sujeitaFatorR: true,
      fatorR: apuracao,
      motivo: `${atividade.descricao} transita entre os Anexos ${anexosPossiveis.join(
        " e ",
      )} conforme o Fator R. Sem receita dos últimos 12 meses não há como apurá-lo.`,
      bloqueio: "classificacao-pendente",
      manual: false,
    };
  }

  const anexo: Anexo = atinge ? "III" : "V";
  return {
    atividade,
    anexosPossiveis,
    anexo,
    origem: "fator-r",
    sujeitaFatorR: true,
    fatorR: apuracao,
    motivo: `Atividade sujeita ao Fator R. Folha de ${pct(
      valor,
    )} da receita dos últimos 12 meses, contra o limite de ${pct(
      limite,
    )} — ${atinge ? "atingido" : "não atingido"}, portanto Anexo ${anexo}.`,
    bloqueio: bloqueioDe(anexo, acimaDoTeto),
    manual: false,
  };
}

function bloqueioDe(anexo: Anexo, acimaDoTeto: boolean): BloqueioCalculo | null {
  if (acimaDoTeto) return "acima-do-teto";
  if (!anexoTemCalculo(anexo)) return "anexo-sem-calculo";
  return null;
}

/**
 * Resumo do bloqueio: uma linha, para ficar ao lado da ação sem
 * competir com ela. O detalhe completo fica em `explicarBloqueio`.
 */
export function resumoBloqueio(bloqueio: BloqueioCalculo): string {
  switch (bloqueio) {
    case "classificacao-pendente":
      return "Enquanto o anexo não for definido, o cálculo do CNPJ é provisório.";
    case "anexo-sem-calculo":
      return "Este anexo ainda não é calculado: o resultado do CNPJ não vale.";
    case "acima-do-teto":
      return "Acima do teto do Simples: o resultado do CNPJ não vale.";
  }
}

/** Explicação completa do bloqueio, em pt-BR, pronta para a interface. */
export function explicarBloqueio(
  bloqueio: BloqueioCalculo,
  anexo: Anexo | null,
): string {
  switch (bloqueio) {
    case "classificacao-pendente":
      return "Sem anexo definido, o cenário CNPJ recorre a uma alíquota única de reserva. O número aparece, mas é provisório: não representa o Simples Nacional.";
    case "anexo-sem-calculo":
      /*
       * O motivo do Anexo IV é específico — a contribuição patronal
       * fica fora da guia única. Dizer isso de QUALQUER anexo sem
       * cálculo seria falso: no Anexo I, por exemplo, a CPP está
       * dentro do DAS, e ele está fora por escopo de produto.
       */
      return anexo === "IV"
        ? "O Anexo IV recolhe a contribuição patronal FORA da guia única do Simples. Este simulador ainda não modela esse encargo, então o cálculo do cenário CNPJ ficaria errado por construção."
        : `O Anexo ${anexo} está fora do escopo de cálculo desta versão, voltada a prestadores de serviço. A classificação vale; o resultado do cenário CNPJ, não.`;
    case "acima-do-teto":
      return "A receita acumulada em 12 meses ultrapassa o teto do Simples Nacional. O enquadramento passaria a Lucro Presumido ou Real, regimes que este simulador não calcula.";
  }
}
