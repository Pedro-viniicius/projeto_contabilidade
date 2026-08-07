/**
 * Contratos de dados do simulador.
 * Camada independente de React — pode ser reaproveitada em API futura.
 */

export type TipoAtuacao = "pessoa-fisica" | "cnpj";

/** Entrada já validada, pronta para o motor de cálculo. */
export interface EntradaSimulacao {
  /** Cenário que o usuário quer ver em destaque. */
  readonly tipoAtuacao: TipoAtuacao;
  /** Faturamento bruto mensal em reais. */
  readonly receitaMensal: number;
  /** Custos mensais do negócio, dedutíveis, em reais. */
  readonly custosMensais: number;
  /** Pró-labore mensal em reais. Usado apenas no cenário CNPJ. */
  readonly proLabore: number;
  /** Honorários contábeis mensais em reais. Usado apenas no cenário CNPJ. */
  readonly custoContabilidade: number;
}

/** Uma linha do "passo a passo" do cálculo, exibida na transparência. */
export interface PassoCalculo {
  readonly rotulo: string;
  /** Fórmula em texto, ex.: "R$ 10.000,00 − R$ 1.500,00". */
  readonly formula: string;
  readonly valor: number;
  /** Referência à premissa usada, quando houver. */
  readonly premissa?: string;
}

/** Um encargo/tributo estimado dentro de um cenário. */
export interface Encargo {
  readonly rotulo: string;
  readonly valorMensal: number;
  readonly explicacao: string;
}

/** Resultado calculado de um único cenário. */
export interface ResultadoCenario {
  readonly tipo: TipoAtuacao;
  readonly nome: string;
  readonly receitaMensal: number;
  readonly custosMensais: number;
  /** Soma de todos os encargos/tributos estimados no mês. */
  readonly encargosMensais: number;
  readonly encargos: readonly Encargo[];
  /** Receita − custos − encargos. */
  readonly liquidoMensal: number;
  readonly liquidoAnual: number;
  /** Líquido ÷ receita. 0 quando a receita é 0. */
  readonly margemLiquida: number;
  /** Encargos ÷ receita. 0 quando a receita é 0. */
  readonly cargaSobreReceita: number;
  readonly passos: readonly PassoCalculo[];
}

/** Comparação entre os dois cenários. */
export interface Comparacao {
  readonly pessoaFisica: ResultadoCenario;
  readonly cnpj: ResultadoCenario;
  /** Cenário com maior líquido mensal. `null` em caso de empate. */
  readonly vencedor: TipoAtuacao | null;
  /** Diferença absoluta de líquido mensal entre os cenários. */
  readonly diferencaMensal: number;
  readonly diferencaAnual: number;
}

/** Saída completa do motor de cálculo. */
export interface Simulacao {
  readonly entrada: EntradaSimulacao;
  readonly comparacao: Comparacao;
  /** Cenário escolhido pelo usuário, em destaque no resultado. */
  readonly principal: ResultadoCenario;
  readonly versaoRegras: string;
}

/** Registro persistido localmente. */
export interface SimulacaoSalva {
  readonly id: string;
  /** ISO 8601. */
  readonly criadaEm: string;
  readonly entrada: EntradaSimulacao;
  readonly versaoRegras: string;
}
