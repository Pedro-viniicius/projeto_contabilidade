/**
 * Contratos de dados do simulador.
 * Camada independente de React — pode ser reaproveitada em API futura.
 */

import type { Anexo } from "./domain/calculation-rules";
import type { Classificacao } from "./domain/classificacao";

export type TipoAtuacao = "pessoa-fisica" | "cnpj";

/**
 * Entrada já validada, pronta para o motor de cálculo.
 *
 * A ATIVIDADE vem primeiro de propósito. É ela que define o
 * enquadramento possível e, com isso, quais dos campos abaixo têm
 * significado — o mesmo caminho que o contador percorre antes de
 * perguntar qualquer valor ao cliente.
 */
export interface EntradaSimulacao {
  /**
   * Atividade selecionada no catálogo. `null` = classificação
   * pendente, e o cenário CNPJ sai marcado como sem enquadramento.
   */
  readonly atividadeId: string | null;
  /**
   * Anexo definido À MÃO pelo contador, sobrepondo a classificação
   * automática. `null` = automático. Fica gravado no registro para
   * que uma análise antiga nunca apresente escolha manual como
   * classificação do sistema.
   */
  readonly anexoManual: Anexo | null;
  /** Justificativa livre e opcional da escolha manual. */
  readonly motivoAnexoManual?: string;
  /** Cenário que o usuário quer ver em destaque. */
  readonly tipoAtuacao: TipoAtuacao;
  /** Faturamento bruto mensal em reais. */
  readonly receitaMensal: number;
  /** Custos mensais do negócio, dedutíveis, em reais. */
  readonly custosMensais: number;
  /** Pró-labore mensal em reais. Usado apenas no cenário CNPJ. */
  readonly proLabore: number;
  /**
   * Honorários contábeis mensais do AUTÔNOMO.
   *
   * Campo próprio, independente do da empresa: a revisão contábil
   * pediu explicitamente que os dois não compartilhassem valor, porque
   * a diferença entre eles é parte do que a comparação mede.
   */
  readonly honorariosContabeisPf: number;
  /** Honorários contábeis mensais da EMPRESA. */
  readonly honorariosContabeisPj: number;
  /**
   * Receita bruta acumulada dos últimos 12 meses. `0` = não informada;
   * o motor projeta a receita mensal e avisa que projetou.
   */
  readonly rbt12: number;
  /**
   * Folha dos últimos 12 meses para o Fator R — salários, encargos e
   * pró-labore somados. Só tem efeito em atividade sujeita ao Fator R.
   */
  readonly folha12m: number;
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
 * Natureza do encargo, estável entre os dois cenários.
 *
 * Existe para que a composição possa ser comparada LADO A LADO: o
 * mesmo INSS aparece como "contribuinte individual" na Pessoa Física e
 * como "sobre o pró-labore" no CNPJ, e casar as duas linhas por rótulo
 * seria casar por texto de interface. É metadado de apresentação —
 * nenhum valor calculado depende dele.
 */
export type CategoriaEncargo = "inss" | "irpf" | "das" | "honorarios";

/** Nome da categoria na coluna "Encargo" da composição comparada. */
export const ROTULO_CATEGORIA: Record<CategoriaEncargo, string> = {
  inss: "INSS",
  irpf: "Imposto de renda",
  das: "Simples Nacional (DAS)",
  honorarios: "Honorários contábeis",
};

/**
 * Um encargo/tributo estimado dentro de um cenário.
 *
 * Os campos opcionais existem para a auditoria: permitem exibir
 * base × alíquota = resultado sem que a interface recalcule nada.
 * São descrições do que o motor já computou — nunca entradas de cálculo.
 */
export interface Encargo {
  readonly rotulo: string;
  /** Natureza do encargo, para casar a linha com a do outro cenário. */
  readonly categoria: CategoriaEncargo;
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
  /**
   * Enquadramento apurado para a entrada, com o motivo. É o que a
   * interface exibe em "Por que este anexo?" — sem recalcular nada.
   */
  readonly classificacao: Classificacao;
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
