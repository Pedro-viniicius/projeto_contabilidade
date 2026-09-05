/**
 * MOTOR DE CÁLCULO — funções puras, determinísticas e sem React.
 *
 * Fluxo: entrada validada → cálculo por cenário → comparação → resultado.
 *
 * Regra de ouro deste arquivo: nenhum número mágico. Todo parâmetro
 * tributário vem de `calculation-rules.ts`.
 */

import { REGRAS, VERSAO_REGRAS, type FaixaIrpf } from "./calculation-rules";
import { classificar, type Classificacao } from "./classificacao";
import { calcularAliquotaEfetiva } from "./simples-nacional";
import type {
  Comparacao,
  Encargo,
  EntradaSimulacao,
  PassoCalculo,
  ResultadoCenario,
  Simulacao,
  TipoAtuacao,
} from "../types";

/** Arredonda para 2 casas evitando erro de ponto flutuante binário. */
export function arredondar(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

/** Garante um número finito e não negativo. Protege o motor de entradas ruins. */
function naoNegativo(valor: number): number {
  return Number.isFinite(valor) && valor > 0 ? valor : 0;
}

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (v: number) =>
  `${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

/**
 * IRPF mensal pela tabela progressiva (método da parcela a deduzir).
 * Base negativa ou zero resulta em imposto zero.
 */
export function calcularIrpfMensal(
  base: number,
  faixas: readonly FaixaIrpf[] = REGRAS.pessoaFisica.irpfFaixas.valor,
): number {
  const baseValida = naoNegativo(base);
  const faixa =
    faixas.find((f) => f.ate === null || baseValida <= f.ate) ??
    faixas[faixas.length - 1];
  const imposto = baseValida * faixa.aliquota - faixa.parcelaADeduzir;
  return arredondar(Math.max(0, imposto));
}

/** Faixa aplicada ao valor informado — usado na explicação do cálculo. */
export function faixaIrpfDe(
  base: number,
  faixas: readonly FaixaIrpf[] = REGRAS.pessoaFisica.irpfFaixas.valor,
): FaixaIrpf {
  const baseValida = naoNegativo(base);
  return (
    faixas.find((f) => f.ate === null || baseValida <= f.ate) ??
    faixas[faixas.length - 1]
  );
}

/**
 * Salário de contribuição do INSS: base limitada ao teto e, havendo
 * atividade, nunca abaixo do piso.
 *
 * Extraído para que o cálculo e a auditoria usem exatamente a mesma
 * expressão — antes ela estava duplicada na montagem dos passos.
 */
export function salarioDeContribuicao(base: number): number {
  const { inssPiso, inssTeto } = REGRAS.pessoaFisica;
  const baseValida = naoNegativo(base);
  if (baseValida === 0) return 0;
  return Math.min(Math.max(baseValida, inssPiso.valor), inssTeto.valor);
}

/**
 * INSS do contribuinte individual.
 * O salário de contribuição é limitado ao teto; quando há base positiva
 * abaixo do piso, assume-se contribuição sobre o piso.
 */
export function calcularInssAutonomo(base: number): number {
  return arredondar(
    salarioDeContribuicao(base) * REGRAS.pessoaFisica.inssAliquota.valor,
  );
}

/** Base do carnê-leão: receita bruta menos custos dedutíveis do livro-caixa. */
export function calcularBaseLivroCaixa(
  receitaMensal: number,
  custosMensais: number,
): number {
  return arredondar(naoNegativo(receitaMensal) - naoNegativo(custosMensais));
}

/**
 * Cenário Pessoa Física / Autônomo.
 * receita − custos → base → INSS → IRPF → líquido.
 */
export function calcularCenarioPessoaFisica(
  entrada: EntradaSimulacao,
): ResultadoCenario {
  const receita = arredondar(naoNegativo(entrada.receitaMensal));
  const custos = arredondar(naoNegativo(entrada.custosMensais));
  /*
   * Honorário PRÓPRIO do autônomo, jamais o da empresa. É o pedido
   * literal da revisão contábil: os dois custos existem, são
   * diferentes, e amarrá-los esconderia parte da resposta.
   *
   * Fica FORA da base do livro-caixa: entra como encargo do cenário,
   * porque tratá-lo como custo dedutível suporia uma dedutibilidade
   * que ninguém validou.
   */
  const contabilidade = arredondar(
    naoNegativo(entrada.honorariosContabeisPf),
  );

  const base = calcularBaseLivroCaixa(receita, custos);
  const salarioContribuicao = salarioDeContribuicao(base);
  const inss = calcularInssAutonomo(base);
  const baseIrpf = arredondar(Math.max(0, base - inss));
  const irpf = calcularIrpfMensal(baseIrpf);
  const faixa = faixaIrpfDe(baseIrpf);

  const encargos: Encargo[] = [
    {
      rotulo: "INSS (contribuinte individual)",
      categoria: "inss",
      valorMensal: inss,
      base: salarioContribuicao,
      aliquota: REGRAS.pessoaFisica.inssAliquota.valor,
      premissa: "INSS — alíquota",
      explicacao: `${pct(
        REGRAS.pessoaFisica.inssAliquota.valor,
      )} sobre o salário de contribuição, respeitando piso de ${brl(
        REGRAS.pessoaFisica.inssPiso.valor,
      )} e teto de ${brl(REGRAS.pessoaFisica.inssTeto.valor)}.`,
    },
    {
      rotulo: "IRPF (carnê-leão)",
      categoria: "irpf",
      valorMensal: irpf,
      base: baseIrpf,
      aliquota: faixa.aliquota,
      parcelaADeduzir: faixa.parcelaADeduzir,
      premissa: "IRPF — tabela progressiva mensal",
      explicacao: `Tabela progressiva mensal: faixa de ${pct(
        faixa.aliquota,
      )} com parcela a deduzir de ${brl(faixa.parcelaADeduzir)}.`,
    },
    {
      rotulo: "Honorários contábeis — Autônomo/PF",
      categoria: "honorarios",
      valorMensal: contabilidade,
      premissa: "Honorários contábeis — Autônomo/PF",
      explicacao:
        "Custo contábil informado para o cenário Pessoa Física. Independente do honorário da empresa — o padrão é zero até que o contador informe o valor do cliente.",
    },
  ];

  const totalEncargos = arredondar(inss + irpf + contabilidade);
  const liquido = arredondar(base - totalEncargos);

  const passos: PassoCalculo[] = [
    {
      rotulo: "Base do livro-caixa",
      formula: `${brl(receita)} − ${brl(custos)}`,
      valor: base,
    },
    {
      rotulo: "INSS",
      formula: `${brl(salarioContribuicao)} × ${pct(
        REGRAS.pessoaFisica.inssAliquota.valor,
      )}`,
      valor: inss,
      premissa: "INSS — alíquota, piso e teto",
    },
    {
      rotulo: "Base do IRPF",
      formula: `${brl(base)} − ${brl(inss)}`,
      valor: baseIrpf,
    },
    {
      rotulo: "IRPF",
      formula: `${brl(baseIrpf)} × ${pct(faixa.aliquota)} − ${brl(
        faixa.parcelaADeduzir,
      )}`,
      valor: irpf,
      premissa: "IRPF — tabela progressiva mensal",
    },
    {
      rotulo: "Honorários contábeis — Autônomo/PF",
      formula: "Valor informado na análise",
      valor: contabilidade,
      premissa: "Honorários contábeis — Autônomo/PF",
    },
    {
      rotulo: "Resultado líquido mensal",
      formula: `${brl(base)} − ${brl(inss)} − ${brl(irpf)} − ${brl(
        contabilidade,
      )}`,
      valor: liquido,
    },
  ];

  return montarCenario({
    tipo: "pessoa-fisica",
    nome: "Pessoa Física / Autônomo",
    receita,
    custos,
    encargos,
    totalEncargos,
    liquido,
    passos,
  });
}

/**
 * Cenário CNPJ / Prestador de serviço.
 *
 * A tributação sobre o faturamento sai do ANEXO resolvido pela
 * classificação: alíquota efetiva do Simples calculada sobre a RBT12.
 * A alíquota única de recurso só entra quando não há anexo — e o
 * resultado, nesse caso, sai declaradamente sem enquadramento.
 *
 * A classificação é recebida pronta, não recalculada aqui: um único
 * ponto decide o anexo, e é ele que a auditoria exibe.
 */
export function calcularCenarioCnpj(
  entrada: EntradaSimulacao,
  classificacao: Classificacao,
): ResultadoCenario {
  const receita = arredondar(naoNegativo(entrada.receitaMensal));
  const custos = arredondar(naoNegativo(entrada.custosMensais));
  const contabilidade = arredondar(
    naoNegativo(entrada.honorariosContabeisPj),
  );
  /* O pró-labore não pode ser maior que o faturamento: seria incoerente. */
  const proLabore = arredondar(
    Math.min(naoNegativo(entrada.proLabore), receita),
  );

  const tributacao = tributacaoDoFaturamento(receita, classificacao);
  const { aliquota, impostoFaturamento } = tributacao;

  const baseInssProLabore = Math.min(
    proLabore,
    REGRAS.pessoaFisica.inssTeto.valor,
  );
  const inssProLabore = arredondar(
    baseInssProLabore * REGRAS.cnpj.inssProLaboreAliquota.valor,
  );
  const baseIrrf = arredondar(Math.max(0, proLabore - inssProLabore));
  const irrfProLabore = calcularIrpfMensal(baseIrrf);
  const faixa = faixaIrpfDe(baseIrrf);

  const encargos: Encargo[] = [
    {
      rotulo: tributacao.rotulo,
      categoria: "das",
      valorMensal: impostoFaturamento,
      base: receita,
      aliquota,
      premissa: tributacao.premissa,
      explicacao: tributacao.explicacao,
    },
    {
      rotulo: "Honorários contábeis — Empresa/PJ",
      categoria: "honorarios",
      valorMensal: contabilidade,
      premissa: "Honorários contábeis — Empresa/PJ",
      explicacao:
        "Custo fixo de manter a empresa regular. Editado em separado do honorário do autônomo — os dois cenários têm custos contábeis próprios.",
    },
    {
      rotulo: "INSS sobre pró-labore",
      categoria: "inss",
      valorMensal: inssProLabore,
      base: baseInssProLabore,
      aliquota: REGRAS.cnpj.inssProLaboreAliquota.valor,
      premissa: "INSS sobre pró-labore",
      explicacao: `${pct(
        REGRAS.cnpj.inssProLaboreAliquota.valor,
      )} retidos do sócio sobre o pró-labore de ${brl(proLabore)}.`,
    },
    {
      rotulo: "IRRF sobre pró-labore",
      categoria: "irpf",
      valorMensal: irrfProLabore,
      base: baseIrrf,
      aliquota: faixa.aliquota,
      parcelaADeduzir: faixa.parcelaADeduzir,
      premissa: "IRPF — tabela progressiva mensal",
      explicacao: `Tabela progressiva mensal aplicada ao pró-labore: faixa de ${pct(
        faixa.aliquota,
      )}. O lucro distribuído é tratado como isento.`,
    },
  ];

  const totalEncargos = arredondar(
    impostoFaturamento + contabilidade + inssProLabore + irrfProLabore,
  );
  const liquido = arredondar(receita - custos - totalEncargos);

  const passos: PassoCalculo[] = [
    {
      rotulo: tributacao.rotulo,
      formula: tributacao.formula,
      valor: impostoFaturamento,
      premissa: tributacao.premissa,
    },
    {
      rotulo: "Honorários contábeis — Empresa/PJ",
      formula: "Valor informado na análise",
      valor: contabilidade,
      premissa: "Honorários contábeis — Empresa/PJ",
    },
    {
      rotulo: "INSS sobre pró-labore",
      formula: `${brl(proLabore)} × ${pct(
        REGRAS.cnpj.inssProLaboreAliquota.valor,
      )}`,
      valor: inssProLabore,
      premissa: "INSS sobre pró-labore",
    },
    {
      rotulo: "IRRF sobre pró-labore",
      formula: `${brl(baseIrrf)} × ${pct(faixa.aliquota)} − ${brl(
        faixa.parcelaADeduzir,
      )}`,
      valor: irrfProLabore,
      premissa: "IRPF — tabela progressiva mensal",
    },
    {
      rotulo: "Resultado líquido mensal",
      formula: `${brl(receita)} − ${brl(custos)} − ${brl(totalEncargos)}`,
      valor: liquido,
    },
  ];

  return montarCenario({
    tipo: "cnpj",
    nome: "CNPJ / Prestador de serviço",
    receita,
    custos,
    encargos,
    totalEncargos,
    liquido,
    passos,
  });
}

/**
 * Tributação do faturamento, com o texto que a explica.
 *
 * Dois caminhos, e a diferença entre eles nunca fica implícita:
 *
 *  - ANEXO RESOLVIDO → alíquota efetiva do Simples sobre a RBT12,
 *    pela fórmula da LC 123/2006;
 *  - CLASSIFICAÇÃO PENDENTE → alíquota única de recurso, e a
 *    explicação diz, com todas as letras, que não representa o
 *    Simples real.
 */
function tributacaoDoFaturamento(
  receita: number,
  classificacao: Classificacao,
): {
  aliquota: number;
  impostoFaturamento: number;
  rotulo: string;
  premissa: string;
  explicacao: string;
  formula: string;
} {
  const { anexo, fatorR } = classificacao;

  if (anexo === null) {
    const aliquota = REGRAS.cnpj.aliquotaEfetivaFaturamento.valor;
    return {
      aliquota,
      impostoFaturamento: arredondar(receita * aliquota),
      rotulo: "Tributos sobre o faturamento (sem enquadramento)",
      premissa: "Alíquota de recurso — classificação pendente",
      explicacao: `Sem atividade identificada, o motor não tem anexo para consultar e aplica uma alíquota única de recurso de ${pct(
        aliquota,
      )}. NÃO representa o Simples Nacional: identifique a atividade para obter a alíquota efetiva real.`,
      formula: `${brl(receita)} × ${pct(aliquota)}`,
    };
  }

  const rbt12 = fatorR?.rbt12 ?? 0;
  const efetiva = calcularAliquotaEfetiva(rbt12, anexo);
  const { faixa, composicao } = efetiva;

  /*
   * A composição vem da planilha do contador: o DAS se reparte entre
   * tributos federais e ISS, e o ISS trava em 5 pontos percentuais.
   * O teto REDISTRIBUI — o total não muda —, mas o contador precisa
   * ver que ele foi acionado, porque muda o que a prefeitura recebe.
   */
  const detalheComposicao = ` Reparte-se em ${pct(
    composicao.federal,
  )} de tributos federais e ${pct(composicao.local)} de ISS${
    composicao.tetoLocalAplicado
      ? `, com o ISS travado no teto de ${REGRAS.simplesNacional.tetoIssPontos.valor} pontos percentuais e o excedente redistribuído à União`
      : ""
  }.`;

  return {
    aliquota: efetiva.aliquota,
    impostoFaturamento: arredondar(receita * efetiva.aliquota),
    rotulo: `Simples Nacional — Anexo ${anexo} (DAS)`,
    premissa: "Simples Nacional — tabelas por anexo",
    explicacao: `Alíquota efetiva de ${pct(
      efetiva.aliquota,
    )} sobre o faturamento do mês, apurada no Anexo ${anexo} para uma RBT12 de ${brl(
      efetiva.rbt12,
    )}: faixa de ${pct(faixa.aliquota)} com parcela a deduzir de ${brl(
      faixa.parcelaADeduzir,
    )}.${detalheComposicao}`,
    formula: `${brl(receita)} × ${pct(efetiva.aliquota)}`,
  };
}

function montarCenario(args: {
  tipo: TipoAtuacao;
  nome: string;
  receita: number;
  custos: number;
  encargos: readonly Encargo[];
  totalEncargos: number;
  liquido: number;
  passos: readonly PassoCalculo[];
}): ResultadoCenario {
  const { receita } = args;
  return {
    tipo: args.tipo,
    nome: args.nome,
    receitaMensal: receita,
    custosMensais: args.custos,
    encargosMensais: args.totalEncargos,
    encargos: args.encargos,
    liquidoMensal: args.liquido,
    liquidoAnual: arredondar(args.liquido * REGRAS.mesesNoAno.valor),
    margemLiquida: receita > 0 ? args.liquido / receita : 0,
    cargaSobreReceita: receita > 0 ? args.totalEncargos / receita : 0,
    passos: args.passos,
  };
}

/** Compara os dois cenários com a mesma entrada e o mesmo enquadramento. */
export function compararCenarios(
  entrada: EntradaSimulacao,
  classificacao: Classificacao = classificacaoDe(entrada),
): Comparacao {
  const pessoaFisica = calcularCenarioPessoaFisica(entrada);
  const cnpj = calcularCenarioCnpj(entrada, classificacao);
  const diferencaMensal = arredondar(
    Math.abs(cnpj.liquidoMensal - pessoaFisica.liquidoMensal),
  );

  let vencedor: TipoAtuacao | null = null;
  if (cnpj.liquidoMensal > pessoaFisica.liquidoMensal) vencedor = "cnpj";
  else if (pessoaFisica.liquidoMensal > cnpj.liquidoMensal)
    vencedor = "pessoa-fisica";

  return {
    pessoaFisica,
    cnpj,
    vencedor,
    diferencaMensal,
    diferencaAnual: arredondar(diferencaMensal * REGRAS.mesesNoAno.valor),
  };
}

/** Enquadramento derivado da entrada. Um lugar só decide o anexo. */
export function classificacaoDe(entrada: EntradaSimulacao): Classificacao {
  return classificar({
    atividadeId: entrada.atividadeId,
    anexoManual: entrada.anexoManual,
    motivoAnexoManual: entrada.motivoAnexoManual,
    receitaMensal: entrada.receitaMensal,
    rbt12: entrada.rbt12,
    folha12m: entrada.folha12m,
  });
}

/**
 * Ponto de entrada único do motor de cálculo.
 *
 * A ordem reproduz o raciocínio do contador: primeiro o enquadramento,
 * depois os números. A classificação é apurada UMA vez e atravessa o
 * cálculo inteiro — a interface exibe exatamente o anexo que produziu
 * o resultado, nunca um recalculado à parte.
 */
export function simular(entrada: EntradaSimulacao): Simulacao {
  const classificacao = classificacaoDe(entrada);
  const comparacao = compararCenarios(entrada, classificacao);
  return {
    entrada,
    classificacao,
    comparacao,
    principal:
      entrada.tipoAtuacao === "cnpj" ? comparacao.cnpj : comparacao.pessoaFisica,
    versaoRegras: VERSAO_REGRAS,
  };
}
