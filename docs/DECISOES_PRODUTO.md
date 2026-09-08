# Decisões de produto

Registro das decisões que **mudaram o comportamento do Clareza** e da
evidência que as sustentou. Existe para que uma iteração futura não
desfaça por engano algo que foi decidido com base em pesquisa — e para
que se saiba, meses depois, o que era evidência e o que era palpite.

Uma entrada por decisão. Do mais recente para o mais antigo.

---

## 2026-09-07 · Pró-labore deixa de ser preenchido automaticamente

**Evidência**
Validação Contábil 2026, pergunta aberta: *"de início não devemos jogar
os 28% no pró-labore, isso deve ser um caminho a parte"* — Respondente
01, contador. Confiança ALTA.

Na pergunta fechada correspondente ele havia respondido "Sim, 28% da
receita". As duas respostas convivem: ele aceita a sugestão, recusa o
preenchimento automático.

**Problema**
Digitar a receita escrevia 28% dela no campo de pró-labore. Os 28% são o
patamar do **Fator R** — a folha que leva a empresa do Anexo V para o
III. Usá-los como valor inicial transforma uma ESTRATÉGIA de
enquadramento em um dado do cliente: o contador comparava um cenário que
ninguém decidiu adotar, sem perceber.

**Decisão**
O campo começa vazio e permanece vazio. A sugestão continua visível
abaixo dele, com a origem escrita e um botão "Aplicar".

**Alternativas consideradas**
- *Manter o preenchimento e só melhorar o texto de origem* — não resolve:
  o valor já entrou no cálculo antes de qualquer texto ser lido.
- *Remover a sugestão inteira* — jogaria fora informação útil; ele
  respondeu que quer a sugestão.

**Motivo**
Prevenção de erro. Reconhecimento em vez de imposição.

**Status** — implementado (v2.8.0). Guardado por teste de regressão em
`simulacao-schema.test.ts`.

---

## 2026-09-07 · Economia anual vira o resultado principal

**Evidência**
Validação Contábil 2026, pergunta fechada "Qual resultado você considera
mais útil para apresentar ao cliente?" → **"Quanto economiza por ano"**.
Confiança ALTA. Confirma o item 20 de `PENDENCIAS_CONTADOR.md`, aberto
desde agosto/2026.

**Problema**
O maior número da tela era a diferença MENSAL. A decisão de abrir CNPJ é
anual, e o valor mensal é pequeno demais para justificar o custo e o
trabalho de manter a empresa — o contador multiplicava de cabeça antes
de falar com o cliente.

**Decisão**
"Economia estimada no ano" ocupa o maior corpo tipográfico; "Por mês"
desce um degrau na escala. O anúncio para leitor de tela também lidera
pelo ano.

**Alternativas consideradas**
- *Mostrar só o anual* — o mensal é o que o cliente sente no caixa;
  remover empobreceria a conversa.
- *Deixar o contador escolher o destaque* — preferência configurável
  para um produto que ainda não tem preferência nenhuma; adiado.

**Motivo**
Hierarquia da informação segue a decisão real do usuário.

**Status** — implementado (v2.8.0).

---

## 2026-09-07 · Honorários contábeis da PF partem de R$ 150,00

**Evidência**
Validação Contábil 2026: *"Qual valor você usaria como referência
inicial para honorários contábeis do autônomo (PF)?"* → **150**.
Confiança ALTA. Fecha o item 14 de `PENDENCIAS_CONTADOR.md`.

**Problema**
O campo da PF começava em R$ 0,00 e o da empresa em R$ 300,00. A Pessoa
Física entrava na comparação **sem custo contábil nenhum** — um viés de
R$ 300/mês a favor da PF, embutido no valor de partida.

O zero tinha sido uma decisão consciente de agosto/2026: sem referência
profissional, inventar um número inclinaria a comparação em silêncio. A
validação de setembro forneceu a referência que faltava, e o zero passou
a ser a distorção.

**Decisão**
Premissa `pessoaFisica.custoContabilidadeMensal` de 0 para 150, editável,
independente da premissa da empresa. `VERSAO_REGRAS` para `v1.3-2026-09`.

**Alternativas consideradas**
- *Manter zero e oferecer R$ 150 como sugestão clicável* — coerente com a
  decisão do pró-labore, mas os dois casos são diferentes: 28% é uma
  estratégia de enquadramento, R$ 150 é um custo fixo de referência,
  igual aos R$ 300 da empresa, que já era padrão e foi confirmado na
  mesma validação.

**Motivo**
Simetria entre os dois cenários. Um valor de partida ausente não é
neutro.

**Status** — implementado (v2.8.0). O teste que guardava "é zero" foi
reescrito para guardar o que continua verdade: nenhum cenário entra sem
custo contábil, e os dois valores são independentes.

---

## 2026-09-07 · Não alterar regra tributária por resposta de formulário

**Evidência**
Quatro respostas da Validação Contábil 2026 contrariam texto legal ou a
fonte oficial indicada pelo próprio respondente:

- isenção de R$ 5.000 como "faixa com imposto zero" × Lei 15.270/2025,
  que descreve redutor pós-cálculo com decaimento;
- 28% "não" é o limite do Fator R × LC 123/2006, art. 18;
- FGTS fora da folha do Fator R × LC 123/2006, art. 18, § 24;
- CPP fora do DAS nos Anexos III e V × a exceção que define o Anexo IV.

**Problema**
Aplicar qualquer uma mudaria números tributários de todas as análises,
com base em uma marcação de múltipla escolha, sem dispositivo citado — e
duas delas contra a fonte que o próprio respondente indicou.

**Decisão**
Nenhum valor foi alterado. As quatro divergências foram registradas
dentro das premissas correspondentes em `calculation-rules.ts` — onde o
contador as lê no painel *Premissas do modelo* — e viraram as quatro
primeiras perguntas da próxima rodada.

O status de `fatorRLimite` desceu de `validada-tecnicamente` para
`a-validar`: uma premissa contestada não pode continuar anunciada como
validada.

**Alternativas consideradas**
- *Implementar e marcar como "a validar"* — o produto exibiria número
  errado com etiqueta amarela; a etiqueta não desfaz a conta.
- *Ignorar as divergências* — perderia o sinal mais valioso da rodada.

**Motivo**
Hierarquia de fonte: legislação oficial → validação profissional →
referência secundária → opinião de formulário. Regra 8 do `AGENTS.md`:
não inventar precisão contábil.

**Status** — registrado. Aguarda a próxima rodada.

---

## 2026-09-05 · Tema claro como padrão do produto

**Evidência**
Relato direto do responsável pelo produto: a aplicação abria escura em
máquina com o sistema operacional em escuro.

**Problema**
Um `@media (prefers-color-scheme: dark)` fazia a mesma análise abrir
clara em um computador e escura em outro, sem escolha dentro do produto.

**Decisão**
Claro é o padrão em qualquer máquina. Escuro é escolha explícita,
gravada no navegador. A preferência anterior à v2.7 é descartada uma
vez, porque foi produzida pelo modelo antigo e não distingue escolha de
herança do sistema operacional.

**Status** — implementado (v2.7.0 e v2.7.1).

---

## Como usar este arquivo

- Uma entrada por decisão que muda comportamento. Ajuste visual sem
  mudança de comportamento fica no `CHANGELOG.md`.
- Sempre citar a evidência e o nível de confiança. "Achamos melhor" é
  uma entrada válida — desde que diga que é isso.
- Alternativas consideradas não são enfeite: são o que impede a próxima
  iteração de refazer a discussão do zero.
- Decisão revertida não é apagada. Ganha uma entrada nova dizendo o que
  mudou e por quê.
