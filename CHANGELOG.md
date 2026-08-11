# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Versionamento semântico.

---

## [2.0.1] — 2026-08-11

Primeira revisão contábil aplicada. Escopo deliberadamente restrito ao que
o contador informou com números — nada foi inferido.

### Alterado

- **INSS — piso** de R$ 1.518,00 para **R$ 1.621,00** e **teto** de
  R$ 8.157,41 para **R$ 8.475,55**, conforme a revisão. Efeito: em bases
  acima do teto, o líquido da PF cai R$ 46,13/mês (R$ 553,56/ano); no
  cenário CNPJ, cai R$ 25,36/mês quando o pró-labore supera o teto.
  Abaixo do teto, nada muda.
- **Status de validação:** as três premissas de INSS passam de
  hipótese/a-validar para **validada tecnicamente** — as primeiras do
  projeto. O painel `/premissas` reflete isso sozinho.
- `VERSAO_REGRAS` de `v1-mvp-2026-08` para **`v1.1-2026-08`**.
- **Retenção de 11%** pelo tomador PJ deixa de ser lacuna e passa a ser
  decisão documentada: é antecipação de pagamento e não altera o
  resultado prático.
- **Justificativas das premissas** reescritas com o retorno profissional.
  Duas passam a declarar-se explicitamente erradas na interface:
  - a **tabela do IRPF**, confirmada como desatualizada e sem a isenção
    de R$ 5.000;
  - a **alíquota única de 11%** do CNPJ, que apaga uma diferença de até
    9,5 p.p. entre os anexos III e V ao ignorar o Fator R.

### Adicionado

- `docs/PENDENCIAS_CONTADOR.md` — as 21 perguntas em aberto, priorizadas,
  com formulários prontos para as duas tabelas que destravam o produto.

### Não alterado, por decisão

- **Tabela do IRPF.** A revisão confirmou que está desatualizada mas não
  informou as novas faixas. Não foram preenchidas por inferência: a
  isenção de R$ 5.000 envolve um redutor de transição, e errar esse
  desenho distorceria a faixa de renda mais comum. Bloqueio nº 1.
- **Modelo do cenário CNPJ.** Corrigi-lo exige as tabelas completas dos
  anexos com RBT12, ainda não recebidas. As alíquotas iniciais informadas
  valem só para a primeira faixa. Bloqueio nº 2.

---

## [2.0.0] — 2026-08-07

Reposicionamento do produto: de simulador para usuário final a **área de
trabalho profissional para contadores**. Redesenho de fluxo, não apenas
visual. O motor de cálculo não foi alterado.

### Alterado

- **Persona e ambiente.** Interface passa a ser desktop-first
  (1280–1600px), otimizada para uso repetido ao longo do expediente.
  Mobile continua funcional como fluxo secundário.
- **Navegação.** Barra lateral persistente com as seções reais da
  aplicação, no lugar do header e do footer de marketing. Nenhum item de
  menu para funcionalidade inexistente.
- **Entrada de dados.** O wizard de 4 telas vira um formulário único
  agrupado em Enquadramento, Receita e custos e Parâmetros do cenário
  CNPJ. Validação, máscaras e acessibilidade preservadas.
- **Resultado.** Deixa de ser página separada e passa a conviver com o
  formulário em duas colunas a partir de 960px. Editar e recalcular não
  exige mais navegar.
- **Comparação PF × CNPJ.** Vira tabela com coluna de diferença, em reais
  e em pontos percentuais, cobrindo receita, custos, encargos, carga,
  resultado líquido, margem e projeção anual.
- **Transparência do cálculo.** Cada encargo passa a exibir base,
  alíquota, parcela a deduzir e o status de validação da premissa
  correspondente — no lugar de texto explicativo.
- **Painel de premissas.** `/premissas` vira tela de auditoria com
  contagens por status, filtros e detalhamento por linha.
- **Linguagem.** Microcopy revisada de ponta a ponta: "Compare os
  cenários tributários com base nos dados informados" no lugar de copy de
  conversão. "Maior resultado estimado" no lugar de "melhor opção" —
  premissas não validadas não sustentam recomendação.
- **Sistema visual.** Tokens mais densos, raios menores, numerais
  tabulares em toda coluna financeira, agrupamento por espaçamento no
  lugar de cartões. Cor reservada a significado de status.
- **Casca do PWA** promovida a `clareza-v2`, para que quem já instalou
  receba a nova interface em vez da versão em cache.
- **Ordem do `npm run verify`**: `build` antes de `typecheck`, porque o
  Next gera os tipos de rota durante o build.

### Adicionado

- **Visão geral** (`/`): área de trabalho inicial com acesso em uma
  interação a Nova simulação, simulações recentes e estágio do modelo.
- **Simulações recentes**: histórico local, que já era gravado na V1 mas
  nunca exibido. Mostra referência, receita e resultado nos dois cenários,
  com ações de abrir e remover.
- **Referência opcional** por simulação (ex.: "Cliente XPTO — cenário
  01"). Rótulo local de organização; não cria cadastro de clientes e não
  entra no cálculo.
- **Atalho Ctrl/Cmd + Enter** para calcular e recalcular, com a dica
  exibida discretamente ao lado da ação.
- **Indicador de estágio do modelo** na navegação e na Visão geral,
  derivado de `resumoValidacao()` sobre as premissas reais.
- **Metadados de auditoria nos encargos** (`base`, `aliquota`,
  `parcelaADeduzir`, `premissa`): descrevem o que o motor já calculou,
  para a interface exibir a conta sem recalcular nada.
- **Aviso de valores alterados** quando os campos divergem do último
  cálculo executado.
- **Primitivas de UI**: `Painel`, `Badge`, `AreaRolavel`, `CampoTexto`,
  além de `Button`, `CampoMoeda` e `Escolha` redesenhados.
- `docs/HISTORICO_DE_VERSOES.md` e este changelog.

### Corrigido

- **Rolagem horizontal em 390px.** Textos `sr-only` usam
  `position: absolute`; sem ancestral posicionado, escapavam do recorte
  das tabelas roláveis e ancoravam no documento. Resolvido pela primitiva
  `AreaRolavel`, que posiciona o contêiner.
- **Tabelas esticando a coluna** em vez de rolar dentro dela: itens de
  grid nascem com `min-width: auto` e precisavam de `min-w-0`.
- **Layout profissional não engatava em 1024px**, porque a barra de
  rolagem reduz a viewport útil para ~1009px. Ponto de corte movido para
  960px.
- **Contraste do painel desatualizado**: a opacidade reduzida foi
  substituída por selo e borda.

### Preservado

- Motor de cálculo, alíquotas, fórmulas e premissas — **sem qualquer
  alteração de resultado**. Sete cenários representativos conferidos
  antes e depois: valores idênticos aos da `v1.0.0`.
- Separação `entrada → validação → regras → motor → resultado →
  apresentação`, com o domínio independente de React.
- Os 67 testes existentes, todos passando.
- `/premissas`, `/feedback` e a exportação de feedback em JSON.
- Persistência local com revalidação por schema na leitura.
- PWA, manifest, casca offline e instalação.
- Modo claro e escuro.
- Avisos sobre o caráter estimativo dos resultados.

### Removido

- Landing de marketing dentro da aplicação (hero, "três passos", copy de
  conversão).
- Wizard de 4 passos e sua barra de progresso.
- Página `/resultado` como destino próprio — a rota permanece e
  redireciona para a área de trabalho, preservando links salvos e o
  atalho instalado do PWA.
- Gráfico de composição do faturamento: a tabela comparativa comunica a
  mesma informação com mais precisão para quem lê números.
- Explicação em texto corrido do resultado, substituída pelo resumo de
  uma linha e pela tabela.

---

## [1.0.0] — 2026-08-07

Primeira versão funcional. Simulador orientado ao usuário final.

### Adicionado

- Simulação guiada em 4 passos, mobile-first.
- Motor de cálculo puro, isolado de React, com premissas centralizadas e
  auditáveis.
- Comparação entre os cenários Pessoa Física e CNPJ.
- Transparência do cálculo com passo a passo e premissas.
- Páginas de premissas, escopo e feedback com exportação em JSON.
- Persistência local e retomada da última simulação.
- PWA com manifest, service worker e casca offline.
- 67 testes cobrindo o domínio, a validação e a formatação.
- Documentação de premissas, roteiro para o contador e backlog.
