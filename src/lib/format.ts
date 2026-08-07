/** Formatação pt-BR compartilhada. Sem dependências externas. */

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const moedaCompacta = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function formatarMoeda(valor: number): string {
  return moeda.format(Number.isFinite(valor) ? valor : 0);
}

/** Versão sem centavos, para números grandes em destaque visual. */
export function formatarMoedaCurta(valor: number): string {
  return moedaCompacta.format(Number.isFinite(valor) ? valor : 0);
}

export function formatarPercentual(valor: number, casas = 1): string {
  const seguro = Number.isFinite(valor) ? valor : 0;
  return `${(seguro * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })}%`;
}

export function formatarData(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Converte o texto digitado num campo de moeda para número.
 * Interpreta os dígitos como centavos — o padrão de teclado numérico
 * que usuários brasileiros esperam em apps financeiros.
 */
export function textoParaCentavos(texto: string): number {
  const digitos = texto.replace(/\D/g, "").slice(0, 12);
  if (digitos === "") return 0;
  return Number(digitos) / 100;
}

/** Máscara de exibição do campo de moeda (sem o prefixo "R$"). */
export function centavosParaTexto(valor: number): string {
  if (!Number.isFinite(valor) || valor === 0) return "";
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
