/**
 * REGRAS E PREMISSAS DE CÁLCULO — Clareza V1
 * ------------------------------------------------------------------
 * Este é o ÚNICO lugar do sistema onde existem valores numéricos de
 * natureza tributária/contábil. Nenhum componente React deve conter
 * alíquotas, tetos ou faixas.
 *
 * TODAS as premissas abaixo são SIMPLIFICAÇÕES DE MVP e precisam de
 * validação por um contador antes de qualquer uso profissional.
 *
 * Cada premissa carrega metadados (`descricao`, `porQueExiste`,
 * `status`) que são exibidos na interface, na seção
 * "Como chegamos a esse resultado?". Isso torna o modelo auditável.
 *
 * Para alterar o comportamento do simulador, altere este arquivo.
 */

export type StatusPremissa =
  | "hipotese-temporaria"
  | "a-validar"
  | "validada-tecnicamente"
  | "nao-aplicavel";

export const ROTULO_STATUS: Record<StatusPremissa, string> = {
  "hipotese-temporaria": "Hipótese temporária",
  "a-validar": "A validar com contador",
  "validada-tecnicamente": "Validada tecnicamente",
  "nao-aplicavel": "Não aplicável",
};

/** Metadados de auditoria de uma premissa isolada. */
export interface Premissa<T> {
  readonly valor: T;
  /** O que a premissa representa, em português simples. */
  readonly descricao: string;
  /** Por que ela existe no MVP e o que ela simplifica. */
  readonly porQueExiste: string;
  readonly status: StatusPremissa;
  /** Cenários em que a premissa é aplicada. */
  readonly ondeUsada: string;
}

function premissa<T>(p: Premissa<T>): Premissa<T> {
  return p;
}

/** Faixa da tabela progressiva mensal do IRPF. */
export interface FaixaIrpf {
  /** Limite superior da faixa (base mensal em R$). `null` = sem limite. */
  readonly ate: number | null;
  readonly aliquota: number;
  readonly parcelaADeduzir: number;
}

/**
 * Versão do conjunto de regras. Sempre que o contador revisar as
 * premissas, incremente esta string — ela é gravada junto de cada
 * simulação salva, para sabermos com qual modelo o número foi gerado.
 */
export const VERSAO_REGRAS = "v1.1-2026-08";

export const REGRAS = {
  /** Meses considerados na projeção anual. */
  mesesNoAno: premissa({
    valor: 12,
    descricao: "Número de meses usados para projetar o resultado anual.",
    porQueExiste:
      "O MVP assume receita e custos constantes ao longo do ano. Não considera sazonalidade, 13º, férias nem meses sem faturamento.",
    status: "hipotese-temporaria",
    ondeUsada: "Projeção anual dos dois cenários",
  }),

  pessoaFisica: {
    inssAliquota: premissa({
      valor: 0.2,
      descricao:
        "Alíquota de INSS do contribuinte individual (autônomo) sobre o salário de contribuição.",
      porQueExiste:
        "Confirmado na revisão contábil de agosto/2026: como autônomo, o recolhimento recai sobre 20%, e essa é a regra geral. A retenção de 11% pelo tomador pessoa jurídica foi avaliada e deliberadamente ignorada — é antecipação de pagamento e não altera o resultado prático. O plano simplificado (11%) segue fora do escopo.",
      status: "validada-tecnicamente",
      ondeUsada: "Cenário Pessoa Física",
    }),
    inssTeto: premissa({
      valor: 8475.55,
      descricao:
        "Teto do salário de contribuição do INSS (valor mensal máximo sobre o qual incide a alíquota).",
      porQueExiste:
        "Valor informado na revisão contábil de agosto/2026, em substituição aos R$ 8.157,41 usados no MVP. Muda anualmente: precisa ser reconferido a cada virada de ano.",
      status: "validada-tecnicamente",
      ondeUsada: "Cenário Pessoa Física",
    }),
    inssPiso: premissa({
      valor: 1621,
      descricao:
        "Piso do salário de contribuição do INSS (equivalente ao salário mínimo).",
      porQueExiste:
        "Valor informado na revisão contábil de agosto/2026, em substituição aos R$ 1.518,00 usados no MVP. Assumimos que o autônomo contribui pelo menos sobre o piso quando há atividade. Muda anualmente.",
      status: "validada-tecnicamente",
      ondeUsada: "Cenário Pessoa Física",
    }),
    irpfFaixas: premissa<readonly FaixaIrpf[]>({
      valor: [
        { ate: 2259.2, aliquota: 0, parcelaADeduzir: 0 },
        { ate: 2826.65, aliquota: 0.075, parcelaADeduzir: 169.44 },
        { ate: 3751.05, aliquota: 0.15, parcelaADeduzir: 381.44 },
        { ate: 4664.68, aliquota: 0.225, parcelaADeduzir: 662.77 },
        { ate: null, aliquota: 0.275, parcelaADeduzir: 896 },
      ],
      descricao:
        "Tabela progressiva mensal do IRPF aplicada sobre a base do carnê-leão.",
      porQueExiste:
        "⚠️ SABIDAMENTE DESATUALIZADA. A revisão contábil de agosto/2026 confirmou que estas faixas precisam ser substituídas e que a nova regra inclui a isenção até R$ 5.000,00 — mas as faixas exatas ainda não foram informadas. Não preenchemos por conta própria: a isenção não é uma faixa a mais, envolve um redutor na transição, e chutar o desenho distorceria justamente a faixa de renda mais comum. Bloqueio nº 1 do modelo. O MVP também não aplica desconto simplificado, dependentes, despesas médicas, educação nem ajuste anual.",
      status: "hipotese-temporaria",
      ondeUsada: "Cenário Pessoa Física e pró-labore do cenário CNPJ",
    }),
  },

  cnpj: {
    aliquotaEfetivaFaturamento: premissa({
      valor: 0.11,
      descricao:
        "Alíquota efetiva única estimada sobre o faturamento, cobrindo os tributos da empresa prestadora de serviços.",
      porQueExiste:
        "⚠️ SABIDAMENTE INCORRETA POR CONSTRUÇÃO. A revisão contábil de agosto/2026 apontou que ignorar o Fator R é o que torna o resultado errado, não apenas impreciso: atividade de cunho intelectual transita entre o Anexo V (a partir de 15,5%) e o Anexo III (a partir de 6%) conforme a folha atinja 28% do faturamento. Uma alíquota única de 11% apaga uma diferença de até 9,5 pontos percentuais. Corrigir exige escolha de anexo, Fator R e as tabelas completas do Simples com RBT12 — ainda não recebidas. Bloqueio nº 2 do modelo.",
      status: "hipotese-temporaria",
      ondeUsada: "Cenário CNPJ",
    }),
    custoContabilidadeMensal: premissa({
      valor: 300,
      descricao:
        "Custo mensal médio de honorários contábeis e obrigações acessórias da empresa.",
      porQueExiste:
        "Manter uma empresa tem custo fixo que a Pessoa Física não tem. Ignorar isso distorceria a comparação. O valor é editável pelo usuário.",
      status: "a-validar",
      ondeUsada: "Cenário CNPJ",
    }),
    inssProLaboreAliquota: premissa({
      valor: 0.11,
      descricao:
        "INSS retido do sócio sobre o pró-labore (contribuinte individual com desconto da empresa).",
      porQueExiste:
        "Assumimos que a contribuição patronal (CPP) já está contida na alíquota efetiva sobre o faturamento. O MVP não trata empresas fora dessa hipótese.",
      status: "a-validar",
      ondeUsada: "Cenário CNPJ",
    }),
    proLaborePercentualSugerido: premissa({
      valor: 0.28,
      descricao:
        "Percentual do faturamento sugerido como pró-labore padrão na simulação.",
      porQueExiste:
        "A revisão contábil de agosto/2026 confirmou que 28% é exatamente o patamar do Fator R: atingido pela folha, a empresa migra do Anexo V para o Anexo III. Isso valida a origem do número, mas não o valida como sugestão de pró-labore — a pergunta sobre qual valor sugerir por padrão segue sem resposta. O simulador continua NÃO calculando Fator R nem troca de anexo.",
      status: "hipotese-temporaria",
      ondeUsada: "Valor padrão do formulário no cenário CNPJ",
    }),
    lucroDistribuidoIsento: premissa({
      valor: true,
      descricao:
        "O lucro distribuído ao sócio, após o pró-labore, é tratado como isento de IRPF.",
      porQueExiste:
        "Hipótese usual para empresas do Simples com escrituração adequada. O MVP não verifica limites de distribuição isenta nem regras de tributação de dividendos.",
      status: "a-validar",
      ondeUsada: "Cenário CNPJ",
    }),
  },
} as const;

/** Lista achatada das premissas, para exibição auditável na interface. */
export interface PremissaListada {
  readonly chave: string;
  readonly grupo: "Geral" | "Pessoa Física" | "CNPJ";
  readonly valorFormatado: string;
  readonly descricao: string;
  readonly porQueExiste: string;
  readonly status: StatusPremissa;
  readonly ondeUsada: string;
}

const pct = (v: number) =>
  `${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Achata `REGRAS` em uma lista exibível. Mantido aqui (e não na UI)
 * para que a documentação da premissa viva ao lado do seu valor.
 */
export function listarPremissas(): readonly PremissaListada[] {
  const { pessoaFisica: pf, cnpj } = REGRAS;
  const faixaTopo = pf.irpfFaixas.valor[pf.irpfFaixas.valor.length - 1];

  return [
    {
      chave: "Meses no ano",
      grupo: "Geral",
      valorFormatado: `${REGRAS.mesesNoAno.valor} meses`,
      ...meta(REGRAS.mesesNoAno),
    },
    {
      chave: "INSS — alíquota",
      grupo: "Pessoa Física",
      valorFormatado: pct(pf.inssAliquota.valor),
      ...meta(pf.inssAliquota),
    },
    {
      chave: "INSS — teto de contribuição",
      grupo: "Pessoa Física",
      valorFormatado: `${brl(pf.inssTeto.valor)}/mês`,
      ...meta(pf.inssTeto),
    },
    {
      chave: "INSS — piso de contribuição",
      grupo: "Pessoa Física",
      valorFormatado: `${brl(pf.inssPiso.valor)}/mês`,
      ...meta(pf.inssPiso),
    },
    {
      chave: "IRPF — tabela progressiva mensal",
      grupo: "Pessoa Física",
      valorFormatado: `${pf.irpfFaixas.valor.length} faixas, de 0% a ${pct(
        faixaTopo.aliquota,
      )}`,
      ...meta(pf.irpfFaixas),
    },
    {
      chave: "Alíquota efetiva sobre o faturamento",
      grupo: "CNPJ",
      valorFormatado: pct(cnpj.aliquotaEfetivaFaturamento.valor),
      ...meta(cnpj.aliquotaEfetivaFaturamento),
    },
    {
      chave: "Custo contábil mensal",
      grupo: "CNPJ",
      valorFormatado: `${brl(cnpj.custoContabilidadeMensal.valor)}/mês`,
      ...meta(cnpj.custoContabilidadeMensal),
    },
    {
      chave: "INSS sobre pró-labore",
      grupo: "CNPJ",
      valorFormatado: pct(cnpj.inssProLaboreAliquota.valor),
      ...meta(cnpj.inssProLaboreAliquota),
    },
    {
      chave: "Pró-labore sugerido",
      grupo: "CNPJ",
      valorFormatado: `${pct(cnpj.proLaborePercentualSugerido.valor)} do faturamento`,
      ...meta(cnpj.proLaborePercentualSugerido),
    },
    {
      chave: "Lucro distribuído",
      grupo: "CNPJ",
      valorFormatado: cnpj.lucroDistribuidoIsento.valor
        ? "Tratado como isento"
        : "Tributado",
      ...meta(cnpj.lucroDistribuidoIsento),
    },
  ];
}

export interface ResumoValidacao {
  readonly total: number;
  /** Quantas ainda não foram revisadas por um contador. */
  readonly pendentes: number;
  readonly validadas: number;
  readonly porStatus: Readonly<Record<StatusPremissa, number>>;
}

/**
 * Situação de validação do modelo, derivada das premissas reais.
 * A interface nunca deve escrever esses números à mão — eles mudam
 * sozinhos conforme o contador revisa as regras.
 */
export function resumoValidacao(): ResumoValidacao {
  const premissas = listarPremissas();
  const porStatus: Record<StatusPremissa, number> = {
    "hipotese-temporaria": 0,
    "a-validar": 0,
    "validada-tecnicamente": 0,
    "nao-aplicavel": 0,
  };
  for (const p of premissas) porStatus[p.status] += 1;

  return {
    total: premissas.length,
    pendentes:
      porStatus["hipotese-temporaria"] + porStatus["a-validar"],
    validadas: porStatus["validada-tecnicamente"],
    porStatus,
  };
}

function meta<T>(p: Premissa<T>) {
  return {
    descricao: p.descricao,
    porQueExiste: p.porQueExiste,
    status: p.status,
    ondeUsada: p.ondeUsada,
  };
}
