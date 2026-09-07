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
 * Anexo do Simples Nacional (LC 123/2006, com a redação da LC 155/2016).
 *
 * A ordem é a da lei, não uma escala de valor: o Anexo III não é
 * "melhor" que o V, é outro conjunto de atividades.
 */
export type Anexo = "I" | "II" | "III" | "IV" | "V";

export const ROTULO_ANEXO: Record<Anexo, string> = {
  I: "Anexo I — Comércio",
  II: "Anexo II — Indústria",
  III: "Anexo III — Serviços",
  IV: "Anexo IV — Serviços com CPP fora do DAS",
  V: "Anexo V — Serviços intelectuais",
};

/**
 * Faixa de uma tabela do Simples Nacional.
 *
 * `ate` é o limite superior da RECEITA BRUTA DOS ÚLTIMOS 12 MESES
 * (RBT12) — não do faturamento do mês.
 *
 * Diferente da tabela do IRPF, aqui NÃO existe faixa aberta: a última
 * fecha no teto do regime, porque acima dele não há mais Simples. Um
 * `null` no fim fingiria que a tabela continua e devolveria imposto
 * para uma empresa que já deveria estar em outro regime.
 */
export interface FaixaSimples {
  readonly ate: number;
  readonly aliquota: number;
  readonly parcelaADeduzir: number;
  /**
   * Como a alíquota efetiva se reparte entre a União e o tributo
   * local (ICMS no comércio/indústria, ISS nos serviços).
   *
   * Frações que somam 1. É o que permite decompor o DAS e, no caso
   * dos serviços, saber quando a parcela do ISS bate no teto de 5
   * pontos percentuais.
   */
  readonly reparticao: {
    readonly federal: number;
    readonly local: number;
  };
}

export type TabelasSimples = Readonly<Record<Anexo, readonly FaixaSimples[]>>;

/**
 * Versão do conjunto de regras. Sempre que o contador revisar as
 * premissas, incremente esta string — ela é gravada junto de cada
 * simulação salva, para sabermos com qual modelo o número foi gerado.
 */
export const VERSAO_REGRAS = "v1.3-2026-09";

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

  simplesNacional: {
    limiteRbt12: premissa({
      valor: 4_800_000,
      descricao:
        "Teto de receita bruta acumulada em 12 meses para permanecer no Simples Nacional.",
      porQueExiste:
        "Acima deste valor a empresa sai do Simples e passa a Lucro Presumido ou Real — regimes que este simulador NÃO calcula. Serve para bloquear o cálculo em vez de devolver um número inventado.",
      status: "validada-tecnicamente",
      ondeUsada: "Cenário CNPJ — validação da RBT12",
    }),

    fatorRLimite: premissa({
      valor: 0.28,
      descricao:
        "Proporção entre a folha dos últimos 12 meses e a receita bruta dos últimos 12 meses que leva uma atividade do Anexo V para o Anexo III.",
      porQueExiste:
        "LC 123/2006, art. 18: atingidos 28%, as atividades sujeitas ao Fator R são tributadas pelo Anexo III; abaixo disso, pelo Anexo V. O limite é de igualdade inclusiva — exatamente 28% já vale Anexo III. Confirmado na revisão contábil de agosto/2026. ⚠️ A validação de setembro/2026 respondeu \"Não\" à pergunta se 28% é o limite correto, sem justificar. O valor NÃO foi alterado: ele está no texto da LC 123/2006 e uma resposta de múltipla escolha não substitui base legal. Pode ter havido leitura diferente da pergunta — reaberto para confirmação.",
      status: "a-validar",
      ondeUsada: "Resolução do anexo aplicável no cenário CNPJ",
    }),

    fatorRComposicaoFolha: premissa({
      valor:
        "Salários, contribuição patronal, FGTS e pró-labore dos últimos 12 meses",
      descricao:
        "O que a lei manda somar no numerador do Fator R.",
      porQueExiste:
        "LC 123/2006, art. 18, § 24: a folha inclui a remuneração paga a pessoas físicas nos 12 meses anteriores, mais a contribuição patronal e o FGTS efetivamente recolhidos, INCLUÍDAS as retiradas de pró-labore. O simulador pede o total já somado, em um campo só — e a validação de setembro/2026 confirmou que um valor único basta. ⚠️ A mesma validação afirmou que \"FGTS não pode ser considerado, deve ser considerado pró-labore bruto\". A composição NÃO foi alterada: o § 24 cita o FGTS de forma expressa, e retirá-lo mudaria o anexo de parte dos clientes. Divergência reaberta para confirmação com a base legal em mãos.",
      status: "a-validar",
      ondeUsada: "Cálculo do Fator R",
    }),

    anexosComCalculo: premissa<readonly Anexo[]>({
      valor: ["III", "V"],
      descricao:
        "Anexos em que este simulador aceita calcular o cenário CNPJ.",
      porQueExiste:
        "III e V cobrem o prestador de serviço, que é o público da ferramenta, e nos dois a contribuição patronal está dentro do DAS — hipótese que o motor assume. O Anexo IV recolhe a CPP FORA da guia única e o cálculo ficaria errado por construção, então ele é classificado mas não calculado. I e II (comércio e indústria) estão fora do escopo do produto. ⚠️ A validação de setembro/2026 respondeu \"Não\" à pergunta se a contribuição patronal pode ser considerada dentro do DAS nos Anexos III e V, e pediu para implementar o Anexo IV \"agora\", mas respondeu \"Depende\" sobre calcular a CPP em separado. Nada foi alterado: aceitar o \"Não\" mudaria TODO cenário CNPJ do produto, e a exceção da CPP fora da guia é justamente o que define o Anexo IV na LC 123/2006. A pergunta pode ter sido mal formulada por nós. Reaberto.",
      status: "a-validar",
      ondeUsada: "Cenário CNPJ",
    }),

    tetoIssPontos: premissa({
      valor: 5,
      descricao:
        "Teto, em pontos percentuais da alíquota efetiva, da parcela destinada ao ISS.",
      porQueExiste:
        "LC 123/2006, art. 18: quando a repartição levaria o ISS acima de 5% da receita, a parcela do ISS trava em 5 pontos e o excedente é redistribuído aos tributos federais. NÃO muda o total do DAS — muda a composição. A planilha do contador embute isso como um limiar fixo por anexo (14,92537% no III e V, 12,5% no IV); aqui a regra é derivada da própria repartição da faixa, o que dá o mesmo resultado e continua valendo se a repartição mudar.",
      status: "a-validar",
      ondeUsada: "Composição do DAS nos anexos de serviço",
    }),

    mesesParaProporcionalizar: premissa({
      valor: 12,
      descricao:
        "Meses usados para anualizar a receita quando a empresa tem menos de 12 meses de atividade.",
      porQueExiste:
        "Empresa nova não tem 12 meses de histórico. A planilha do contador resolve isso dividindo a receita acumulada pelos meses de atividade e multiplicando por 12 — é a proporcionalização do art. 18, §2º da LC 123/2006. Substitui a projeção grosseira que fazíamos (receita do mês × 12), que só acertava quando havia exatamente um mês.",
      status: "a-validar",
      ondeUsada: "Cálculo da RBT12 de empresa com menos de 12 meses",
    }),

    tabelas: premissa<TabelasSimples>({
      valor: {
        I: [
          { ate: 180_000, aliquota: 0.04, parcelaADeduzir: 0, reparticao: { federal: 0.66, local: 0.34 } },
          { ate: 360_000, aliquota: 0.073, parcelaADeduzir: 5_940, reparticao: { federal: 0.66, local: 0.34 } },
          { ate: 720_000, aliquota: 0.095, parcelaADeduzir: 13_860, reparticao: { federal: 0.665, local: 0.335 } },
          { ate: 1_800_000, aliquota: 0.107, parcelaADeduzir: 22_500, reparticao: { federal: 0.665, local: 0.335 } },
          { ate: 3_600_000, aliquota: 0.143, parcelaADeduzir: 87_300, reparticao: { federal: 0.665, local: 0.335 } },
          { ate: 4_800_000, aliquota: 0.19, parcelaADeduzir: 378_000, reparticao: { federal: 1, local: 0 } },
        ],
        II: [
          { ate: 180_000, aliquota: 0.045, parcelaADeduzir: 0, reparticao: { federal: 0.68, local: 0.32 } },
          { ate: 360_000, aliquota: 0.078, parcelaADeduzir: 5_940, reparticao: { federal: 0.68, local: 0.32 } },
          { ate: 720_000, aliquota: 0.1, parcelaADeduzir: 13_860, reparticao: { federal: 0.68, local: 0.32 } },
          { ate: 1_800_000, aliquota: 0.112, parcelaADeduzir: 22_500, reparticao: { federal: 0.68, local: 0.32 } },
          { ate: 3_600_000, aliquota: 0.147, parcelaADeduzir: 85_500, reparticao: { federal: 0.68, local: 0.32 } },
          { ate: 4_800_000, aliquota: 0.3, parcelaADeduzir: 720_000, reparticao: { federal: 1, local: 0 } },
        ],
        III: [
          { ate: 180_000, aliquota: 0.06, parcelaADeduzir: 0, reparticao: { federal: 0.665, local: 0.335 } },
          { ate: 360_000, aliquota: 0.112, parcelaADeduzir: 9_360, reparticao: { federal: 0.68, local: 0.32 } },
          { ate: 720_000, aliquota: 0.135, parcelaADeduzir: 17_640, reparticao: { federal: 0.675, local: 0.325 } },
          { ate: 1_800_000, aliquota: 0.16, parcelaADeduzir: 35_640, reparticao: { federal: 0.675, local: 0.325 } },
          { ate: 3_600_000, aliquota: 0.21, parcelaADeduzir: 125_640, reparticao: { federal: 0.665, local: 0.335 } },
          { ate: 4_800_000, aliquota: 0.33, parcelaADeduzir: 648_000, reparticao: { federal: 1, local: 0 } },
        ],
        IV: [
          { ate: 180_000, aliquota: 0.045, parcelaADeduzir: 0, reparticao: { federal: 0.555, local: 0.445 } },
          { ate: 360_000, aliquota: 0.09, parcelaADeduzir: 8_100, reparticao: { federal: 0.6, local: 0.4 } },
          { ate: 720_000, aliquota: 0.102, parcelaADeduzir: 12_420, reparticao: { federal: 0.6, local: 0.4 } },
          { ate: 1_800_000, aliquota: 0.14, parcelaADeduzir: 39_780, reparticao: { federal: 0.6, local: 0.4 } },
          { ate: 3_600_000, aliquota: 0.22, parcelaADeduzir: 183_780, reparticao: { federal: 0.6, local: 0.4 } },
          { ate: 4_800_000, aliquota: 0.33, parcelaADeduzir: 828_000, reparticao: { federal: 1, local: 0 } },
        ],
        V: [
          { ate: 180_000, aliquota: 0.155, parcelaADeduzir: 0, reparticao: { federal: 0.86, local: 0.14 } },
          { ate: 360_000, aliquota: 0.18, parcelaADeduzir: 4_500, reparticao: { federal: 0.83, local: 0.17 } },
          { ate: 720_000, aliquota: 0.195, parcelaADeduzir: 9_900, reparticao: { federal: 0.81, local: 0.19 } },
          { ate: 1_800_000, aliquota: 0.205, parcelaADeduzir: 17_100, reparticao: { federal: 0.79, local: 0.21 } },
          { ate: 3_600_000, aliquota: 0.23, parcelaADeduzir: 62_100, reparticao: { federal: 0.765, local: 0.235 } },
          { ate: 4_800_000, aliquota: 0.305, parcelaADeduzir: 540_000, reparticao: { federal: 1, local: 0 } },
        ],
      },
      descricao:
        "Tabelas de alíquota nominal e parcela a deduzir dos cinco anexos do Simples Nacional, por faixa de RBT12.",
      porQueExiste:
        "Substituem a alíquota efetiva única de 11% que a revisão contábil de agosto/2026 apontou como errada por construção. Transcritas dos anexos da LC 123/2006 (redação da LC 155/2016) e conferidas contra duas referências profissionais de 2026. As alíquotas iniciais batem com as que o contador informou: I 4%, II 4,5%, III 6%, IV 4,5%, V 15,5%. Falta o aceite formal do contador sobre a transcrição completa.",
      status: "a-validar",
      ondeUsada: "Cenário CNPJ — alíquota efetiva sobre o faturamento",
    }),
  },

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
    custoContabilidadeMensal: premissa({
      valor: 150,
      descricao:
        "Honorários contábeis mensais do autônomo, como valor de partida editável.",
      porQueExiste:
        "A revisão de agosto/2026 pediu que o custo contábil da PF fosse editável em separado do da empresa, porque costuma ser bem menor — e proibiu amarrar um ao outro. Na época o padrão era ZERO, porque não tínhamos referência e um número inventado inclinaria a comparação em silêncio. A validação de setembro/2026 fechou essa lacuna: perguntado qual valor usaria como referência inicial, o contador respondeu R$ 150,00. Zero, agora, seria a distorção — a PF entrava na comparação sem nenhum custo contábil enquanto a empresa entrava com R$ 300,00, favorecendo a Pessoa Física por construção. O contador continua informando o valor real do cliente.",
      status: "a-validar",
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
        "⚠️ SABIDAMENTE DESATUALIZADA — e o bloqueio nº 1 do modelo. A validação de setembro/2026 trouxe a fonte oficial (Lei 15.270/2025, tabelas da Receita Federal para 2026) e, com ela, uma DIVERGÊNCIA que impede transcrever a regra: o contador marcou que a isenção até R$ 5.000,00 é uma \"faixa com imposto zero\", mas a própria fonte que ele indicou descreve um REDUTOR aplicado depois do cálculo — até R$ 312,89 para zerar o imposto até R$ 5.000,00, e, entre R$ 5.000,01 e R$ 7.350,00, R$ 978,62 − (0,133145 × rendimento), decrescendo até zero. A pergunta que pedia a fórmula ficou em branco. Implementar como faixa distorceria exatamente a faixa de renda mais comum entre os clientes. Falta também confirmar se o redutor alcança o CARNÊ-LEÃO do autônomo e o IRRF sobre pró-labore: a fonte consultada trata de rendimento assalariado, e o contador afirmou que vale para os dois — afirmação que precisa de base legal antes de virar código. O MVP também não aplica desconto simplificado, dependentes, despesas médicas, educação nem ajuste anual.",
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
        "⚠️ SOBREVIVENTE, E APENAS COMO ÚLTIMO RECURSO. Deixou de ser o caminho normal: com a atividade identificada, o motor usa as tabelas reais do Simples, o RBT12 e o Fator R. Esta alíquota só entra quando a CLASSIFICAÇÃO ESTÁ PENDENTE — atividade não encontrada no catálogo — e o resultado nesse caso vem marcado como estimativa sem enquadramento. Continua errada por construção pelo motivo apontado em agosto/2026: uma alíquota única apaga a diferença de até 9,5 pontos entre os Anexos III e V.",
      status: "hipotese-temporaria",
      ondeUsada: "Cenário CNPJ",
    }),
    custoContabilidadeMensal: premissa({
      valor: 300,
      descricao:
        "Honorários contábeis mensais da EMPRESA, incluindo obrigações acessórias.",
      porQueExiste:
        "Manter uma empresa tem custo fixo que a Pessoa Física não tem. É um valor de partida editável, INDEPENDENTE do honorário da PF: a revisão de agosto/2026 vetou usar um número só para os dois cenários, porque a diferença entre eles é justamente parte do que se está comparando. A validação de setembro/2026 confirmou os R$ 300,00 como referência razoável. Quanto varia por região e porte segue em aberto.",
      status: "a-validar",
      ondeUsada: "Cenário CNPJ",
    }),
    inssProLaboreAliquota: premissa({
      valor: 0.11,
      descricao:
        "INSS retido do sócio sobre o pró-labore (contribuinte individual com desconto da empresa).",
      porQueExiste:
        "Confirmado na validação de setembro/2026 como correto para os cenários simulados. Assumimos que a contribuição patronal (CPP) já está contida no DAS — hipótese que a mesma validação colocou em dúvida para os Anexos III e V (ver `anexosComCalculo`). O MVP não trata empresas fora dessa hipótese.",
      status: "validada-tecnicamente",
      ondeUsada: "Cenário CNPJ",
    }),
    proLaborePercentualSugerido: premissa({
      valor: 0.28,
      descricao:
        "Percentual do faturamento sugerido como pró-labore padrão na simulação.",
      porQueExiste:
        "A revisão de agosto/2026 confirmou que 28% é exatamente o patamar do Fator R: atingido pela folha, a empresa migra do Anexo V para o Anexo III. A validação de setembro/2026 fechou o resto da pergunta — os 28% servem como CAMINHO a simular, não como pró-labore de partida: \"de início não devemos jogar os 28% no pró-labore, isso deve ser um caminho a parte\". Desde a v2.8 o campo não é mais preenchido sozinho; o número aparece como sugestão, com a origem escrita e um botão para aplicar.",
      status: "a-validar",
      ondeUsada: "Sugestão de preenchimento no cenário CNPJ, aplicada sob comando",
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
  readonly grupo: "Geral" | "Simples Nacional" | "Pessoa Física" | "CNPJ";
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
  const { pessoaFisica: pf, cnpj, simplesNacional: sn } = REGRAS;
  const faixaTopo = pf.irpfFaixas.valor[pf.irpfFaixas.valor.length - 1];

  return [
    {
      chave: "Meses no ano",
      grupo: "Geral",
      valorFormatado: `${REGRAS.mesesNoAno.valor} meses`,
      ...meta(REGRAS.mesesNoAno),
    },
    {
      chave: "Simples Nacional — tabelas por anexo",
      grupo: "Simples Nacional",
      valorFormatado: `${Object.keys(sn.tabelas.valor).length} anexos, ${
        sn.tabelas.valor.III.length
      } faixas de RBT12 cada`,
      ...meta(sn.tabelas),
    },
    {
      chave: "Fator R — limite",
      grupo: "Simples Nacional",
      valorFormatado: `${pct(sn.fatorRLimite.valor)} da receita`,
      ...meta(sn.fatorRLimite),
    },
    {
      chave: "Fator R — composição da folha",
      grupo: "Simples Nacional",
      valorFormatado: sn.fatorRComposicaoFolha.valor,
      ...meta(sn.fatorRComposicaoFolha),
    },
    {
      chave: "Anexos com cálculo suportado",
      grupo: "Simples Nacional",
      valorFormatado: sn.anexosComCalculo.valor
        .map((a) => `Anexo ${a}`)
        .join(" e "),
      ...meta(sn.anexosComCalculo),
    },
    {
      chave: "Teto do ISS no DAS",
      grupo: "Simples Nacional",
      valorFormatado: `${sn.tetoIssPontos.valor} pontos percentuais`,
      ...meta(sn.tetoIssPontos),
    },
    {
      chave: "Proporcionalização da RBT12",
      grupo: "Simples Nacional",
      valorFormatado: `Receita acumulada ÷ meses de atividade × ${sn.mesesParaProporcionalizar.valor}`,
      ...meta(sn.mesesParaProporcionalizar),
    },
    {
      chave: "Teto da RBT12 no Simples",
      grupo: "Simples Nacional",
      valorFormatado: `${brl(sn.limiteRbt12.valor)} em 12 meses`,
      ...meta(sn.limiteRbt12),
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
      chave: "Honorários contábeis — Autônomo/PF",
      grupo: "Pessoa Física",
      valorFormatado: `${brl(pf.custoContabilidadeMensal.valor)}/mês`,
      ...meta(pf.custoContabilidadeMensal),
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
      chave: "Alíquota de recurso — classificação pendente",
      grupo: "CNPJ",
      valorFormatado: pct(cnpj.aliquotaEfetivaFaturamento.valor),
      ...meta(cnpj.aliquotaEfetivaFaturamento),
    },
    {
      chave: "Honorários contábeis — Empresa/PJ",
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
