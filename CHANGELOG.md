# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Versionamento semântico.

---

## [2.2.0] — 2026-08-23

Release de interação. Auditoria de **todos os controles de ação** da
aplicação — rótulo, hierarquia, semântica, teclado, nome acessível e
alvo de toque. **O motor de cálculo não foi tocado:** nenhuma premissa,
alíquota, fórmula ou regra de arredondamento mudou, e `VERSAO_REGRAS`
segue a mesma. O que mudou é o que os botões dizem, não o que a
aplicação calcula.

Auditoria completa em [`docs/AUDITORIA_ACOES_UX.md`](docs/AUDITORIA_ACOES_UX.md).

### Corrigido

- **"Nova" virou "+ Nova análise".** O rótulo mais ambíguo da interface
  aparecia em dois lugares, com aparência de link, alvo de ~16px e sem
  dizer *nova o quê* — nem que fechava a análise em andamento. Agora é
  um único componente usado nos dois pontos, com ícone, corpo de botão
  e a distinção explícita em relação a "Recalcular análise": uma cria
  outra análise, a outra atualiza a que está aberta.
- **Estado deixou de ser rótulo de ação.** O registro em edição tinha um
  botão escrito "Em edição" — dizia o que a análise *era*, não o que o
  clique faria. Virou etiqueta de status, ao lado de um botão "Abrir".
- **Ações destrutivas passaram a se parecer com o que são.** Excluir do
  histórico e limpar as observações apagavam dados locais irreversíveis
  com a aparência da ação mais discreta da tela. Ganharam tom próprio e
  confirmação que nomeia o alvo e avisa que não volta.
- **Confirmação só onde há perda real.** "Nova análise" confirma quando
  existe trabalho fora do histórico — valores digitados e nunca
  calculados, ou edição por cima de um cálculo salvo — e não confirma
  quando não há o que perder. A regra está isolada e testada em
  `acoes-analise.ts`.
- **Botões que pareciam texto.** "Modelo em validação" era
  indistinguível de um indicador passivo; "Premissas do modelo" era um
  falso link para uma ação que não navega. Ambos ganharam tratamento de
  controle e nome acessível que declara o destino.
- **Abas de cenário com o padrão ARIA completo.** Havia `role="tab"` sem
  painel associado e sem navegação por setas — o leitor de tela
  prometia um comportamento que não existia. Agora há tabulação
  *roving*, setas com retorno circular, `Home`/`End`, `aria-controls` e
  `role="tabpanel"`.
- **Botão desabilitado deixou de ser um beco sem saída.** No estado
  vazio, "Calcular análise" usa `aria-disabled` em vez de `disabled`:
  continua na ordem de tabulação e aponta, por `aria-describedby`, a
  lista do que falta preencher.
- **Vocabulário único.** A barra superior dizia "Nova simulação"
  enquanto o resto da interface dizia "análise".
- **Rótulos sem objeto.** "Calcular", "Abrir", "Limpar", "Registrar",
  "Sair", "Entrar", "Acesso" e "Área de trabalho" passaram a nomear
  aquilo sobre o que agem.

### Adicionado

- **Variante `destrutiva` em `Button`.** A hierarquia de ação passou a
  ser declarada no tipo — primária, secundária, sutil, destrutiva —, e
  a destrutiva é a única com o tom negativo.
- **`BotaoIcone`** para controle só de ícone, com `rotulo` obrigatório
  no tipo: não há como criar um botão anônimo por esquecimento.
- **`components/ui/icone.tsx`** — os glifos que a interface já usava,
  reunidos para que um ícone signifique sempre a mesma coisa. Nenhuma
  biblioteca de ícones foi adicionada.
- **`.alvo-toque`** — estende a área clicável a 44x44px por
  pseudo-elemento, só em `pointer: coarse`. A densidade visual
  profissional de 32–40px não muda um pixel.
- **Confirmação de análise salva.** "✓ Análise salva no histórico deste
  aparelho", derivada do estado e sem toast, respondendo à pergunta
  "deu certo?".

### Testes

- `acoes-analise.test.ts`: 10 casos cobrindo os rótulos de cálculo, a
  regra de quando confirmar "Nova análise" e os nomes acessíveis do
  histórico. Total do projeto: 137 testes.

---

## [2.1.1] — 2026-08-20

Release de estabilização. Correção de defeitos operacionais encontrados
em auditoria técnica, com teste de regressão em volta de cada um. **O
motor de cálculo não foi tocado:** os resultados de dez cenários
representativos são idênticos, byte a byte, aos da `v2.1.0`. Nenhuma
premissa contábil, alíquota, fórmula ou regra de arredondamento mudou, e
a interface segue a mesma — só ganhou as mensagens que faltavam.

### Corrigido

- **Recalcular deixou de duplicar a análise.** Uma análise agora tem
  identidade estável: recalcular atualiza o mesmo registro, e só "Nova
  análise" gera `id` novo. Antes cada clique em Recalcular inseria um
  registro, e doze cliques consumiam o histórico inteiro — apagando em
  silêncio as análises de outros clientes. O limite de 12 posições passa
  a contar análises distintas, não eventos de cálculo.
- **Registros corrompidos não derrubam mais a aplicação.** O registro
  persistido inteiro passa por schema — `id`, `criadaEm`,
  `atualizadaEm`, `versaoRegras` e `referencia`, e não só `entrada`. Uma
  data ilegível levantava `RangeError` durante o render e deixava a área
  de trabalho permanentemente inacessível, sem saída pela interface. Os
  registros válidos sobrevivem, o inválido é ignorado e o contador é
  avisado.
- **Fronteiras de erro.** `app/error.tsx` e `app/global-error.tsx` com
  recuperação em dois passos: "Tentar novamente" e, só mediante
  confirmação explícita, limpeza dos dados locais — que apaga
  exclusivamente as chaves com prefixo `clareza:`.
- **Falha de gravação deixou de ser silenciosa.** `gravarJson` devolve
  resultado tipado e distingue cota estourada de armazenamento
  indisponível. A área de trabalho avisa quando não conseguiu salvar e
  mantém o resultado na tela; o acesso demonstrativo não navega para uma
  sessão que não existe; o registro de observação não confirma o que não
  foi gravado.
- **Atalho de recálculo restrito ao contexto certo.** Ctrl/Cmd + Enter
  não dispara mais o cálculo com o foco dentro de um diálogo ou com
  painel lateral aberto.
- **Comparação de estado desatualizado determinística.** A detecção de
  "Valores alterados" passou de `JSON.stringify` para comparação campo a
  campo, sem depender da ordem das chaves nem de chave extra vinda do
  armazenamento.

### Adicionado

- **Rastreabilidade de regras no histórico.** Quando a análise foi criada
  sob outra versão das premissas, a linha diz "Criada com regras X ·
  recalculada com as atuais Y". A `versaoRegras` do registro passou a ser
  preservada no recálculo, em vez de reescrita. Continuamos guardando
  entrada e recalculando sempre — nenhum resultado é congelado.
- **`atualizadaEm`** no registro persistido, opcional e ausente nos
  registros gravados antes desta versão.

### Testes

- 60 testes novos (67 → 127), cobrindo persistência, identidade da
  análise, dados corrompidos, falha de gravação, sessão demonstrativa,
  registro de observações, atalho de teclado e comparação de entrada.
- `vitest` passou a encontrar arquivos `.test.tsx`, que antes eram
  ignorados em silêncio, e a cobertura passou a incluir `services/`,
  `schemas/` e `lib/storage.ts` — de 124 para 314 statements medidos.
- `localStorage` falso em `src/lib/armazenamento-falso.ts`, que permite
  simular cota estourada e armazenamento bloqueado sem dependência nova.

### Preservado

- Motor de cálculo, premissas, `VERSAO_REGRAS` (`v1.1-2026-08`),
  arredondamento, tabela do IRPF, INSS, Fator R e alíquota efetiva do
  CNPJ — todos intactos e com os mesmos resultados.
- Layout, cores, tipografia, navegação e estratégia do PWA.

---

## [2.1.0] — 2026-08-20

Consolidação da área de trabalho em **uma tela só** e tela de acesso
demonstrativa. Iteração de interface e arquitetura de informação: o
modelo de cálculo não foi tocado.

### Adicionado

- **Tela de acesso (`/login`).** Protótipo de interface, sem servidor:
  valida formato de e-mail e senha não vazia, grava uma marca local de
  sessão e abre a área de trabalho. A senha é descartada no submit —
  não é gravada, comparada, derivada nem transmitida. Inclui alternância
  de visibilidade da senha e "lembrar meu e-mail neste aparelho" (só o
  e-mail, e só quando pedido).
- **Área de trabalho unificada (`/workspace`).** Três zonas — dados,
  resultado e contexto — com rolagem independente a partir de 960px.
- **Painéis laterais** para premissas, escopo, feedback e contexto:
  diálogos modais com foco preso, `Escape` para fechar, rolagem do
  documento travada e foco devolvido ao elemento de origem.
- **Auditoria no lugar.** Cada linha da composição dos encargos abre
  mostrando base × alíquota = resultado ao lado da premissa que a
  originou, com descrição, justificativa e estágio de validação.
- **Resumo executivo** acima do comparativo: maior resultado estimado,
  diferença mensal e impacto anual.
- **Controle de conta** na barra superior, com modo demonstração
  declarado e ação de sair.
- **Alternância de tema** claro/escuro persistida no aparelho, com script
  aplicado antes da primeira pintura. "Sistema" continua sendo o padrão
  de quem nunca escolheu.
- **Deep link `?painel=`** para abrir um painel já na chegada — é o que
  mantém úteis os atalhos do PWA e os endereços antigos.
- `docs/UX_WORKSPACE_CONTADOR.md` — decisões de layout, fluxo, princípios
  e a limitação explícita do acesso demonstrativo.

### Alterado

- **Arquitetura de informação.** Cinco rotas viraram uma. Depois do
  acesso, o fluxo profissional completo — lançar, calcular, comparar,
  auditar, alterar, recalcular, retomar análise e registrar observação —
  acontece **sem nenhuma troca de rota**.
- **Barra lateral de 224px substituída por barra superior de 48px.** Com
  tudo em uma tela, o menu apontaria para lugar nenhum e consumia espaço
  horizontal que agora pertence ao comparativo.
- **Histórico** deixou de ser tabela na visão geral e virou lista compacta
  na coluna de contexto. Abrir um registro repõe os campos e recalcula no
  lugar, sem navegar.
- **Feedback** passou a coluna única, para caber no painel lateral.
- **Passo a passo** agora vem recolhido: é conferência, não leitura
  primária.
- **Aviso de valores alterados** passou a aparecer também junto do botão
  que resolve o problema, e não só no topo do resultado.
- **Service worker** para `clareza-v2-1`, com casca reduzida a `/login`,
  `/workspace` e `/offline` — as demais telas deixaram de ser rotas.
- **Manifesto:** `start_url` para `/workspace`; atalhos apontam para
  `/workspace` e `/workspace?painel=premissas`.
- **Tokens de cor** reorganizados em duas paletas nomeadas, permitindo os
  três estados de tema sem repetir valores. As variantes `dark:` do
  Tailwind, que seguem só o sistema operacional, foram trocadas pelo
  token `--sobre-acento`.

### Rotas preservadas por redirecionamento

`/` e `/simulacao` e `/resultado` → `/workspace`; `/premissas` →
`/workspace?painel=premissas`; `/feedback` → `/workspace?painel=feedback`;
`/como-funciona` → `/workspace?painel=escopo`. Nenhum link salvo, atalho
instalado ou entrada em cache foi quebrado.

### Preservado

- **Motor de cálculo:** nenhum arquivo de `domain/` foi alterado.
  Alíquotas, INSS, IRPF, premissas do CNPJ, fórmulas e `VERSAO_REGRAS`
  (`v1.1-2026-08`) seguem intactos. Cinco cenários representativos foram
  serializados antes e depois e comparados campo a campo: sem diferença.
- 67 testes existentes, todos passando; typecheck, lint e build limpos.
- Comparação PF × CNPJ, transparência do cálculo e avisos de validação.
- Persistência local, histórico e exportação de feedback em JSON.
- PWA: manifesto, ícones, service worker, instalação e casca offline.
- Modo claro e escuro.

### Limitação declarada

O acesso **não é autenticação**. Não há servidor, banco, sessão de
servidor, token nem verificação de credencial; qualquer e-mail bem
formado com qualquer senha entra, e a marca de sessão pode ser gravada
pelo console. É protótipo de experiência — está dito na tela de acesso e
no menu da conta, e detalhado em `docs/UX_WORKSPACE_CONTADOR.md`.

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
