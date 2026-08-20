# Histórico de versões

Cada versão do Clareza fica marcada por uma tag anotada no Git. Nenhuma
versão é sobrescrita: a anterior continua recuperável a qualquer momento.

---

## V1.0.0 — Simulador orientado ao usuário final

**Status:** preservada no Git, fora de uso.

**Tag:** `v1.0.0`
**Commit:** `3491a53`
**Data:** agosto de 2026

### Características

- wizard guiado de 4 passos, com uma pergunta por tela;
- experiência mobile-first, pensada para 375px;
- landing com proposta de valor, CTA e copy de conversão;
- linguagem simplificada, evitando termos contábeis;
- resultado em página separada (`/resultado`), com número herói e
  explicação em texto corrido;
- transparência do cálculo dentro de blocos `<details>`;
- premissas listadas em cartões.

### Persona

Autônomo ou prestador de serviço **sem** conhecimento contábil, fazendo
uma simulação pontual pelo celular.

---

## V2.0.0 — Workspace profissional para contadores

**Status:** preservada no Git, superada pela V2.1.

**Tag:** `v2.0.0`
**Branch:** `feat/accountant-professional-ux`
**Commits:** `8e26d73`, `2e3166e`, `26a4a7f` e o commit de documentação
**Data:** agosto de 2026

### Principais mudanças

| Área | V1 | V2 |
| --- | --- | --- |
| Persona | Usuário final leigo | Contador profissional |
| Ambiente | Mobile-first (375px) | Desktop-first (1280–1600px) |
| Navegação | Header + footer de marketing | Barra lateral persistente |
| Entrada | Wizard de 4 telas | Formulário único agrupado |
| Resultado | Página separada | Mesma tela do formulário |
| Comparação | Dois cartões | Tabela com coluna de diferença |
| Auditoria | Texto explicativo | Base × alíquota = resultado, com status |
| Premissas | Lista de cartões | Painel com filtros e contagens |
| Recálculo | Voltar pelo wizard | Editar e recalcular no lugar |
| Teclado | Tabulação básica | Ctrl/Cmd+Enter e foco no erro |
| Histórico | Salvo, nunca exibido | Tabela com referência e resultados |

### O que foi preservado integralmente

- motor de cálculo, alíquotas, premissas e fórmulas;
- 67 testes existentes, todos passando;
- comparação PF × CNPJ;
- transparência do cálculo;
- rotas `/premissas` e `/feedback`, com exportação em JSON;
- persistência local e recuperação da última simulação;
- PWA, casca offline e instalação;
- modo claro e escuro;
- avisos sobre o estágio de validação.

### Regressão verificada

Sete cenários representativos foram calculados antes e depois do
redesign. Todos os resultados numéricos — encargos, líquido mensal,
projeção anual, margem, diferença e cada linha do passo a passo —
permanecem idênticos aos da `v1.0.0`.

---

## V2.1.1 — Estabilização operacional

**Status:** versão atual.

**Tag:** `v2.1.1`
**Branch:** `fix/v2.1.1-operational-stability`
**Data:** agosto de 2026

Release de correção, sem funcionalidade nova e sem redesenho. Fecha os
defeitos operacionais apontados na auditoria técnica da `v2.1.0`, cada um
com teste de regressão em volta.

### O que foi corrigido

| Defeito | Antes | Depois |
| --- | --- | --- |
| Identidade da análise | Cada recálculo inseria um registro; 12 cliques apagavam as análises de outros clientes | Recalcular atualiza o mesmo registro; só "Nova análise" gera `id` novo |
| Registro corrompido | Data ilegível derrubava a aplicação inteira, sem recuperação | Registro inválido é ignorado, os válidos sobrevivem, o contador é avisado |
| Exceção no render | Nenhuma fronteira de erro | `error.tsx` e `global-error.tsx`, com limpeza opcional só das chaves `clareza:` |
| Falha de gravação | Retorno ignorado; a interface dizia "salvo" | Resultado tipado propagado até a tela, distinguindo cota de indisponibilidade |
| Atalho Ctrl/Cmd+Enter | Calculava com painel de feedback aberto | Restrito à área de trabalho |
| Estado desatualizado | `JSON.stringify`, sensível à ordem das chaves | Comparação campo a campo |
| Versão das regras | Gravada e nunca lida | Exibida no histórico quando diverge da vigente |

### Verificação de regressão contábil

Dez cenários representativos — incluindo teto do INSS, faixa isenta do
IRPF, margem apertada, custos iguais à receita e o limite de R$ 10
milhões — foram capturados na `v2.1.0` antes de qualquer alteração e
recapturados depois. A saída completa (encargos, bases, alíquotas,
passos, líquidos, margens, comparação e projeção anual) é **idêntica byte
a byte**. `VERSAO_REGRAS` permanece em `v1.1-2026-08`.

### Cobertura

67 → 127 testes. A medição passou a incluir `services/` e `schemas/`,
onde estavam todos os defeitos acima: de 124 para 314 statements.

---

## V2.1.0 — Tela única e acesso demonstrativo

**Status:** base da V2.1.1.

**Tag:** `v2.1.0`
**Branch:** `feat/single-screen-accountant-workspace`
**Data:** agosto de 2026

Evolução de interface, não de modelo contábil. A V2 já era profissional,
mas ainda era um site com seções: premissas, feedback e escopo eram rotas
próprias, e consultar qualquer uma delas tirava a simulação da tela.

### Principais mudanças

| Área | V2.0 | V2.1 |
| --- | --- | --- |
| Telas do fluxo | 5 rotas | 1 rota (`/workspace`) |
| Navegação | Barra lateral de 224px | Barra superior de 48px |
| Acesso | Inexistente | `/login` demonstrativo (sem servidor) |
| Premissas | Rota `/premissas` | Painel lateral sobre a análise |
| Escopo | Rota `/como-funciona` | Painel lateral |
| Feedback | Rota `/feedback` | Painel lateral, com a análise anexada |
| Histórico | Tabela na visão geral | Coluna de contexto, abre sem navegar |
| Auditoria | Tabela fixa de encargos | Linha expansível: conta + premissa + status |
| Passo a passo | Sempre aberto | Recolhido, sob demanda |
| Tema | Só preferência do sistema | Sistema + escolha explícita, persistida |
| Conta | Inexistente | Menu com modo demonstração e sair |

### O que foi preservado integralmente

- motor de cálculo, alíquotas, premissas e fórmulas — **nenhum arquivo de
  `domain/` foi tocado**;
- 67 testes existentes, todos passando;
- comparação PF × CNPJ e a transparência do cálculo;
- persistência local, histórico e recuperação da última análise;
- exportação de feedback em JSON;
- PWA, casca offline e instalação;
- modo claro e escuro;
- avisos sobre o estágio de validação.

### Rotas antigas

Nenhuma foi removida. Todas redirecionam, preservando links salvos,
atalhos do PWA instalado e casca em cache:

| De | Para |
| --- | --- |
| `/` | `/workspace` |
| `/simulacao` | `/workspace` |
| `/resultado` | `/workspace` |
| `/premissas` | `/workspace?painel=premissas` |
| `/feedback` | `/workspace?painel=feedback` |
| `/como-funciona` | `/workspace?painel=escopo` |

### Limitação declarada

A tela de acesso **não é autenticação**: não há servidor, banco, token
nem verificação de credencial, e a senha digitada é descartada no submit.
Detalhes em [`UX_WORKSPACE_CONTADOR.md`](UX_WORKSPACE_CONTADOR.md).

### Regressão verificada

Cinco cenários representativos foram calculados antes e depois do
redesign, com saída serializada em JSON e comparada campo a campo —
encargos, base, alíquota, líquido mensal, projeção anual, margem,
diferença e vencedor. **Diferença: nenhuma.**

---

## Como voltar para a versão anterior

### Inspecionar a V1 sem alterar nada

```bash
git switch --detach v1.0.0
npm install && npm run build && npm run start
```

### Inspecionar a V2.0

```bash
git switch --detach v2.0.0
npm install && npm run build && npm run start
```

### Voltar para o trabalho da V2.1

```bash
git switch feat/single-screen-accountant-workspace
```

### Criar uma branch a partir de uma versão antiga

```bash
git switch -c restore/v1 v1.0.0
git switch -c restore/v2.0 v2.0.0
```

### Ver o que mudou entre as versões

```bash
git diff v1.0.0..v2.0.0 --stat
git diff v2.0.0..v2.1.0 --stat
git log --oneline v2.0.0..v2.1.0
```

> Não use `git reset --hard` para voltar de versão. As tags tornam
> qualquer estado recuperável sem destruir histórico.

---

## Convenção de versionamento

Versionamento semântico, com a tag anotada como fonte de verdade:

- **major** — mudança de persona, de fluxo principal ou de modelo de
  interação (foi o caso da V2);
- **minor** — nova funcionalidade sem quebrar o fluxo existente (foi o
  caso da V2.1: a persona e o modelo de cálculo seguem os mesmos, o que
  mudou foi a arquitetura de informação);
- **patch** — correção ou ajuste pontual.

Mudanças em `calculation-rules.ts` seguem uma trilha própria: a constante
`VERSAO_REGRAS` é incrementada e gravada em cada simulação salva e em cada
feedback, para sabermos com qual modelo cada número foi produzido.

> `package.json` ficou em `0.1.0` durante toda a V1 — era o padrão do
> scaffold e nunca foi mantido. A partir da V2 ele acompanha a tag.
