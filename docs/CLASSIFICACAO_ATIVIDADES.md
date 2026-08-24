# Classificação de atividades — Clareza

**Versão das regras:** `v1.2-2026-08`
**Arquivos-fonte:**
`src/features/simulacao/domain/catalogo-atividades.ts` (catálogo),
`src/features/simulacao/domain/classificacao.ts` (decisão),
`src/features/simulacao/domain/simples-nacional.ts` (mecânica),
`src/features/simulacao/domain/calculation-rules.ts` (todos os números).

> **O que este documento é.** A auditoria de como o Clareza sai de "qual
> atividade?" e chega a "qual anexo". Escrito para ser conferido por um
> contador sem abrir uma linha de código.

---

## Por que a atividade vem primeiro

A revisão de agosto/2026 foi direta: o sistema começava pela pergunta
errada. Perguntava valores antes de saber o que estava sendo analisado.

O raciocínio real é o inverso:

```text
Qual é a atividade exercida?
        ↓
Que tratamento tributário ela admite?
        ↓
Qual anexo — ou quais anexos possíveis?
        ↓
O Fator R se aplica?
        ↓
Então: quais variáveis precisam ser pedidas?
        ↓
Preenchimento de PF e PJ
        ↓
Cálculo → comparação → auditoria
```

A interface segue essa ordem por **hierarquia**, não por assistente de
várias telas. Tudo continua acontecendo na mesma área de trabalho: o
contador pode voltar à atividade, trocar um valor e recalcular sem
recomeçar nada.

---

## O compromisso central

**A classificação nunca é inferida do texto do rótulo.**

Não existe, em lugar nenhum do código, algo como:

```ts
if (atividade.includes("engenharia")) anexo = "V";
```

Uma atividade só é classificada se estiver **no catálogo**, com CNAE e
fonte. O que não está sai como **classificação pendente** — nunca como
um anexo chutado.

O teste `classificacao.test.ts` fixa isso: um id que *contém* a palavra
"engenharia" mas não está no catálogo continua pendente.

---

## O catálogo

Cada entrada carrega:

| Campo | O que é |
| --- | --- |
| `id` | Identificador estável, gravado na análise salva |
| `cnae` | Código CNAE, no formato `0000-0/00` |
| `descricao` | Nome da atividade, como aparece na busca |
| `categoria` | Agrupamento para leitura rápida |
| `termos` | Sinônimos que o contador provavelmente digita |
| `anexosPossiveis` | Um anexo, ou os dois entre os quais a atividade transita |
| `sujeitaFatorR` | Se o Fator R decide o anexo |
| `fonte` | Referência legal e ano da conferência |
| `status` | Estágio de validação |

### Escopo desta versão

O catálogo cobre **22 atividades de prestação de serviço** — não é a
base completa de CNAEs do Brasil, e a interface diz isso ao contador,
com o número real, logo abaixo do campo de busca.

A arquitetura aceita crescer: acrescentar uma atividade é acrescentar
um item ao arranjo, e os testes de integridade passam a valer para ela
automaticamente.

**Não copiamos base de CNAE de concorrente.** As classificações foram
transcritas da LC 123/2006 (redação da LC 155/2016) e conferidas contra
duas referências profissionais de 2026.

### Busca

Encontra por descrição, CNAE (com ou sem pontuação), categoria ou
sinônimo, ignorando acento e caixa. A ordenação é por qualidade do
casamento, não alfabética:

1. CNAE que começa com os dígitos digitados;
2. descrição que começa com o termo;
3. termo em início de palavra na descrição;
4. sinônimo exato;
5. termo em qualquer posição da descrição;
6. sinônimo parcial;
7. categoria.

Empate é desfeito por posição do casamento, depois por descrição mais
curta — quem cita o termo mais cedo e mais objetivamente aparece antes.

---

## Como o anexo é decidido

```text
                    ┌─ anexoManual definido? ─→ ANEXO MANUAL (declarado como manual)
                    │
atividade ──────────┼─ fora do catálogo? ─────→ CLASSIFICAÇÃO PENDENTE
                    │
                    ├─ não sujeita a Fator R ─→ anexo único da atividade
                    │
                    └─ sujeita a Fator R ─────→ Fator R apurável?
                                                 ├─ não ─→ CLASSIFICAÇÃO PENDENTE
                                                 ├─ ≥ 28% ─→ Anexo III
                                                 └─ < 28% ─→ Anexo V
```

O limite de 28% é **inclusivo**: exatamente 28% já vale Anexo III. Há
teste de fronteira para os três casos — abaixo, exatamente no limite e
acima.

### Fator R

```text
Fator R = folha dos últimos 12 meses ÷ receita bruta dos últimos 12 meses
```

A folha inclui, conforme a LC 123/2006: remuneração paga a pessoas
físicas nos 12 meses anteriores, contribuição patronal e FGTS
efetivamente recolhidos, **incluídas as retiradas de pró-labore**.

O simulador pede o total já somado, em um campo só. Quebrá-lo em
parcelas exigiria dados de folha que o contador normalmente não tem em
mãos durante a triagem. **Isso está marcado como "a validar".**

Sem RBT12 não há Fator R: a função devolve `null`, e não zero. Zero
significaria "folha nenhuma" e classificaria no Anexo V uma empresa
sobre a qual não sabemos nada.

### Alíquota efetiva

```text
Alíquota efetiva = (RBT12 × alíquota nominal − parcela a deduzir) ÷ RBT12
```

**RBT12 igual a zero não divide por zero.** Sem receita acumulada não há
o que deduzir, e a alíquota efetiva é a nominal da primeira faixa — o
mesmo valor para o qual a fórmula tende quando a RBT12 se aproxima de
zero.

Quando a RBT12 não é informada, projetamos a receita mensal por 12 e
**dizemos que projetamos**, na tela e no detalhe da classificação. É uma
simplificação declarada, não um dado.

---

## Anexos suportados

| Anexo | Classificação | Cálculo | Por quê |
| --- | --- | --- | --- |
| I — Comércio | Fora do catálogo | Tabela presente | Fora do escopo do produto |
| II — Indústria | Fora do catálogo | Tabela presente | Fora do escopo do produto |
| III — Serviços | ✅ | ✅ | CPP dentro do DAS |
| IV — Serviços com CPP à parte | ✅ | ❌ **bloqueado** | A CPP fica FORA da guia única e o motor não modela esse encargo |
| V — Serviços intelectuais | ✅ | ✅ | CPP dentro do DAS |

O bloqueio do Anexo IV é deliberado. Advocacia, construção civil,
limpeza e vigilância são **classificadas corretamente**, mas o cenário
CNPJ não é calculado: o simulador assume que a contribuição patronal
está embutida na alíquota, e no Anexo IV ela não está. Calcular assim
mesmo produziria um número errado por construção — exatamente o que a
revisão de agosto pediu para parar de fazer.

Escolher o Anexo IV manualmente **não** contorna o bloqueio.

---

## Classificação manual

O contador pode sobrepor a classificação automática, com motivo
opcional. A escolha:

- fica gravada na análise (`anexoManual`, `motivoAnexoManual`);
- aparece etiquetada como **"Anexo X (manual)"** no formulário e no
  comparativo;
- é dita com todas as letras no "Por que esta classificação?";
- é reversível por "Voltar ao automático".

**Classificação manual nunca se apresenta como automática.** Uma análise
salva hoje e reaberta em seis meses continua dizendo que o anexo foi
escolhido à mão.

---

## Análises salvas antes da v2.2.0

Registros gravados pela v2.1 não tinham atividade. Eles **continuam
sendo aceitos** — rejeitá-los apagaria o histórico do contador numa
atualização — e voltam com:

| Campo | Valor | Por quê |
| --- | --- | --- |
| `atividadeId` | `null` | Ninguém informou atividade na época; atribuir uma agora seria inventar dado |
| `honorariosContabeisPj` | o antigo `custoContabilidade` | O honorário único era o da empresa |
| `honorariosContabeisPf` | `0` | O custo contábil do autônomo nunca existiu naquela versão |
| `rbt12`, `folha12m` | `0` | O motor projeta e avisa que projetou |

Uma atividade que saia do catálogo no futuro **não ressuscita
classificada**: o schema valida o id contra a lista vigente.

---

## Fontes

### Oficial

- **Lei Complementar 123/2006**, com a redação da **Lei Complementar
  155/2016** — Anexos I a V (faixas de RBT12, alíquotas nominais e
  parcelas a deduzir), fórmula da alíquota efetiva, regra do Fator R e
  composição da folha.

### Profissional (conferência secundária)

- Referência de 2026 sobre Anexo III (faixas e atividades).
- Referência de 2026 sobre Anexo V (faixas e composição da folha do
  Fator R).
- Referência de 2026 sobre Anexo IV (CPP fora do DAS).

As alíquotas iniciais que o contador informou na revisão de agosto/2026
— I 4%, II 4,5%, III 6%, IV 4,5%, V 15,5% — **batem** com a primeira
faixa de cada tabela transcrita. Isso é conferência, não validação: o
aceite formal do contador sobre a transcrição completa segue pendente.

**Nenhuma consulta externa acontece em tempo de cálculo.** O catálogo e
as tabelas são internos, e o produto não depende de nenhuma página de
terceiro para funcionar.

---

## Limitações conhecidas

1. **Catálogo pequeno.** 22 atividades. O que não está nele fica pendente.
2. **Anexo IV sem cálculo.** Classificado, não calculado.
3. **CPP no Anexo III/V.** O motor assume a contribuição patronal
   embutida no DAS. Isso vale para III e V, mas nunca foi confirmado
   pelo contador — segue como pergunta aberta.
4. **Folha do Fator R em um campo só.** Sem quebra em salários,
   encargos e pró-labore.
5. **Primeiro ano de empresa.** Sem 12 meses de histórico, projetamos.
   O que a Receita manda usar nesse caso segue sem resposta.
6. **Status de todas as entradas: "a validar".** Nenhuma se declara
   validada tecnicamente, porque nenhuma recebeu aceite profissional.
