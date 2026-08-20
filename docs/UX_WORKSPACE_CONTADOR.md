# Área de trabalho do contador — decisões de UX da V2.1

Documento de referência da interface da V2.1. Explica por que o produto
passou a acontecer em **uma tela só**, como as zonas foram divididas e o
que a tela de acesso é — e o que ela não é.

---

## Objetivo

A V2 já tinha abandonado o funil de consumo da V1, mas ainda era um
**site com seções**: visão geral, simulação, premissas, feedback e escopo
eram rotas distintas, com navegação lateral persistente.

Isso cobra um preço específico do contador. Ele não visita o produto: ele
opera o produto, muitas vezes por dia, com um cliente ao telefone. Nesse
uso, cada troca de rota tem três custos:

1. **perde o contexto visual** — a simulação sai da tela para a premissa
   entrar;
2. **perde a posição** — voltar exige reencontrar onde estava;
3. **quebra o raciocínio** — a pergunta "de onde veio esse número?"
   nasce *olhando* o número, e a resposta não deveria exigir abandoná-lo.

A V2.1 elimina esse custo. Depois do acesso, **não há mais troca de rota
no fluxo profissional**: a análise em andamento nunca sai da tela.

---

## Persona

**Contador brasileiro em uso repetido.** Conhece a terminologia, não
precisa de explicação didática, precisa de velocidade, densidade e
rastreabilidade. Trabalha em desktop; o celular é consulta eventual.

O que ele precisa fazer sem fricção:

- lançar receita, custos e pró-labore rapidamente;
- ver PF × CNPJ lado a lado;
- conferir de onde saiu cada encargo;
- saber se a regra por trás daquele encargo já foi validada;
- alterar um valor e recalcular;
- retomar a análise de outro cliente;
- registrar uma divergência sem perder o que estava fazendo.

---

## Layout

Três zonas em `/workspace`, cada uma com rolagem própria a partir de
960px. Abaixo disso as zonas empilham e a página rola inteira.

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Clareza │ Cliente Alfa — cenário 01   Modelo em validação 7/10  ⬇ ☾ AR│
├───────────────┬──────────────────────────────┬───────────────────────┤
│ DADOS         │ RESULTADO / COMPARAÇÃO       │ CONTEXTO              │
│ (21rem)       │ (flexível)                   │ (19,5rem)             │
│               │                              │                       │
│ Identificação │ Resumo executivo             │ Modelo de cálculo     │
│ Cenário       │  maior resultado · mensal ·  │ Análises recentes     │
│ Receita       │  anual                       │ Auditoria e revisão   │
│ Custos        │                              │                       │
│ Pró-labore    │ Comparativo PF × CNPJ        │                       │
│               │                              │                       │
│ [Calcular] ⌘↵ │ Composição dos encargos      │                       │
│ (fixo abaixo) │  ↳ linha abre: base ×        │                       │
│               │    alíquota = valor +        │                       │
│               │    premissa + status         │                       │
│               │ Passo a passo (recolhido)    │                       │
└───────────────┴──────────────────────────────┴───────────────────────┘
```

### Zona 1 — Dados

Sempre visível, à esquerda, com rolagem própria. A ação **Calcular /
Recalcular** fica presa ao rodapé da coluna (`sticky bottom-0`): em telas
mais baixas o formulário passa da altura útil, e uma ação fora de alcance
obrigaria a rolar a cada iteração — que é o gesto mais repetido do
produto.

O aviso de valores alterados vive aqui, junto do botão que resolve o
problema, e não apenas no topo do resultado.

### Zona 2 — Resultado

Resumo executivo (maior resultado estimado, diferença mensal, impacto
anual), comparativo em tabela e composição dos encargos.

A escala numérica é contida de propósito. Um "número herói" de 48px serve
a quem vê a tela uma vez; atrapalha quem compara sete indicadores em
sequência. A hierarquia é feita por peso e rótulo, não por tamanho.

### Zona 3 — Contexto

Estágio de validação do modelo, análises recentes e os acessos de
auditoria. A partir de 1280px é coluna fixa; abaixo disso o **mesmo
conteúdo** abre como painel lateral pelo botão "Contexto" da barra
superior — sem componente duplicado e sem troca de rota.

### Por que a barra lateral saiu

A V2 tinha navegação lateral persistente de 224px. Com tudo em uma tela,
ela apontaria para lugar nenhum e consumiria espaço horizontal que agora
pertence ao comparativo. Foi substituída por uma barra superior de 48px
com identidade, referência da análise atual, status do modelo, tema e
conta.

### Painéis laterais em vez de páginas

Premissas, escopo, feedback e (abaixo de 1280px) contexto abrem em painel
sobreposto à direita, com a análise visível atrás. São diálogos modais de
verdade: rótulo, foco levado para dentro na abertura, foco preso enquanto
abertos, `Escape` fecha, rolagem do documento travada e foco devolvido ao
elemento que abriu.

---

## Fluxo principal

```text
acesso
  ↓
área de trabalho (/workspace)
  ↓
lançar dados → Calcular (ou Ctrl/Cmd + Enter)
  ↓
comparativo PF × CNPJ na mesma tela
  ↓
abrir a linha de um encargo → base × alíquota = valor + premissa + status
  ↓
alterar receita → "valores alterados" → Recalcular
  ↓
abrir outra análise no histórico (repõe os campos, não navega)
  ↓
registrar observação (painel, com a análise anexada)
  ↓
voltar à análise — que nunca saiu da tela
```

**Trocas de rota nesse fluxo: zero.**

---

## Princípios de design

- **Velocidade.** Campos compactos (36–40px), máscara de moeda que
  interpreta dígitos como centavos, ordem de tabulação previsível,
  `Ctrl/Cmd + Enter` de qualquer lugar. Cálculo local e síncrono — sem
  spinner inventado para operação instantânea.
- **Densidade.** Superfícies neutras, separadores de 1px, raios contidos,
  sombra quase ausente. A informação ocupa o espaço; a decoração, não.
- **Visibilidade contextual.** O que é permanente fica em coluna; o que é
  consultivo abre por cima, sem apagar o que estava embaixo.
- **Pouca navegação.** Navegar é custo, não funcionalidade. Só existe uma
  transição de tela no produto inteiro: acesso → área de trabalho.
- **Auditabilidade.** Todo encargo mostra base, alíquota e a premissa que
  o gerou, com o estágio de validação dela. Nenhum número da interface é
  escrito à mão: contagens e status vêm de `resumoValidacao()` e
  `listarPremissas()`, derivados das regras reais.
- **Cor nunca sozinha.** Status sempre trazem texto; erros trazem ícone e
  texto; o maior resultado é marcado por símbolo e texto acessível, não
  por cor de julgamento — o modelo ainda está em validação e um resultado
  maior não é recomendação.

---

## Limitação: o acesso não é autenticação

A tela `/login` é **protótipo de interface**. Não existe:

- servidor de autenticação;
- banco de dados;
- sessão de servidor;
- token, JWT ou cookie de sessão;
- verificação de credencial.

O que o formulário faz:

1. confere se o e-mail tem formato válido e se a senha não está vazia;
2. grava uma marca local (`clareza:demo:sessao`) com o e-mail e o
   horário;
3. abre a área de trabalho.

A senha **é descartada no submit**: não é gravada, comparada, derivada
nem transmitida. Não há credencial secreta embutida no código fingindo
segurança — qualquer e-mail bem formado com qualquer senha entra, e isso
é proposital.

Qualquer pessoa com acesso ao navegador pode gravar a mesma marca pelo
console. **A tela de acesso demonstra experiência, não protege nada.**

A interface declara isso no lugar certo, sem poluir o trabalho do
contador com avisos técnicos: um bloco "Ambiente demonstrativo" no rodapé
do formulário e a linha "Modo demonstração" dentro do menu da conta.

O logout apaga apenas a marca de sessão. Análises, histórico e feedback
continuam no aparelho — sair não é apagar dados.

---

## Evolução futura

A autenticação real substitui `src/features/sessao/services/sessao-demo.ts`
**sem redesenhar nada da interface**. Esse módulo é a única fronteira:

| Hoje | Depois |
| --- | --- |
| `iniciarSessaoDemo()` grava em `localStorage` | `POST /api/sessao` e cookie `httpOnly` |
| `lerSessaoDemo()` lê e revalida por schema | lê a sessão do servidor |
| `encerrarSessaoDemo()` remove a chave | `DELETE /api/sessao` |
| guarda no cliente redireciona para `/login` | proxy/middleware protege a rota antes do render |

O mesmo vale para a persistência: `simulacao-storage.ts` e
`feedback-storage.ts` já guardam **entrada**, nunca resultado, e o
registro de feedback já tem o formato que um `POST /api/feedback`
receberia. Trocar o armazenamento por nuvem é reimplementar esses
módulos, não a interface.

> Isto descreve como a migração **poderia** acontecer. Não é recomendação
> de fazê-la agora: o que trava o produto hoje é validação contábil, não
> infraestrutura.
