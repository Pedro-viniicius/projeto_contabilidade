# Clareza

**Entenda melhor seus números antes de tomar uma decisão.**

Simulador financeiro em formato de PWA para autônomos, profissionais
liberais e prestadores de serviço no Brasil. O usuário responde quatro
perguntas simples e descobre quanto realmente sobra do seu faturamento —
e qual a diferença entre atuar como Pessoa Física ou com CNPJ.

> ⚠️ **Estágio do projeto:** MVP V1, em validação contábil. As premissas de
> cálculo ainda **não foram revisadas por um contador**. Veja
> [`docs/PREMISSAS_DE_CALCULO.md`](docs/PREMISSAS_DE_CALCULO.md).

---

## Índice

- [O que o V1 faz](#o-que-o-v1-faz)
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

---

## O que o V1 faz

| Rota | O que é |
| --- | --- |
| `/` | Landing com proposta de valor e atalho para a última simulação |
| `/simulacao` | Wizard de 4 passos: perfil, receita, custos, cenário CNPJ |
| `/resultado` | Resultado, comparativo PF × CNPJ e transparência do cálculo |
| `/premissas` | Todas as premissas com valor, justificativa e status de validação |
| `/como-funciona` | O que a simulação calcula — e o que ela **não** calcula |
| `/feedback` | Registro e exportação de feedback (categorizado) |
| `/offline` | Fallback quando não há conexão nem cache |

**Fluxo principal:** home → simulação → resultado → editar → recalcular.

---

## Stack

| Camada | Escolha | Por quê |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) | Rotas estáticas, bom SEO, PWA sem servidor |
| Linguagem | TypeScript (strict) | O domínio é financeiro: tipos evitam erro silencioso |
| UI | React 19 + Tailwind CSS 4 | Tokens de tema em CSS puro, sem runtime de estilo |
| Validação | Zod 4 | Fronteira única entre dado cru e dado confiável |
| Testes | Vitest | Rápido, sem configuração extra |
| Componentes | Escritos à mão | Eram 5 — configurar uma biblioteca custaria mais |

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
│   ├── layout.tsx              # Shell, metadata, SEO, registro do SW
│   ├── page.tsx                # Landing
│   ├── simulacao/              # Wizard
│   ├── resultado/              # Resultado
│   ├── premissas/              # Auditoria pública das premissas
│   ├── como-funciona/
│   ├── feedback/
│   ├── offline/                # Fallback do service worker
│   ├── manifest.ts             # Web App Manifest
│   ├── robots.ts · sitemap.ts
│   └── globals.css             # Tokens de tema (claro/escuro)
│
├── components/
│   ├── ui/                     # Primitivas: Button, Card, CampoMoeda, Escolha…
│   ├── layout/                 # Header e footer
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
│   │   ├── components/         # Wizard, resultado, comparativo…
│   │   └── types.ts            # Contratos de dados
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
docs/                           # Premissas, perguntas ao contador, backlog
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
`listarPremissas()` achata isso, e a interface exibe em `/premissas` e na
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
  navegador, em viewport mobile e desktop).

---

## Processo de validação contábil

1. O contador faz uma simulação em `/simulacao` como um usuário comum.
2. Abre `/premissas` e revisa cada regra — todas trazem valor,
   justificativa e status.
3. Percorre [`docs/PERGUNTAS_PARA_CONTADOR.md`](docs/PERGUNTAS_PARA_CONTADOR.md),
   um roteiro de 30 perguntas organizadas por bloco (as 5 primeiras são as
   que mais importam).
4. Registra os apontamentos em `/feedback` e **exporta em JSON**.
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

---

## Licença

Projeto privado, em desenvolvimento.
