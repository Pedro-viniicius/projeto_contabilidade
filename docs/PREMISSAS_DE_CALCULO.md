# Premissas de cálculo — Clareza

**Versão das regras:** `v1.2-2026-08`
**Arquivo-fonte:** `src/features/simulacao/domain/calculation-rules.ts`
**Última revisão contábil:** agosto de 2026 (parcial — 9 de 30 pontos respondidos)

> **Leia isto primeiro.** Uma primeira revisão contábil aconteceu em
> agosto de 2026 e apontou **duas premissas erradas por construção**. Uma
> delas — a alíquota única de 11% sobre o faturamento — **foi corrigida
> na v2.3.0**: o simulador passou a identificar a atividade, apurar o
> Fator R e aplicar a alíquota efetiva real das tabelas do Simples
> Nacional. A outra, a tabela do IRPF com a isenção de R$ 5.000, segue
> bloqueada à espera dos números.
>
> As tabelas dos anexos foram transcritas da LC 123/2006 e conferidas
> contra referências profissionais, mas **ainda não receberam aceite do
> contador** — estão como "a validar", não como validadas.
>
> Detalhamento da classificação em
> [`CLASSIFICACAO_ATIVIDADES.md`](CLASSIFICACAO_ATIVIDADES.md);
> pendências em [`PENDENCIAS_CONTADOR.md`](PENDENCIAS_CONTADOR.md).
>
> Nas premissas ainda não validadas, os valores foram escolhidos para que
> a simulação seja **compreensível e fácil de corrigir**, não para produzir
> precisão fiscal. Cada linha desta página é um ponto de decisão para a
> próxima rodada de revisão.

---

## Como o sistema está organizado

Todo número de natureza tributária vive em **um único arquivo**
(`calculation-rules.ts`) — inclusive as tabelas dos cinco anexos do
Simples Nacional e o limite do Fator R. Nenhum componente de interface
contém alíquota, teto ou faixa.

Um segundo arquivo do domínio, `catalogo-atividades.ts`, guarda o
**vínculo entre atividade e anexos possíveis**. Ele não contém número
tributário nenhum: só CNAE, descrição e quais anexos a atividade pode
ocupar. A mecânica que usa esses dados (alíquota efetiva, Fator R,
resolução do anexo) fica em `simples-nacional.ts` e `classificacao.ts`,
funções puras que leem os números de `calculation-rules.ts`.

Cada premissa carrega, junto do valor, três metadados que aparecem na
interface do produto (painel **Premissas do modelo** e a linha expansível
de cada encargo, na composição do cálculo):

- **descrição** — o que a premissa representa;
- **por que existe** — o que ela simplifica e o que ela deixa de fora;
- **status** — em que estágio de validação está.

### Legenda de status

| Status | Significado |
| --- | --- |
| Hipótese temporária | Valor escolhido para o MVP funcionar. Muda por lei ou por contexto. Alta prioridade de revisão. |
| A validar com contador | A mecânica parece correta, mas precisa de confirmação profissional. |
| Validada tecnicamente | Revisada e aprovada por contador. **3 premissas de INSS estão neste estado.** |
| Não aplicável | Fora do escopo desta versão. |

---

## Tabela de premissas

### Geral

| Regra | Valor/Premissa | Onde é usada | Status |
| --- | --- | --- | --- |
| Meses no ano | 12 | Projeção anual dos dois cenários | Hipótese temporária |

**O que fica de fora:** sazonalidade, 13º, férias, meses sem faturamento.
A projeção anual é simplesmente o resultado mensal × 12.

---

### Simples Nacional

| Regra | Valor/Premissa | Onde é usada | Status |
| --- | --- | --- | --- |
| Tabelas por anexo | 5 anexos × 6 faixas de RBT12 | Alíquota efetiva do cenário CNPJ | A validar |
| Fator R — limite | 28% da receita de 12 meses | Escolha entre Anexo III e V | Validada tecnicamente |
| Fator R — composição da folha | Salários + patronal + FGTS + pró-labore, 12 meses | Cálculo do Fator R | A validar |
| Anexos com cálculo | III e V | Cenário CNPJ | A validar |
| Teto da RBT12 | R$ 4.800.000 em 12 meses | Bloqueio do cálculo acima do teto | Validada tecnicamente |

**Alíquota efetiva:**

```text
(RBT12 × alíquota nominal − parcela a deduzir) ÷ RBT12
```

RBT12 igual a zero **não** divide por zero: sem receita acumulada não há
o que deduzir, e a efetiva é a nominal da primeira faixa.

**O que fica de fora:** partilha do DAS entre tributos, ISS fixo de
escritórios contábeis, sublimites estaduais de ICMS/ISS, CPP fora do DAS
(motivo do bloqueio do Anexo IV) e regra própria para o primeiro ano de
empresa — hoje projetamos a receita mensal por 12 e avisamos na tela.

---

### Cenário Pessoa Física / Autônomo

| Regra | Valor/Premissa | Onde é usada | Status |
| --- | --- | --- | --- |
| INSS — alíquota | 20% | Cálculo do INSS do contribuinte individual | ✅ Validada |
| INSS — teto de contribuição | R$ 8.475,55/mês | Limite superior do salário de contribuição | ✅ Validada |
| INSS — piso de contribuição | R$ 1.621,00/mês | Limite inferior do salário de contribuição | ✅ Validada |
| IRPF — tabela progressiva mensal | 5 faixas, de 0% a 27,5% | Imposto de renda sobre a base do carnê-leão | ⚠️ Desatualizada |

**Revisão de agosto/2026 — o que mudou:**

| Regra | Antes | Depois |
| --- | --- | --- |
| INSS — piso | R$ 1.518,00 | **R$ 1.621,00** |
| INSS — teto | R$ 8.157,41 | **R$ 8.475,55** |

Efeito: em bases acima do teto, o resultado líquido da PF cai R$ 46,13 por
mês (R$ 553,56 no ano). O INSS sobe R$ 63,63 e o IRPF cai R$ 17,50, porque
a contribuição maior reduz a base do imposto de renda. Abaixo do teto,
nada muda.

Sobre a **retenção de 11%** quando o tomador é pessoa jurídica: avaliada e
deliberadamente ignorada. É antecipação de pagamento e não altera o
resultado prático — não é mais uma lacuna, é uma decisão.

> ⚠️ **A tabela do IRPF abaixo está sabidamente desatualizada.** A revisão
> confirmou que precisa ser substituída e que a nova regra inclui a
> **isenção até R$ 5.000,00**, mas as faixas exatas não foram informadas.
> Não as preenchemos por conta própria: a isenção não é uma faixa a mais —
> envolve um redutor na transição, e errar esse desenho distorce justamente
> a faixa de renda mais comum entre os clientes.

**Faixas do IRPF usadas (base mensal):**

| Base até | Alíquota | Parcela a deduzir |
| --- | --- | --- |
| R$ 2.259,20 | 0% | R$ 0,00 |
| R$ 2.826,65 | 7,5% | R$ 169,44 |
| R$ 3.751,05 | 15% | R$ 381,44 |
| R$ 4.664,68 | 22,5% | R$ 662,77 |
| acima | 27,5% | R$ 896,00 |

**Ordem do cálculo:**

```
base do livro-caixa = receita − custos do negócio
INSS                = min(max(base, piso), teto) × 20%
base do IRPF        = base − INSS
IRPF                = base do IRPF × alíquota da faixa − parcela a deduzir
resultado líquido   = base − INSS − IRPF
```

**O que fica de fora:** plano simplificado de INSS (11%), dependentes,
despesas médicas e de educação, desconto simplificado, ajuste anual, ISS
municipal. A retenção de 11% pelo tomador PJ saiu desta lista: foi
avaliada na revisão e descartada por não alterar o resultado prático.

---

### Cenário CNPJ / Prestador de serviço

| Regra | Valor/Premissa | Onde é usada | Status |
| --- | --- | --- | --- |
| DAS pelo anexo resolvido | Tabelas do Simples × RBT12 | Tributos da empresa | A validar |
| Alíquota de recurso | 11% | **Só** quando a classificação está pendente | ⚠️ Incorreta |
| Honorários contábeis — Empresa/PJ | R$ 300,00/mês (editável) | Custo fixo da empresa | A validar |
| INSS sobre pró-labore | 11% | Retenção do sócio | A validar |
| Pró-labore sugerido | 28% do faturamento | Valor inicial do formulário | Hipótese temporária |
| Lucro distribuído | Tratado como isento | Resultado após pró-labore | A validar |

**Ordem do cálculo:**

```
alíquota efetiva        = (RBT12 × nominal do anexo − parcela) ÷ RBT12
tributos do faturamento = receita × alíquota efetiva
                          (sem anexo resolvido: receita × 11% de recurso,
                           e o resultado sai marcado "sem enquadramento")
INSS do pró-labore      = min(pró-labore, teto do INSS) × 11%
base do IRRF            = pró-labore − INSS do pró-labore
IRRF                    = base do IRRF × alíquota da faixa − parcela a deduzir
                          (mesma tabela do IRPF)
encargos                = tributos + honorários PJ + INSS + IRRF
resultado líquido       = receita − custos − encargos
```

---

## ✅ Corrigido na v2.3.0 — o Simples Nacional real

Até a v2.2.0 o cenário CNPJ usava **uma alíquota efetiva única de 11%**
no lugar das tabelas do Simples. A revisão contábil de agosto/2026
confirmou que isso não era impreciso — era **errado por construção**:

> "o CNPJ com atividade de cunho intelectual pode transitar entre Anexo V
> e Anexo III; o Fator R define o anexo através da folha salarial"

Agora o caminho normal é: **atividade → anexo(s) possível(is) → Fator R
→ alíquota efetiva sobre a RBT12**. O impacto, num faturamento de
R$ 20 mil com RBT12 de R$ 240 mil:

| Situação | Anexo | Alíquota efetiva | DAS mensal |
| --- | --- | ---: | ---: |
| Como era (11% fixos) | — | 11,00% | R$ 2.200,00 |
| Engenharia, folha 0 | V | 16,13% | R$ 3.225,00 |
| Engenharia, folha em 28% | III | 7,30% | R$ 1.460,00 |
| Contabilidade | III | 6,00% | R$ 1.200,00 |

Entre os dois anexos possíveis da **mesma atividade**, R$ 1.765,00 por
mês. Era exatamente essa diferença que os 11% apagavam.

### O que ainda não está resolvido

- **A alíquota de recurso continua existindo**, e continua errada. Ela só
  entra quando a atividade não é identificada — e, nesse caso, o
  resultado aparece etiquetado como **"Sem enquadramento"**, com o aviso
  de que não representa o Simples Nacional.
- **Anexo IV classificado, não calculado.** A contribuição patronal fica
  fora da guia única e o motor assume que está dentro. Calcular assim
  produziria erro por construção, então o cálculo é bloqueado com o
  motivo na tela.
- **As tabelas não têm aceite do contador.** Foram transcritas da
  LC 123/2006 e conferidas contra duas referências profissionais de 2026,
  e as alíquotas iniciais batem com as que ele informou. Isso é
  conferência, não validação.

---

## ⚠️ A maior simplificação que resta

> **A tabela do IRPF está sabidamente desatualizada e não contempla a
> isenção de R$ 5.000.**

É o bloqueio nº 1 do modelo, e afeta o cenário Pessoa Física e o IRRF
sobre pró-labore ao mesmo tempo. Não preenchemos por conta própria: a
isenção envolve uma zona de transição, e errar o desenho dela distorce
justamente a faixa de renda mais comum entre os clientes.

O percentual de 28% sugerido como pró-labore teve sua origem confirmada:
é exatamente o patamar do Fator R. Isso valida de onde o número veio, mas
**não** o valida como sugestão de pró-labore — essa pergunta segue sem
resposta.

---

## Premissas implícitas na modelagem

Além dos números, o modelo assume estruturalmente:

1. **Receita e custos constantes** todos os meses.
2. **Todos os custos informados são dedutíveis** nos dois cenários — no
   livro-caixa da PF e como despesa da PJ. Na prática, as regras de
   dedutibilidade diferem.
3. **A contribuição patronal (CPP) já está embutida** na alíquota efetiva
   sobre o faturamento.
4. **O sócio é o único** e retira pró-labore + lucro.
5. **Nenhuma retenção na fonte** por parte dos tomadores de serviço —
   confirmado na revisão como irrelevante para o resultado, por ser
   antecipação de pagamento.
6. **Nenhum custo de abertura ou manutenção societária** além dos
   honorários contábeis informados.
7. **Despesas pessoais não entram** — o resultado líquido é anterior a elas.

---

## Onde alterar cada coisa

| Quero mudar… | Arquivo |
| --- | --- |
| Uma alíquota, teto, faixa ou tabela de anexo | `src/features/simulacao/domain/calculation-rules.ts` |
| Acrescentar ou corrigir uma atividade | `src/features/simulacao/domain/catalogo-atividades.ts` |
| A regra que escolhe o anexo | `src/features/simulacao/domain/classificacao.ts` |
| A mecânica do Simples (efetiva, Fator R) | `src/features/simulacao/domain/simples-nacional.ts` |
| A ordem/fórmula de um cenário | `src/features/simulacao/domain/calcular.ts` |
| O texto explicativo do resultado | `src/features/simulacao/domain/explicar.ts` |
| Limites e mensagens de validação | `src/features/simulacao/schemas/simulacao-schema.ts` |

Depois de qualquer alteração, rode `npm run test`. Os testes em
`calcular.test.ts` verificam invariantes (monotonicidade do IRPF, teto do
INSS, coerência entre encargos e líquido) e vão apontar inconsistências.

**Ao revisar as premissas, incremente `VERSAO_REGRAS`** (`v1-mvp-2026-08`
→ `v1.1-2026-08` na revisão de agosto/2026 → `v1.2-2026-08` com a
entrada das tabelas do Simples e do Fator R). Ela
é gravada junto de cada simulação salva e de cada feedback enviado, para
sabermos com qual modelo aquele número foi produzido.
