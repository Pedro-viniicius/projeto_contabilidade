/**
 * CATÁLOGO DE ATIVIDADES — dados estruturados de classificação.
 *
 * Extensão declarada da regra nº 1 do projeto: aqui não há alíquota,
 * teto nem faixa (esses continuam só em `calculation-rules.ts`). O que
 * mora aqui é o VÍNCULO entre uma atividade e os anexos que ela pode
 * ocupar — informação tributária que precisa ser auditável pelo
 * contador sem ler JSX, e por isso vive no domínio.
 *
 * REGRA DE OURO: a classificação NUNCA é inferida do texto do rótulo.
 * Nada de `descricao.includes("engenharia")`. Uma atividade só é
 * classificada se estiver neste catálogo, com CNAE e fonte. O que não
 * está aqui sai como CLASSIFICAÇÃO PENDENTE — nunca como um anexo
 * chutado.
 *
 * ESCOPO DESTA VERSÃO: subconjunto controlado de atividades de
 * prestação de serviço, que é o público da ferramenta. Não é a base
 * completa de CNAEs, e a interface diz isso ao contador.
 */

import type { Anexo, StatusPremissa } from "./calculation-rules";

/** De onde veio a classificação de uma atividade. */
export interface FonteClassificacao {
  /** Referência legal ou profissional, em texto citável. */
  readonly referencia: string;
  /** Ano-base da conferência. */
  readonly ano: number;
}

/**
 * Uma atividade que o simulador sabe classificar.
 *
 * `anexosPossiveis` com dois itens significa que a atividade transita
 * entre eles conforme o Fator R — não que o sistema esteja em dúvida.
 */
export interface AtividadeTributaria {
  readonly id: string;
  readonly cnae: string;
  readonly descricao: string;
  readonly categoria: string;
  /** Sinônimos e termos que o contador provavelmente digita. */
  readonly termos: readonly string[];
  readonly simples: {
    /** `null` = não sabemos afirmar. Nunca inventamos elegibilidade. */
    readonly elegivel: boolean | null;
    readonly anexosPossiveis: readonly Anexo[];
    readonly sujeitaFatorR: boolean;
  };
  readonly fonte: FonteClassificacao;
  readonly status: StatusPremissa;
}

const LC123: FonteClassificacao = {
  referencia:
    "LC 123/2006, art. 18 (redação da LC 155/2016), conferida contra duas referências profissionais de 2026",
  ano: 2026,
};

/**
 * Atalho para atividade sujeita ao Fator R: transita entre III e V.
 * A ordem [III, V] é a da lei, não uma preferência.
 */
const FATOR_R = {
  elegivel: true,
  anexosPossiveis: ["III", "V"],
  sujeitaFatorR: true,
} as const;

/** Atividade com anexo fixo, fora do alcance do Fator R. */
function fixo(anexo: Anexo) {
  return {
    elegivel: true as const,
    anexosPossiveis: [anexo] as readonly Anexo[],
    sujeitaFatorR: false as const,
  };
}

/**
 * TODAS as entradas estão como "a-validar": a transcrição foi
 * conferida contra a lei e contra referências profissionais, mas
 * ainda não recebeu o aceite do contador que valida o produto.
 * Marcar como validada aqui seria inventar respaldo.
 */
export const CATALOGO_ATIVIDADES: readonly AtividadeTributaria[] = [
  {
    id: "software-sob-encomenda",
    cnae: "6201-5/01",
    descricao: "Desenvolvimento de programas de computador sob encomenda",
    categoria: "Tecnologia",
    termos: ["software", "sistema", "programação", "dev", "ti", "aplicativo"],
    simples: FATOR_R,
    fonte: LC123,
    status: "a-validar",
  },
  {
    id: "software-customizavel",
    cnae: "6202-3/00",
    descricao:
      "Desenvolvimento e licenciamento de programas de computador customizáveis",
    categoria: "Tecnologia",
    termos: ["software", "licenciamento", "saas", "produto digital", "ti"],
    simples: FATOR_R,
    fonte: LC123,
    status: "a-validar",
  },
  {
    id: "consultoria-ti",
    cnae: "6204-0/00",
    descricao: "Consultoria em tecnologia da informação",
    categoria: "Tecnologia",
    termos: ["consultoria", "ti", "tecnologia", "assessoria"],
    simples: FATOR_R,
    fonte: LC123,
    status: "a-validar",
  },
  {
    id: "suporte-ti",
    cnae: "6209-1/00",
    descricao:
      "Suporte técnico, manutenção e outros serviços em tecnologia da informação",
    categoria: "Tecnologia",
    termos: ["suporte", "manutenção", "helpdesk", "ti", "infraestrutura"],
    simples: FATOR_R,
    fonte: LC123,
    status: "a-validar",
  },
  {
    id: "engenharia",
    cnae: "7112-0/00",
    descricao: "Serviços de engenharia",
    categoria: "Engenharia e arquitetura",
    termos: ["engenharia", "engenheiro", "projeto", "cálculo estrutural"],
    simples: FATOR_R,
    fonte: LC123,
    status: "a-validar",
  },
  {
    id: "arquitetura",
    cnae: "7111-1/00",
    descricao: "Serviços de arquitetura",
    categoria: "Engenharia e arquitetura",
    termos: ["arquitetura", "arquiteto", "urbanismo", "projeto"],
    simples: FATOR_R,
    fonte: LC123,
    status: "a-validar",
  },
  {
    id: "desenho-tecnico",
    cnae: "7119-7/03",
    descricao: "Serviços de desenho técnico relacionados à arquitetura e engenharia",
    categoria: "Engenharia e arquitetura",
    termos: ["desenho", "projetista", "cad", "detalhamento"],
    simples: FATOR_R,
    fonte: LC123,
    status: "a-validar",
  },
  {
    id: "consultoria-gestao",
    cnae: "7020-4/00",
    descricao: "Atividades de consultoria em gestão empresarial",
    categoria: "Consultoria e auditoria",
    termos: ["consultoria", "gestão", "auditoria", "administração", "economia"],
    simples: FATOR_R,
    fonte: LC123,
    status: "a-validar",
  },
  {
    id: "publicidade",
    cnae: "7311-4/00",
    descricao: "Agências de publicidade",
    categoria: "Comunicação",
    termos: ["publicidade", "propaganda", "marketing", "agência", "jornalismo"],
    simples: FATOR_R,
    fonte: LC123,
    status: "a-validar",
  },
  {
    id: "medicina-consulta",
    cnae: "8630-5/03",
    descricao: "Atividade médica ambulatorial restrita a consultas",
    categoria: "Saúde",
    termos: ["médico", "medicina", "consultório", "clínica", "saúde"],
    simples: FATOR_R,
    fonte: LC123,
    status: "a-validar",
  },
  {
    id: "odontologia",
    cnae: "8630-5/04",
    descricao: "Atividade odontológica",
    categoria: "Saúde",
    termos: ["dentista", "odontologia", "consultório", "saúde"],
    simples: FATOR_R,
    fonte: LC123,
    status: "a-validar",
  },
  {
    id: "psicologia",
    cnae: "8650-0/03",
    descricao: "Atividades de psicologia e psicanálise",
    categoria: "Saúde",
    termos: ["psicólogo", "psicologia", "terapia", "saúde"],
    simples: FATOR_R,
    fonte: LC123,
    status: "a-validar",
  },
  {
    id: "fisioterapia",
    cnae: "8650-0/04",
    descricao: "Atividades de fisioterapia",
    categoria: "Saúde",
    termos: ["fisioterapia", "fisioterapeuta", "reabilitação", "saúde"],
    simples: FATOR_R,
    fonte: LC123,
    status: "a-validar",
  },
  {
    id: "contabilidade",
    cnae: "6920-6/01",
    descricao: "Atividades de contabilidade",
    categoria: "Consultoria e auditoria",
    termos: ["contabilidade", "contador", "escritório contábil", "fiscal"],
    simples: fixo("III"),
    fonte: LC123,
    status: "a-validar",
  },
  {
    id: "academia",
    cnae: "9313-1/00",
    descricao: "Atividades de condicionamento físico",
    categoria: "Serviços gerais",
    termos: ["academia", "personal", "musculação", "pilates", "crossfit"],
    simples: fixo("III"),
    fonte: LC123,
    status: "a-validar",
  },
  {
    id: "treinamento-profissional",
    cnae: "8599-6/04",
    descricao: "Treinamento em desenvolvimento profissional e gerencial",
    categoria: "Educação",
    termos: ["curso", "treinamento", "capacitação", "aula", "ensino"],
    simples: fixo("III"),
    fonte: LC123,
    status: "a-validar",
  },
  {
    id: "salao-beleza",
    cnae: "9602-5/01",
    descricao: "Cabeleireiros, manicure e pedicure",
    categoria: "Serviços gerais",
    termos: ["salão", "beleza", "cabeleireiro", "estética", "barbearia"],
    simples: fixo("III"),
    fonte: LC123,
    status: "a-validar",
  },
  {
    id: "oficina-mecanica",
    cnae: "4520-0/01",
    descricao: "Serviços de manutenção e reparação mecânica de veículos",
    categoria: "Serviços gerais",
    termos: ["oficina", "mecânica", "automotivo", "reparação", "manutenção"],
    simples: fixo("III"),
    fonte: LC123,
    status: "a-validar",
  },
  {
    id: "advocacia",
    cnae: "6911-7/01",
    descricao: "Serviços advocatícios",
    categoria: "Serviços com CPP fora do DAS",
    termos: ["advogado", "advocacia", "jurídico", "escritório de advocacia"],
    simples: fixo("IV"),
    fonte: LC123,
    status: "a-validar",
  },
  {
    id: "construcao-edificios",
    cnae: "4120-4/00",
    descricao: "Construção de edifícios",
    categoria: "Serviços com CPP fora do DAS",
    termos: ["construção", "obra", "empreiteira", "civil"],
    simples: fixo("IV"),
    fonte: LC123,
    status: "a-validar",
  },
  {
    id: "limpeza-predial",
    cnae: "8121-4/00",
    descricao: "Limpeza em prédios e em domicílios",
    categoria: "Serviços com CPP fora do DAS",
    termos: ["limpeza", "conservação", "zeladoria", "higienização"],
    simples: fixo("IV"),
    fonte: LC123,
    status: "a-validar",
  },
  {
    id: "vigilancia",
    cnae: "8011-1/01",
    descricao: "Atividades de vigilância e segurança privada",
    categoria: "Serviços com CPP fora do DAS",
    termos: ["vigilância", "segurança", "portaria", "monitoramento"],
    simples: fixo("IV"),
    fonte: LC123,
    status: "a-validar",
  },
];

/** Busca uma atividade pelo id. `null` quando não existe. */
export function atividadePorId(
  id: string | null | undefined,
): AtividadeTributaria | null {
  if (!id) return null;
  return CATALOGO_ATIVIDADES.find((a) => a.id === id) ?? null;
}

/** Remove acentos e caixa, para que "publicidade" ache "Publicidade". */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Só os dígitos — deixa "6201501", "6201-5/01" e "6201 5 01" equivalentes. */
function digitos(texto: string): string {
  return texto.replace(/\D/g, "");
}

/**
 * Busca por descrição, CNAE, categoria ou sinônimo.
 *
 * A ordenação é por qualidade do casamento, não alfabética: quem
 * digita "eng" quer "Serviços de engenharia" em primeiro, não a
 * primeira entrada do arquivo que por acaso contenha as três letras.
 *
 * Termo vazio devolve o catálogo inteiro — a lista é curta o
 * suficiente para ser navegada, e esconder tudo até a primeira tecla
 * deixaria o contador sem saber o que existe.
 */
export function buscarAtividades(
  termo: string,
  limite = 8,
): readonly AtividadeTributaria[] {
  const alvo = normalizar(termo);
  if (alvo === "") return CATALOGO_ATIVIDADES.slice(0, limite);

  const numerico = digitos(termo);
  const pontuadas: {
    atividade: AtividadeTributaria;
    peso: number;
    posicao: number;
  }[] = [];

  for (const atividade of CATALOGO_ATIVIDADES) {
    const descricao = normalizar(atividade.descricao);
    const cnae = digitos(atividade.cnae);
    const posicao = descricao.indexOf(alvo);
    let peso = 0;

    if (numerico.length >= 3 && cnae.startsWith(numerico)) peso = 100;
    else if (posicao === 0) peso = 90;
    /* Casamento em INÍCIO DE PALAVRA: "engenharia" acha "Serviços de
       engenharia" como termo próprio, não como pedaço de outra coisa. */
    else if (posicao > 0 && !/[a-z0-9]/.test(descricao[posicao - 1])) peso = 80;
    else if (posicao > 0) peso = 70;
    else if (atividade.termos.some((t) => normalizar(t) === alvo)) peso = 75;
    else if (atividade.termos.some((t) => normalizar(t).startsWith(alvo)))
      peso = 60;
    else if (atividade.termos.some((t) => normalizar(t).includes(alvo)))
      peso = 40;
    else if (normalizar(atividade.categoria).includes(alvo)) peso = 20;

    if (peso > 0) {
      /* Sem casamento na descrição, a posição não ordena nada: manda
         para o fim do desempate em vez de fingir um índice 0. */
      pontuadas.push({
        atividade,
        peso,
        posicao: posicao >= 0 ? posicao : Number.MAX_SAFE_INTEGER,
      });
    }
  }

  return pontuadas
    .sort(
      (a, b) =>
        b.peso - a.peso ||
        /* Quem cita o termo mais cedo é mais provável de ser sobre ele. */
        a.posicao - b.posicao ||
        a.atividade.descricao.length - b.atividade.descricao.length ||
        a.atividade.descricao.localeCompare(b.atividade.descricao, "pt-BR"),
    )
    .slice(0, limite)
    .map((p) => p.atividade);
}

/** Quantas atividades o catálogo cobre — exibido como escopo honesto. */
export function totalAtividades(): number {
  return CATALOGO_ATIVIDADES.length;
}
