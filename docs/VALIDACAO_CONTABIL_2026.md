# Validação Contábil 2026 — segunda rodada

**Instrumento:** formulário "Validação Contábil — Clareza 2026", 28 perguntas
em 8 seções, respondido em 07/09/2026.
**Fonte bruta:** `Validação-Contábil — Clarez-2026.csv` (mantido FORA do
Git — contém nome do respondente).
**Documento que originou as perguntas:** [`PENDENCIAS_CONTADOR.md`](PENDENCIAS_CONTADOR.md).

---

## 1. Amostra

| Perfil | Quantidade |
| --- | ---: |
| Contador (persona primária, revisor do modelo) | 1 |
| Outros perfis | 0 |
| **Total de respostas** | **1** |

### Limitações — leia antes de usar este documento

Isto **não é uma pesquisa de usabilidade**. É uma rodada de validação
técnica com **um único respondente**, o contador que revisa o modelo
tributário do Clareza.

Consequências práticas, e nenhuma delas é contornável com estatística:

- **não há frequência, percentual, média nem distribuição.** Qualquer
  número desses seria "1 de 1" disfarçado de dado;
- **não há evidência de usabilidade** vinda de quem não é contador. O
  formulário não tinha participantes secundários e não perguntou sobre
  navegação, hierarquia visual ou clareza de botões;
- **não há sinal comercial.** O formulário não perguntou sobre preço,
  ferramentas atuais, tempo gasto ou intenção de pagar. Nada neste
  documento sustenta conclusão de mercado;
- **um respondente não valida um produto.** O que esta rodada valida é
  um conjunto de PREMISSAS DE CÁLCULO, e mesmo assim parcialmente.

O respondente é identificado como **Respondente 01 — contador**. Nome,
e-mail e demais dados pessoais ficam fora deste documento e fora do
repositório.

---

## 2. Principais descobertas

1. **O bloqueio do IRPF 2026 não foi destravado — mas saiu do escuro.**
   O contador indicou a fonte oficial e respondeu que a isenção até
   R$ 5.000,00 é uma "faixa com imposto zero". A fonte que ele mesmo
   indicou diz o contrário: é um **redutor aplicado depois do cálculo**,
   com decaimento linear até R$ 7.350,00. A pergunta que pedia a fórmula
   ficou em branco. Ver §8.

2. **Três respostas contrariam o texto da LC 123/2006.** Limite do
   Fator R, composição da folha e CPP dentro do DAS. Nenhuma foi
   aplicada. Ver §8.

3. **Uma frase aberta valeu mais que a pergunta fechada correspondente.**
   Perguntado se o sistema deve sugerir pró-labore, respondeu "Sim, 28%
   da receita". Perguntado o que falta para usar no escritório,
   escreveu: *"de início não devemos jogar os 28% no pró-labore, isso
   deve ser um caminho a parte"*. A segunda resposta é mais informativa
   e foi a implementada.

4. **O resultado principal do produto estava no lugar errado.**
   Perguntado qual resultado é mais útil para apresentar ao cliente:
   "quanto economiza por ano". O Clareza destacava a diferença MENSAL.

5. **A comparação favorecia a Pessoa Física por construção.** O campo
   de honorários contábeis da PF começava em R$ 0,00 enquanto o da
   empresa começava em R$ 300,00. O contador informou R$ 150,00 como
   referência — a lacuna que justificava o zero deixou de existir.

---

## 3. Evidências e decisões

Confiança lida assim, com N = 1:

- **ALTA** — resposta direta, não ambígua, sobre algo que está sob nosso
  controle (apresentação, valor de partida, fluxo);
- **MÉDIA** — resposta direta, mas com contradição interna ou faltando
  o dado que a torna acionável;
- **BAIXA** — resposta que contraria fonte legal ou que depende de
  informação que não recebemos.

| Evidência | Origem | Confiança | Impacto | Decisão |
| --- | --- | --- | --- | --- |
| Não semear pró-labore com 28% — "deve ser um caminho a parte" | pergunta aberta | ALTA | Alto — evita comparar cenário que ninguém escolheu | **IMPLEMENTAR** |
| Resultado mais útil é "quanto economiza por ano" | pergunta fechada | ALTA | Alto — muda o número que o contador leva ao cliente | **IMPLEMENTAR** |
| Honorários contábeis da PF: R$ 150,00 de referência | pergunta aberta | ALTA | Médio — remove viés a favor da PF | **IMPLEMENTAR** |
| Nem todo custo informado é dedutível no livro-caixa | fechada ("Não"), detalhe em branco | MÉDIA | Médio — sem a lista, só dá para declarar a simplificação | **AJUSTAR** (texto) |
| Um valor único de folha basta para o Fator R | fechada | ALTA | Baixo — confirma o desenho atual | **NENHUMA MUDANÇA** |
| INSS de 11% sobre pró-labore está correto | fechada | ALTA | Baixo — confirma premissa | **VALIDADA** |
| R$ 300,00 de honorários da empresa é razoável | fechada | ALTA | Baixo — confirma premissa | **NENHUMA MUDANÇA** |
| Isenção de R$ 5.000 é "faixa com imposto zero" | fechada; fórmula em branco | BAIXA | Crítico — distorce a faixa de renda mais comum | **VALIDAR COM CONTADOR** |
| 28% não é o limite correto do Fator R | fechada ("Não"), sem justificativa | BAIXA | Crítico — decide entre Anexo III e V | **VALIDAR COM CONTADOR** |
| FGTS não entra na folha do Fator R; usar pró-labore bruto | aberta | BAIXA | Crítico — muda o anexo de parte dos clientes | **VALIDAR COM CONTADOR** |
| CPP não está dentro do DAS nos Anexos III e V | fechada ("Não") | BAIXA | Crítico — muda todo cenário CNPJ | **VALIDAR COM CONTADOR** |
| Implementar o Anexo IV agora; CPP separada "Depende" | fechadas | MÉDIA | Alto — amplia o público | **INVESTIGAR** (falta a condição) |
| Erro encontrado: "faixa do IRRF pró-labore" | aberta | MÉDIA | Alto — é o mesmo bloqueio do IRPF | **VALIDAR COM CONTADOR** |
| ISS do autônomo: contador informa a alíquota | fechada | ALTA | Médio — funcionalidade nova | **ADIAR** (backlog) |
| Existe alguma regra perigosa hoje? "Não" | fechada | MÉDIA | — | **NENHUMA MUDANÇA** |

---

## 4. Temas qualitativos

Com um respondente não há codificação temática por frequência. O que
existe são **quatro falas abertas**, e três delas mudaram o produto ou
a lista de pendências:

**Estratégia versus dado do cliente.**
> "de início não devemos jogar os 28% no pró-labore, isso deve ser um
> caminho a parte"

Os 28% são o patamar do **Fator R** — a folha que leva a empresa do
Anexo V para o III. Preencher o campo com esse valor transforma uma
ESTRATÉGIA de enquadramento em um dado do cliente, e o contador passa a
comparar um cenário que ninguém decidiu adotar. É um erro de
**prevenção de erro**, não de estética.

**Composição da folha.**
> "FGTS não pode ser considerado, deve ser considerado pró-labore bruto"

Contraria o art. 18, § 24 da LC 123/2006, que cita o FGTS de forma
expressa. Registrado, não aplicado.

**Erro apontado.**
> "Faixa do IRRF prolabore"

Aponta para o mesmo bloqueio do IRPF: a tabela em uso é de 2024.

**Dedutibilidade.**
Respondeu "Não" a "tudo o que for informado em Custos do negócio é
dedutível?", mas deixou em branco *quais* despesas ficam de fora. Dá
para declarar a simplificação; não dá para implementar o filtro.

---

## 5. Problemas priorizados

| # | Problema | Prioridade | Grupo |
| --- | --- | --- | --- |
| 1 | Tabela do IRPF de 2024 em produção, com o desenho da isenção em disputa | **P0** | Validação tributária |
| 2 | Três premissas do Simples contrariadas sem base legal apresentada | **P0** | Validação tributária |
| 3 | Pró-labore preenchido sozinho com o patamar do Fator R | **P1** | Implementado |
| 4 | Resultado principal era mensal; a decisão é anual | **P1** | Implementado |
| 5 | Honorários da PF em zero enviesavam a comparação | **P1** | Implementado |
| 6 | Modelo trata toda despesa como dedutível sem dizer isso no campo | **P2** | Implementado (texto) |
| 7 | Anexo IV classificado mas não calculado | **P2** | Investigar |
| 8 | ISS do autônomo fora do cálculo | **P3** | Backlog |

P0 aqui **não** significa "corrigir agora": significa "não é seguro
mexer sem base legal, e é o que mais importa resolver".

---

## 6. Alterações implementadas

### 6.1 Pró-labore deixa de ser preenchido sozinho

**Antes** — digitar a receita escrevia 28% dela no campo de pró-labore,
em toda análise nova. O contador que não percebesse comparava um
cenário com pró-labore no patamar do Fator R sem ter decidido isso.

**Depois** — o campo começa vazio e continua vazio. A sugestão aparece
abaixo dele, com a origem escrita e um botão "Aplicar". O texto da
origem passou a dizer para que ela serve: *"é o patamar do Fator R, e
serve para simular a migração do Anexo V para o III, não como
pró-labore de partida"*.

**Impacto esperado** — reduzir cenários comparados por acidente. Não
medido.

### 6.2 A economia anual vira o número principal

**Antes** — "Diferença por mês" no maior corpo tipográfico da tela;
"Diferença por ano" abaixo, menor.

**Depois** — "Economia estimada no ano" no maior corpo; "Por mês"
secundário. O anúncio para leitor de tela também lidera pelo ano.

**Impacto esperado** — o número que o contador leva à conversa com o
cliente é o primeiro que ele vê. Não medido.

### 6.3 Honorários contábeis da PF partem de R$ 150,00

**Antes** — R$ 0,00 na PF contra R$ 300,00 na empresa. A PF entrava na
comparação sem custo contábil nenhum.

**Depois** — R$ 150,00, editável, vindo de premissa própria e
independente da premissa da empresa.

**Impacto esperado** — comparação menos enviesada. Não medido.

### 6.4 O campo de custos declara a simplificação

**Antes** — a ajuda dizia "custos operacionais dedutíveis", sugerindo
que havia um filtro de dedutibilidade.

**Depois** — a ajuda diz que o modelo trata como dedutível tudo o que
for informado e que a validação apontou que isso não vale para toda
despesa.

---

## 7. O que NÃO foi implementado, e por quê

| Pedido | Motivo |
| --- | --- |
| Trocar a tabela do IRPF pela de 2026 | A resposta ("faixa com imposto zero") contraria a fonte oficial indicada pelo próprio respondente, que descreve um redutor com decaimento. Ver §8.1 |
| Mudar o limite de 28% do Fator R | Resposta "Não" sem justificativa, contra texto expresso da LC 123/2006 |
| Tirar o FGTS da folha do Fator R | Contraria o art. 18, § 24 da LC 123/2006, que cita o FGTS nominalmente |
| Tirar a CPP de dentro do DAS nos Anexos III e V | Mudaria todo cenário CNPJ; a CPP fora da guia é justamente o que define o Anexo IV |
| Implementar o Anexo IV | Pedido como "implementar agora", mas a pergunta sobre calcular a CPP em separado foi respondida com "Depende", e a condição não foi informada |
| Filtrar despesas não dedutíveis | A pergunta que pedia quais despesas ficam de fora ficou em branco |
| ISS do autônomo informado manualmente | Preferência clara, mas é funcionalidade nova que altera número tributário. Backlog, com especificação em `PENDENCIAS_CONTADOR.md` |

Nenhum destes é "recusa": todos viram pergunta na próxima rodada (§10).

---

## 8. Pendências tributárias

Tudo aqui exige **base legal ou confirmação profissional** antes de
virar código. Hierarquia adotada: legislação oficial → validação do
contador → referência profissional secundária → opinião de formulário.

### 8.1 IRPF 2026 — o bloqueio nº 1, agora com fonte e com divergência

O respondente indicou como fonte as páginas da Receita Federal sobre a
Lei 15.270/2025. Consultadas, elas trazem:

**Tabela progressiva mensal de 2026**

| Base de cálculo mensal | Alíquota | Parcela a deduzir |
| --- | ---: | ---: |
| até R$ 2.428,80 | — | — |
| R$ 2.428,81 a R$ 2.826,65 | 7,5% | R$ 182,16 |
| R$ 2.826,66 a R$ 3.751,05 | 15,0% | R$ 394,16 |
| R$ 3.751,06 a R$ 4.664,68 | 22,5% | R$ 675,49 |
| acima de R$ 4.664,68 | 27,5% | R$ 908,73 |

**Redutor da Lei 15.270/2025**

- rendimento mensal até R$ 5.000,00 → redutor de até R$ 312,89, de modo
  que o imposto devido seja zero;
- entre R$ 5.000,01 e R$ 7.350,00 → redutor de
  **R$ 978,62 − (0,133145 × rendimento tributável mensal)**;
- acima de R$ 7.350,00 → sem redutor.

**A divergência.** O respondente marcou "Faixa com imposto zero". A
fonte descreve um **redutor pós-cálculo com decaimento linear**. A
pergunta que pedia a fórmula do redutor ficou em branco. As duas
leituras produzem impostos diferentes justamente entre R$ 5.000 e
R$ 7.350 — a faixa mais comum entre os clientes do produto.

**A segunda lacuna.** A fonte consultada trata de **IRRF sobre
rendimento assalariado**. O respondente afirmou que a regra vale
também para o **carnê-leão mensal do autônomo** e para o **IRRF sobre
pró-labore** — que são exatamente os dois lugares onde o Clareza usa a
tabela. Essa extensão precisa de base legal citada antes de virar
código.

> Enquanto isso, a tabela de 2024 continua no ar, marcada como
> `hipotese-temporaria` e visível no painel *Premissas do modelo*.
> Trocá-la pela metade seria pior: com a tabela nova e sem o redutor,
> quem ganha R$ 5.000 pagaria imposto onde a lei zera.

### 8.2 Fator R — limite de 28%

Respondido "Não". A LC 123/2006, art. 18, define 28% como a razão entre
folha e receita dos últimos 12 meses que leva a atividade ao Anexo III.
**Valor mantido**, status rebaixado de `validada-tecnicamente` para
`a-validar`.

### 8.3 Fator R — composição da folha

Respondido que o FGTS não entra e que se deve considerar pró-labore
bruto. O art. 18, § 24 da LC 123/2006 inclui expressamente o FGTS
recolhido. **Composição mantida.**

### 8.4 CPP dentro do DAS nos Anexos III e V

Respondido "Não". Se procedesse, todo o cenário CNPJ do produto estaria
errado. A CPP fora da guia única é o traço que define o **Anexo IV** na
própria LC 123/2006. **Hipótese mantida** — com a ressalva de que a
pergunta pode ter sido mal formulada por nós.

### 8.5 Anexo IV

"Implementar agora", mas com "Depende" sobre calcular a CPP em separado
sobre a folha. Sem a condição, não há especificação.

### 8.6 IRRF sobre pró-labore

Apontado como erro encontrado. É o mesmo §8.1.

---

## 9. Hipóteses para a próxima rodada

1. Separar o **pró-labore informado** da **simulação de Fator R** reduz
   cenários comparados por acidente.
2. Com a economia anual em destaque, o contador leva o número certo
   para a conversa sem precisar multiplicar de cabeça.
3. Com honorários em ambos os cenários, a comparação deixa de favorecer
   a PF em clientes de receita baixa.
4. As três divergências do §8.2 a §8.4 vêm de **redação nossa**, não de
   discordância técnica. Testável relendo as perguntas com ele.

---

## 10. Perguntas para a próxima rodada

Máximo de 10, comportamentais, e as quatro primeiras destravam o
produto.

1. A Receita descreve a isenção da Lei 15.270/2025 como um **redutor
   aplicado depois do cálculo** — R$ 978,62 − (0,133145 × rendimento)
   entre R$ 5.000,01 e R$ 7.350,00. No formulário você marcou "faixa
   com imposto zero". Qual das duas devemos programar?
2. Esse redutor se aplica ao **carnê-leão mensal do autônomo**? E ao
   **IRRF sobre pró-labore**? Se sim, qual dispositivo sustenta isso?
3. Você respondeu que 28% **não** é o limite correto do Fator R. O que
   deveria ser usado no lugar, e com base em quê?
4. O art. 18, § 24 da LC 123/2006 manda somar o FGTS recolhido na folha
   do Fator R. Você disse para não considerá-lo. Estamos lendo o
   dispositivo errado, ou existe entendimento diferente na prática?
5. Quando você respondeu que a contribuição patronal **não** está
   dentro do DAS nos Anexos III e V, estava pensando em algum caso
   específico? (Pergunta nossa, provavelmente mal formulada.)
6. Para o Anexo IV você respondeu "implementar agora" e "depende" sobre
   calcular a CPP em separado. **De que depende?**
7. Abra uma análise nova: o campo de pró-labore agora começa vazio, com
   uma sugestão de 28% ao lado. **Qual seria sua próxima ação?**
8. Olhando o resultado, o primeiro número que aparece agora é a
   economia no ano. **É esse o número que você levaria ao cliente?**
   Se não, qual?
9. Quais despesas lançadas em "Custos do negócio" **não** podem ser
   deduzidas no livro-caixa? Cite as três mais comuns.
10. O que ainda impediria você de usar o Clareza em um cliente real
    amanhã?

---

## Sinais comerciais

**Nenhum.** O formulário não perguntou sobre preço, ferramentas atuais,
tempo gasto por análise, uso de planilha, concorrentes ou intenção de
pagar. Não há dado nesta rodada que sustente qualquer conclusão
comercial, e nenhuma foi inferida.
