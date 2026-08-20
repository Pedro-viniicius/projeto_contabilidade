# Clareza

**Área de trabalho para análise tributária preliminar.**

PWA de apoio à decisão para **contadores brasileiros**. Em uma única
tela, o profissional informa receita, custos e pró-labore e obtém a
comparação entre os cenários Pessoa Física e CNPJ, com impacto mensal e
anual, composição dos encargos e o status de validação de cada premissa.

Otimizado para uso repetido ao longo do expediente: sem onboarding, sem
wizard, com edição e recálculo sem trocar de tela.

> ⚠️ **Estágio do projeto:** V2 da interface; o **modelo de cálculo segue
> em validação**. As premissas ainda **não foram revisadas por um
> contador** — veja [`docs/PREMISSAS_DE_CALCULO.md`](docs/PREMISSAS_DE_CALCULO.md).
> Os resultados são estimativas, não apuração fiscal.

> 📖 Histórico e rollback: [`docs/HISTORICO_DE_VERSOES.md`](docs/HISTORICO_DE_VERSOES.md)
> · Mudanças: [`CHANGELOG.md`](CHANGELOG.md)

---

## Índice

- [O que a aplicação faz](#o-que-a-aplicação-faz)
- [Stack](#stack)
- [Como rodar](#como-rodar)
- [Scripts](#scripts)
- [Estrutura de diretórios](#estrutura-de-diretórios)
- [Arquitetura de cálculo](#arquitetura-de-cálculo)
- [Persistência local](#persistência-local)
- [Comportamento PWA](#comportamento-pwa)
- [Testes](#testes)
- [Limitações atuais](#limitações-atuais)
- [Processo de validação contábil](#processo-de-validação-contábil)
- [Decisões de arquitetura](#decisões-de-arquitetura)
- [Versões e rollback](#versões-e-rollback)

---

## O que a aplicação faz

Desde a V2.1 o produto tem **duas telas**: o acesso e a área de trabalho.
Todo o resto acontece dentro da área de trabalho, em painéis.

| Rota | O que é |
| --- | --- |
| `/login` | Acesso **demonstrativo** — protótipo de interface, sem servidor |
| `/workspace` | Área de trabalho: dados, resultado, comparativo, auditoria, histórico, premissas, escopo e feedback |
| `/offline` | Fallback quando não há conexão nem cache |

Rotas antigas continuam funcionando por redirecionamento, para não
quebrar links salvos, atalhos do PWA instalado nem casca em cache:

| De | Para |
| --- | --- |
| `/`, `/simulacao`, `/resultado` | `/workspace` |
| `/premissas` | `/workspace?painel=premissas` |
| `/feedback` | `/workspace?painel=feedback` |
| `/como-funciona` | `/workspace?painel=escopo` |

**Fluxo principal:** entrar → informar dados → calcular → comparar →
auditar um encargo → alterar valor → recalcular → retomar outra análise,
**tudo sem trocar de rota**.

**Atalho:** `Ctrl/Cmd + Enter` calcula e recalcula.

> **O acesso não é autenticação.** Não há servidor, banco, token nem
> verificação de credencial: o formulário valida o formato do e-mail,
> exige senha não vazia, descarta a senha e grava uma marca local. Ver
> [`docs/UX_WORKSPACE_CONTADOR.md`](docs/UX_WORKSPACE_CONTADOR.md).

---

## Stack

| Camada | Escolha | Por quê |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) | Rotas estáticas, bom SEO, PWA sem servidor |
| Linguagem | TypeScript (strict) | O domínio é financeiro: tipos evitam erro silencioso |
| UI | React 19 + Tailwind CSS 4 | Tokens de tema em CSS puro, sem runtime de estilo |
| Validação | Zod 4 | Fronteira única entre dado cru e dado confiável |
| Testes | Vitest | Rápido, sem configuração extra |
| Componentes | Escritos à mão | Poucas primitivas, sob medida para densidade de tabela |

**Sem backend, sem banco, sem autenticação, sem IA, sem biblioteca de
gráficos.** Cada ausência foi uma decisão; veja
[Decisões de arquitetura](#decisões-de-arquitetura).

---

## Como rodar

Requer **Node.js 20+** (desenvolvido no 22).

```bash
npm install          # instalar dependências
npm run dev          # desenvolvimento em http://localhost:3000
```

Para testar o comportamento de PWA (service worker só funciona em build de
produção):

```bash
npm run build
npm run start        # http://localhost:3000
```

Nenhuma variável de ambiente é obrigatória. As opcionais estão em
[`.env.example`](.env.example).

---

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção (necessário para o PWA) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (config do Next + regras do React 19) |
| `npm run test` | Testes unitários |
| `npm run test:watch` | Testes em modo watch |
| `npm run test:coverage` | Cobertura do domínio |
| `npm run icons` | Regenera os ícones PNG do PWA a partir da marca |
| `npm run verify` | build + typecheck + lint + test (rode antes de commitar) |

> O `build` vem primeiro de propósito: o Next gera tipos de rota
> (`LayoutProps` e afins) durante o build. Num clone recém-baixado, rodar
> `typecheck` antes de um `build` falha com `Cannot find name 'LayoutProps'`.

---

## Estrutura de diretórios

```
src/
├── app/                        # Rotas (App Router)
│   ├── layout.tsx              # Metadata, SEO, script de tema, registro do SW
│   ├── login/                  # Acesso demonstrativo (sem servidor)
│   ├── workspace/              # ⭐ A tela única do contador
│   ├── page.tsx                # → redireciona para /workspace
│   ├── simulacao/ · resultado/ # → redirecionam (rotas legadas)
│   ├── premissas/ · feedback/ · como-funciona/   # → redirecionam com ?painel=
│   ├── offline/                # Fallback do service worker
│   ├── manifest.ts             # Web App Manifest
│   ├── robots.ts · sitemap.ts
│   └── globals.css             # Duas paletas + três estados de tema
│
├── components/
│   ├── ui/                     # Painel, PainelLateral, Metrica, Badge, CampoMoeda…
│   ├── layout/                 # BarraSuperior
│   ├── tema/                   # Preferência de tema e alternância
│   └── pwa/                    # Registro do SW e botão de instalação
│
├── features/
│   ├── simulacao/
│   │   ├── domain/             # 🧮 MOTOR DE CÁLCULO (sem React)
│   │   │   ├── calculation-rules.ts   # ⚠️ TODAS as premissas vivem aqui
│   │   │   ├── calcular.ts            # Funções puras de cálculo
│   │   │   ├── explicar.ts            # Explicações determinísticas
│   │   │   └── *.test.ts
│   │   ├── schemas/            # Validação Zod + mensagens pt-BR
│   │   ├── services/           # Persistência local
│   │   ├── components/         # AreaDeTrabalho (orquestra), formulário,
│   │   │                       # resultado, composição, histórico, contexto
│   │   └── types.ts            # Contratos de dados
│   ├── sessao/                 # Acesso demonstrativo — única fronteira a
│   │                           # trocar quando houver autenticação real
│   └── feedback/               # Mesma estrutura, escopo menor
│
└── lib/                        # Utilidades transversais
    ├── format.ts               # Moeda, percentual, máscara pt-BR
    ├── storage.ts              # localStorage tolerante a falhas
    ├── armazenamento-reativo.ts# Hooks de leitura reativa
    ├── analytics.ts            # Contrato de eventos (sem plataforma)
    └── site.ts

public/
├── sw.js                       # Service worker (escrito à mão)
└── icons/                      # Ícones do PWA (gerados por script)

scripts/gerar-icones.mjs        # Gera os PNGs sem dependência de imagem
docs/                           # Premissas, UX, perguntas ao contador, backlog
```

---

## Arquitetura de cálculo

O requisito central do projeto: **nenhuma regra tributária pode estar
espalhada em componentes React**. Um contador precisa conseguir auditar as
regras sem ler JSX.

```
entrada do usuário
      ↓
schemas/simulacao-schema.ts     validação Zod, mensagens pt-BR
      ↓
domain/calculation-rules.ts     alíquotas, tetos, faixas (+ metadados)
      ↓
domain/calcular.ts              funções puras e determinísticas
      ↓
types.ts (ResultadoCenario)     modelo de resultado
      ↓
domain/explicar.ts              tradução para linguagem de negócio
      ↓
components/                     apresentação
```

**Funções públicas do motor** (`domain/calcular.ts`):

| Função | Responsabilidade |
| --- | --- |
| `calcularBaseLivroCaixa` | Receita − custos |
| `calcularInssAutonomo` | INSS respeitando piso e teto |
| `calcularIrpfMensal` | Tabela progressiva com parcela a deduzir |
| `calcularCenarioPessoaFisica` | Cenário PF completo |
| `calcularCenarioCnpj` | Cenário CNPJ completo |
| `compararCenarios` | Diferença mensal e anual entre os dois |
| `simular` | Ponto de entrada único |

Todas são **puras**: mesma entrada, mesma saída, sem efeito colateral, sem
dependência de React, do DOM ou de relógio.

### Como as premissas se tornam auditáveis

Cada premissa em `calculation-rules.ts` não é só um número — é um objeto
com `valor`, `descricao`, `porQueExiste`, `status` e `ondeUsada`. A função
`listarPremissas()` achata isso, e a interface exibe no painel de
premissas e na
seção "Como chegamos a esse resultado?". **A documentação da regra mora ao
lado do valor da regra**, então elas não podem divergir.

Cada cenário também devolve `passos: PassoCalculo[]` — a conta em texto,
linha por linha, exibida ao usuário.

### Para alterar uma regra

1. Edite o valor em `calculation-rules.ts` (e o metadado, se a
   justificativa mudou).
2. Incremente `VERSAO_REGRAS` — ela é gravada em cada simulação salva e em
   cada feedback, para rastrear com qual modelo o número foi gerado.
3. `npm run test` — os testes verificam invariantes e vão apontar
   inconsistências.

---

## Persistência local

Não há conta nem login. Tudo fica no `localStorage` do aparelho:

| Chave | Conteúdo |
| --- | --- |
| `clareza:simulacao:atual` | Última simulação (entrada validada) |
| `clareza:simulacao:historico` | Últimas 5 simulações |
| `clareza:feedback` | Últimos 50 feedbacks |

Dois pontos de projeto:

- **Guardamos a entrada, não o resultado.** O resultado é sempre
  recalculado, então corrigir uma premissa corrige também as simulações
  antigas.
- **Todo dado lido é revalidado pelo schema.** Conteúdo de `localStorage`
  nunca é confiável — pode estar corrompido ou vir de uma versão anterior.

Migrar para servidor no futuro significa reescrever apenas
`services/*-storage.ts`. O formato do registro de feedback já é o payload
que uma API receberia.

---

## Comportamento PWA

- **Manifest** gerado por `src/app/manifest.ts`, servido em
  `/manifest.webmanifest` — nome, ícones (192, 512 e maskable), tema,
  `display: standalone`, atalho para nova simulação.
- **Service worker** em `public/sw.js`, escrito à mão (sem Workbox):
  - navegações: *network-first*, com fallback para cache e depois `/offline`;
  - `/_next/static` e `/icons`: *cache-first*;
  - demais requisições passam direto; nada de POST ou dado de usuário em cache.
- **Instalação:** o botão "Instalar aplicativo" só aparece quando o
  navegador dispara `beforeinstallprompt`. Nenhum banner agressivo.

### Como testar a instalação

```bash
npm run build && npm run start
```

1. Abra `http://localhost:3000` no Chrome.
2. DevTools → **Application** → **Manifest**: sem erros de instalabilidade.
3. DevTools → **Application** → **Service Workers**: estado `activated`.
4. O botão "Instalar aplicativo" aparece na home e em "Como funciona"; ou
   use o ícone de instalação na barra de endereços.
5. **Offline:** DevTools → **Network** → `Offline`, e recarregue. As telas
   já visitadas continuam funcionando; uma rota nunca visitada cai em
   `/offline`.

No iPhone, o Safari não expõe `beforeinstallprompt` — a instalação é por
*Compartilhar → Adicionar à Tela de Início*, o que a página
"Como funciona" explica.

---

## Testes

```bash
npm run test
```

**67 testes**, concentrados onde o erro custa caro:

| Arquivo | Cobre |
| --- | --- |
| `domain/calcular.test.ts` | Motor de cálculo: casos normais, zero, negativos, valores altos, decimais, teto/piso do INSS, monotonicidade do IRPF, comparação, determinismo |
| `domain/explicar.test.ts` | Tom da explicação (positivo/atenção/negativo), caso sem receita, determinismo |
| `schemas/simulacao-schema.test.ts` | Validação: obrigatórios, negativos, limites, tipos errados, regras cruzadas |
| `lib/format.test.ts` | Moeda, percentual, máscara de centavos (ida e volta) |

Não há testes triviais de renderização — o valor está em blindar a lógica
que produz números.

### Regressão entre versões

O redesenho da V2 não podia alterar nenhum resultado. Sete cenários
representativos foram calculados antes e depois — incluindo cada encargo e
cada linha do passo a passo — e os valores numéricos permanecem idênticos
aos da `v1.0.0`. Qualquer alteração em `domain/` deve repetir essa
conferência.

---

## Limitações atuais

**Contábeis** (detalhadas em [`docs/PREMISSAS_DE_CALCULO.md`](docs/PREMISSAS_DE_CALCULO.md)):

- O cenário CNPJ usa **uma alíquota efetiva única de 11%** no lugar das
  tabelas do Simples Nacional. Sem RBT12, sem Fator R, sem escolha de anexo.
- Sem ISS municipal, sem retenções na fonte.
- Sem MEI, Lucro Presumido ou Lucro Real.
- Sem dependentes, despesas médicas, educação ou ajuste anual do IRPF.
- Receita e custos constantes; sem sazonalidade, 13º ou férias.
- Teto/piso do INSS e tabela do IRPF são **valores de referência a confirmar**.

**Técnicas:**

- Sem backend: os dados não sobrevivem à limpeza do navegador nem migram
  entre aparelhos.
- Analytics é apenas um contrato de eventos; nada é enviado a lugar nenhum.
- Sem testes end-to-end automatizados (o fluxo foi validado manualmente no
  navegador, de 390px a 1440px).
- O acesso é demonstrativo: não autentica ninguém e não protege nada.

---

## Processo de validação contábil

1. O contador faz uma análise na área de trabalho como um usuário comum.
2. Abre o painel **Premissas do modelo** e revisa cada regra — todas
   trazem valor, justificativa e status.
3. Percorre [`docs/PERGUNTAS_PARA_CONTADOR.md`](docs/PERGUNTAS_PARA_CONTADOR.md),
   um roteiro de 30 perguntas organizadas por bloco (as 5 primeiras são as
   que mais importam).
4. Registra os apontamentos no painel **Registrar observação** — que
   anexa a análise em aberto — e **exporta em JSON**.
5. As correções entram em `calculation-rules.ts`; `VERSAO_REGRAS` é
   incrementada; os status das premissas passam a
   `validada-tecnicamente`.
6. O backlog em [`docs/BACKLOG_PRODUTO.md`](docs/BACKLOG_PRODUTO.md) é
   repriorizado com base no que ele apontou.

---

## Decisões de arquitetura

| Decisão | Alternativa descartada | Razão |
| --- | --- | --- |
| Componentes escritos à mão | shadcn/ui | Eram 5 componentes; a configuração custaria mais que escrevê-los |
| Estado local + Zod | react-hook-form | 5 campos em 4 passos não justificam a biblioteca |
| Barra empilhada em CSS | Recharts / Chart.js | Responde à pergunta do usuário sem ~50 kB de JS |
| `localStorage` | IndexedDB | Poucos objetos pequenos; API síncrona é mais simples |
| Service worker à mão | next-pwa / Workbox | ~90 linhas legíveis, sem risco de incompatibilidade com o Next 16 |
| `useSyncExternalStore` | `useEffect` + `setState` | `localStorage` é fonte externa; evita render em cascata e inconsistência na hidratação |
| Explicações por template | LLM | Determinísticas, testáveis, gratuitas — e não amplificam erro de lógica não validada |
| Alíquota efetiva única no CNPJ | Tabelas do Simples | Implementá-las mal seria pior que assumir a simplificação abertamente |
| Ícones gerados por script | Assets binários no repositório | `npm run icons` regenera a partir da marca; zero dependência de imagem |
| Cálculo sob comando | Recalcular a cada tecla | Números estáveis durante a digitação; o estado "valores alterados" fica explícito |
| Formulário e resultado na mesma tela | Wizard | O contador altera um valor e vê o impacto sem navegar |
| Tabela no lugar de gráfico | Gráfico de composição | Quem lê números precisa de precisão, não de forma |
| Referência local por simulação | Cadastro de clientes | Resolve a organização da sessão de trabalho sem inventar um CRM |
| `AreaRolavel` com `relative` | `overflow-x-auto` solto | Sem ancestral posicionado, texto `sr-only` escapa do recorte e cria rolagem na página |

---

## Versões e rollback

O estado exato de cada versão fica marcado por uma tag anotada. Nada é
sobrescrito.

| Tag | O que é |
| --- | --- |
| `v1.0.0` | Simulador orientado ao usuário final (wizard, mobile-first) |
| `v2.0.0` | Área de trabalho profissional para contadores (atual) |

```bash
# inspecionar a V1 sem alterar nada
git switch --detach v1.0.0

# voltar para a branch do redesign
git switch feat/accountant-professional-ux

# criar uma branch a partir da V1
git switch -c restore/v1 v1.0.0
```

Detalhes, comparativo entre versões e verificação de regressão em
[`docs/HISTORICO_DE_VERSOES.md`](docs/HISTORICO_DE_VERSOES.md).

---

## Licença

Projeto privado, em desenvolvimento.
