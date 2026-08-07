/**
 * MOTOR DE CÁLCULO — funções puras, determinísticas e sem React.
 *
 * Fluxo: entrada validada → cálculo por cenário → comparação → resultado.
 *
 * Regra de ouro deste arquivo: nenhum número mágico. Todo parâmetro
 * tributário vem de `calculation-rules.ts`.
 */

import { REGRAS, VERSAO_REGRAS, type FaixaIrpf } from "./calculation-rules";
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
 * INSS do contribuinte individual.
 * O salário de contribuição é limitado ao teto; quando há base positiva
 * abaixo do piso, assume-se contribuição sobre o piso.
 */
export function calcularInssAutonomo(base: number): number {
  const { inssAliquota, inssPiso, inssTeto } = REGRAS.pessoaFisica;
  const baseValida = naoNegativo(base);
  if (baseValida === 0) return 0;
  const salarioContribuicao = Math.min(
    Math.max(baseValida, inssPiso.valor),
    inssTeto.valor,
  );
  return arredondar(salarioContribuicao * inssAliquota.valor);
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

  const base = calcularBaseLivroCaixa(receita, custos);
  const inss = calcularInssAutonomo(base);
  const baseIrpf = arredondar(Math.max(0, base - inss));
  const irpf = calcularIrpfMensal(baseIrpf);
  const faixa = faixaIrpfDe(baseIrpf);

  const encargos: Encargo[] = [
    {
      rotulo: "INSS (contribuinte individual)",
      valorMensal: inss,
      explicacao: `${pct(
        REGRAS.pessoaFisica.inssAliquota.valor,
      )} sobre o salário de contribuição, respeitando piso de ${brl(
        REGRAS.pessoaFisica.inssPiso.valor,
      )} e teto de ${brl(REGRAS.pessoaFisica.inssTeto.valor)}.`,
    },
    {
      rotulo: "IRPF (carnê-leão)",
      valorMensal: irpf,
      explicacao: `Tabela progressiva mensal: faixa de ${pct(
        faixa.aliquota,
      )} com parcela a deduzir de ${brl(faixa.parcelaADeduzir)}.`,
    },
  ];

  const totalEncargos = arredondar(inss + irpf);
  const liquido = arredondar(base - totalEncargos);

  const passos: PassoCalculo[] = [
    {
      rotulo: "Base do livro-caixa",
      formula: `${brl(receita)} − ${brl(custos)}`,
      valor: base,
    },
    {
      rotulo: "INSS",
      formula: `${brl(
        Math.min(
          Math.max(base, base > 0 ? REGRAS.pessoaFisica.inssPiso.valor : 0),
          REGRAS.pessoaFisica.inssTeto.valor,
        ),
      )} × ${pct(REGRAS.pessoaFisica.inssAliquota.valor)}`,
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
      rotulo: "Resultado líquido mensal",
      formula: `${brl(base)} − ${brl(inss)} − ${brl(irpf)}`,
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
 * Alíquota efetiva única sobre o faturamento + custo contábil +
 * encargos do pró-labore. Lucro distribuído tratado como isento.
 */
export function calcularCenarioCnpj(
  entrada: EntradaSimulacao,
): ResultadoCenario {
  const receita = arredondar(naoNegativo(entrada.receitaMensal));
  const custos = arredondar(naoNegativo(entrada.custosMensais));
  const contabilidade = arredondar(naoNegativo(entrada.custoContabilidade));
  /* O pró-labore não pode ser maior que o faturamento: seria incoerente. */
  const proLabore = arredondar(
    Math.min(naoNegativo(entrada.proLabore), receita),
  );

  const aliquota = REGRAS.cnpj.aliquotaEfetivaFaturamento.valor;
  const impostoFaturamento = arredondar(receita * aliquota);

  const inssProLabore = arredondar(
    Math.min(proLabore, REGRAS.pessoaFisica.inssTeto.valor) *
      REGRAS.cnpj.inssProLaboreAliquota.valor,
  );
  const baseIrrf = arredondar(Math.max(0, proLabore - inssProLabore));
  const irrfProLabore = calcularIrpfMensal(baseIrrf);
  const faixa = faixaIrpfDe(baseIrrf);

  const encargos: Encargo[] = [
    {
      rotulo: "Tributos sobre o faturamento",
      valorMensal: impostoFaturamento,
      explicacao: `Alíquota efetiva única de ${pct(
        aliquota,
      )} sobre o faturamento. Simplificação do MVP no lugar das tabelas do Simples Nacional.`,
    },
    {
      rotulo: "Honorários contábeis",
      valorMensal: contabilidade,
      explicacao:
        "Custo fixo de manter a empresa regular. Não existe no cenário Pessoa Física.",
    },
    {
      rotulo: "INSS sobre pró-labore",
      valorMensal: inssProLabore,
      explicacao: `${pct(
        REGRAS.cnpj.inssProLaboreAliquota.valor,
      )} retidos do sócio sobre o pró-labore de ${brl(proLabore)}.`,
    },
    {
      rotulo: "IRRF sobre pró-labore",
      valorMensal: irrfProLabore,
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
      rotulo: "Tributos sobre o faturamento",
      formula: `${brl(receita)} × ${pct(aliquota)}`,
      valor: impostoFaturamento,
      premissa: "Alíquota efetiva sobre o faturamento",
    },
    {
      rotulo: "Honorários contábeis",
      formula: "Valor informado na simulação",
      valor: contabilidade,
      premissa: "Custo contábil mensal",
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

/** Compara os dois cenários com a mesma entrada. */
export function compararCenarios(entrada: EntradaSimulacao): Comparacao {
  const pessoaFisica = calcularCenarioPessoaFisica(entrada);
  const cnpj = calcularCenarioCnpj(entrada);
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

/** Ponto de entrada único do motor de cálculo. */
export function simular(entrada: EntradaSimulacao): Simulacao {
  const comparacao = compararCenarios(entrada);
  return {
    entrada,
    comparacao,
    principal:
      entrada.tipoAtuacao === "cnpj" ? comparacao.cnpj : comparacao.pessoaFisica,
    versaoRegras: VERSAO_REGRAS,
  };
}
