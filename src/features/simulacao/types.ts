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

/**
 * Um encargo/tributo estimado dentro de um cenário.
 *
 * Os campos opcionais existem para a auditoria: permitem exibir
 * base × alíquota = resultado sem que a interface recalcule nada.
 * São descrições do que o motor já computou — nunca entradas de cálculo.
 */
export interface Encargo {
  readonly rotulo: string;
  readonly valorMensal: number;
  readonly explicacao: string;
  /** Base de cálculo sobre a qual a alíquota incidiu. */
  readonly base?: number;
  /** Alíquota aplicada, em fração (0.20 = 20%). */
  readonly aliquota?: number;
  /** Parcela deduzida, quando a regra usa tabela progressiva. */
  readonly parcelaADeduzir?: number;
  /** Chave da premissa correspondente em `listarPremissas()`. */
  readonly premissa?: string;
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

/**
 * Registro persistido localmente.
 *
 * A referência fica aqui, e não em `EntradaSimulacao`, de propósito:
 * é rótulo de organização do contador, não insumo de cálculo. O motor
 * segue recebendo apenas números.
 */
export interface SimulacaoSalva {
  readonly id: string;
  /** ISO 8601. Definida na criação e nunca reescrita. */
  readonly criadaEm: string;
  /**
   * ISO 8601 do último recálculo. Ausente enquanto a análise nunca foi
   * atualizada — e ausente também nos registros gravados antes da
   * v2.1.1, que não tinham o campo.
   */
  readonly atualizadaEm?: string;
  readonly entrada: EntradaSimulacao;
  /**
   * Versão das regras vigente quando a análise foi CRIADA.
   *
   * Não é reescrita no recálculo, de propósito: é ela que permite
   * dizer "criada com regras X, recalculada com as atuais Y". O
   * resultado continua sendo sempre recalculado com as regras
   * vigentes — nunca guardamos número.
   */
  readonly versaoRegras: string;
  /** Rótulo livre e opcional, ex.: "Cliente XPTO — cenário 01". */
  readonly referencia?: string;
}
