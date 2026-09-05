# Área de trabalho do contador — decisões de UX

Documento de referência da interface. Explica por que o produto acontece
em **uma tela só**, como as zonas foram divididas e o que a tela de
acesso é — e o que ela não é.

Atualizado na V2.4, que reduziu as três zonas permanentes a duas e
reorganizou o resultado em torno da conclusão.

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

**Duas zonas permanentes** em `/workspace`, cada uma com rolagem própria
a partir de 960px. Abaixo disso as zonas empilham e a página rola
inteira.

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Clareza │ Cliente Alfa — cenário 01 │ ● Modelo em validação 5/18 │    │
│                                     │ ≡ Histórico │ + Nova análise    │
├──────────────────────────┬───────────────────────────────────────────┤
│ DADOS DA ANÁLISE (≈40%)  │ RESULTADO (≈60%)                          │
│                          │                                           │
│ A. Contexto da análise   │ 1. Conclusão em uma frase                 │
│    atividade · CNAE ·    │ 2. Diferença mensal e anual               │
│    Anexo · Fator R       │ 3. ● Resultado provisório · 5/18          │
│    [Alterar]             │ 4. Comparativo PF × CNPJ                  │
│                          │    Indicador │ PF │ CNPJ │ Diferença      │
│ B. Dados compartilhados  │                                           │
│    Receita    Custos     │ 5. O que explica a diferença?             │
│                          │    Encargo │ PF │ CNPJ │ Diferença        │
│ C. Situação atual        │    ↳ linha abre os DOIS lados: base ×     │
│                          │      alíquota = valor + premissa + status │
│ D/E. PF  │  CNPJ         │ 6. Passo a passo por cenário (recolhido)  │
│                          │                                           │
│ ⚠ Resultados             │                                           │
│   desatualizados         │                                           │
│ [Atualizar resultados]⌘↵ │                                           │
└──────────────────────────┴───────────────────────────────────────────┘
```

### Zona 1 — Dados

Sempre visível, à esquerda, com rolagem própria. Seis blocos, na ordem da
triagem: contexto, dados compartilhados, situação atual, os dois cenários
lado a lado e a ação.

**PF e CNPJ dividem-se por container query, não por media query.** A
pergunta que decide o layout é "cabe nesta coluna?", e não "que tamanho
tem a janela?" — o contador que usa o produto em meia tela via os
cenários espremidos, e a mesma coluna larga ficava empilhada só porque a
janela era pequena.

A ação **Calcular / Atualizar resultados** fica presa ao rodapé da coluna
(`sticky bottom-0`), com o aviso de resultados desatualizados imediatamente
acima dela — a consequência antes do controle que a resolve.

**Ajuda por divulgação progressiva.** O texto explicativo fixo sob cada
campo ensina na primeira análise e cobra rolagem em todas as seguintes.
Passou para um botão `?` ao lado do rótulo, alcançável por teclado e por
toque, ligado ao campo por `aria-describedby` enquanto aberto. O que
previne erro — validação e conferência — continua sempre visível.

### Zona 2 — Resultado

A hierarquia responde na ordem em que o contador precisa das respostas:

1. **conclusão** em uma frase, condicionada às premissas;
2. **tamanho** da diferença, mensal e anual;
3. **confiança** — estágio de validação colado ao número que ele
   qualifica, com atalho para as premissas pendentes;
4. **comparação** em tabela;
5. **por quê** — frases derivadas do cálculo mais a composição dos
   encargos com PF e CNPJ na mesma tabela;
6. **auditoria** — base, alíquota, premissa e passo a passo.

A escala numérica é contida de propósito. Um "número herói" de 48px serve
a quem vê a tela uma vez; atrapalha quem compara sete indicadores em
sequência.

**A diferença nunca depende de sinal.** Cada célula nomeia o cenário e a
direção — "CNPJ: R$ 2.001,97 a mais", "CNPJ: 4,0 p.p. maior" — porque "+"
é vantagem no resultado líquido e custo nos encargos, e essa inferência
linha a linha é onde a leitura rápida erra.

### O que saiu: a terceira coluna

Até a V2.3 uma coluna de contexto de 19,5rem ficava fixa à direita nas
telas de 1600px ou mais, com estágio de validação, histórico e acessos de
auditoria. Era largura gasta o dia inteiro com informação consultada
pontualmente — e ela saía justamente de onde o contador trabalha.

Nada foi removido:

| Antes (coluna fixa) | Agora |
| --- | --- |
| Estágio de validação | Barra superior **e** no resultado, colado ao número |
| Análises recentes | Painel "Histórico", com busca e duplicação |
| Auditoria e revisão | Painel "Premissas e auditoria" |
| `+ Nova análise` (duplicado) | Uma única ação primária, na barra superior |

### Por que a barra lateral saiu

A V2 tinha navegação lateral persistente de 224px. Com tudo em uma tela,
ela apontaria para lugar nenhum e consumiria espaço horizontal que agora
pertence ao comparativo. Foi substituída por uma barra superior de 48px
com identidade, referência da análise atual, estágio de validação,
histórico, `+ Nova análise`, tema e conta.

### Painéis laterais em vez de páginas

Histórico, premissas, escopo, auditoria e feedback abrem em painel
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
conclusão em uma frase + diferença mensal e anual + estágio de validação
  ↓
comparativo PF × CNPJ na mesma tela
  ↓
abrir a linha de um encargo → os DOIS cenários, com base × alíquota =
valor + premissa + status
  ↓
alterar receita → "resultados desatualizados" → Atualizar resultados
  ↓
abrir ou duplicar outra análise no histórico (repõe os campos, não navega)
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
  consultivo abre por cima, sem apagar o que estava embaixo. Duas colunas,
  nunca três: consulta não compra largura permanente.
- **Reconhecimento no lugar de memória.** Nada que precise ser comparado
  fica atrás de aba. Os dois cenários são preenchidos juntos, comparados
  juntos e auditados juntos.
- **Conferência não é bloqueio.** O schema barra o que impede o cálculo;
  as conferências (`avisos-entrada.ts`) apontam o que é incomum e pedem
  confirmação, sem declarar errado o que pode estar certo.
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
