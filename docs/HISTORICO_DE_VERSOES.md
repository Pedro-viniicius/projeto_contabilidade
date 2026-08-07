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

**Status:** versão atual.

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

## Como voltar para a versão anterior

### Inspecionar a V1 sem alterar nada

```bash
git switch --detach v1.0.0
npm install && npm run build && npm run start
```

### Voltar para o trabalho da V2

```bash
git switch feat/accountant-professional-ux
```

### Criar uma branch a partir da V1

```bash
git switch -c restore/v1 v1.0.0
```

### Ver o que mudou entre as versões

```bash
git diff v1.0.0..v2.0.0 --stat
git log --oneline v1.0.0..v2.0.0
```

> Não use `git reset --hard` para voltar de versão. As tags tornam
> qualquer estado recuperável sem destruir histórico.

---

## Convenção de versionamento

Versionamento semântico, com a tag anotada como fonte de verdade:

- **major** — mudança de persona, de fluxo principal ou de modelo de
  interação (foi o caso da V2);
- **minor** — nova funcionalidade sem quebrar o fluxo existente;
- **patch** — correção ou ajuste pontual.

Mudanças em `calculation-rules.ts` seguem uma trilha própria: a constante
`VERSAO_REGRAS` é incrementada e gravada em cada simulação salva e em cada
feedback, para sabermos com qual modelo cada número foi produzido.

> `package.json` ficou em `0.1.0` durante toda a V1 — era o padrão do
> scaffold e nunca foi mantido. A partir da V2 ele acompanha a tag.
