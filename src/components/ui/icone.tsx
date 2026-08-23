/**
 * Vocabulário de ícones da área de trabalho.
 *
 * Não é uma biblioteca: são os mesmos glifos que a interface já usava,
 * reunidos num lugar só para que **um ícone signifique sempre a mesma
 * coisa**. "+" é "Nova análise" e nada mais; "↻" é "Recalcular" e nada
 * mais. Se um deles precisar mudar, muda aqui e muda em toda parte.
 *
 * Todos são `aria-hidden`: o ícone reforça o rótulo, nunca o substitui.
 * Um controle que só exiba um ícone precisa carregar o nome acessível
 * por conta própria (texto `sr-only`).
 */
function Glifo({ children }: { children: string }) {
  return (
    <span aria-hidden="true" className="shrink-0 leading-none">
      {children}
    </span>
  );
}

/** Criar uma análise nova, separada da atual. */
export const IconeNovaAnalise = () => <Glifo>+</Glifo>;

/** Atualizar o resultado da análise que já está aberta. */
export const IconeRecalcular = () => <Glifo>↻</Glifo>;

/** Abrir um painel sobreposto sem sair da análise. */
export const IconePainel = () => <Glifo>▤</Glifo>;

/** Fechar um painel. Ação de baixo risco, universalmente entendida. */
export const IconeFechar = () => <Glifo>✕</Glifo>;

/** Excluir em definitivo. Só em controle de tom destrutivo. */
export const IconeExcluir = () => <Glifo>✕</Glifo>;
