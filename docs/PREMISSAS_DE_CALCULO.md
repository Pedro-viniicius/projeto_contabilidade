# Premissas de cálculo — Clareza

**Versão das regras:** `v1.1-2026-08`
**Arquivo-fonte:** `src/features/simulacao/domain/calculation-rules.ts`
**Última revisão contábil:** agosto de 2026 (parcial — 9 de 30 pontos respondidos)

> **Leia isto primeiro.** Uma primeira revisão contábil aconteceu em
> agosto de 2026 e validou **3 das 10 premissas**. As demais seguem sem
> validação, e duas delas foram confirmadas como **erradas** — estão
> marcadas com ⚠️ abaixo. Pendências em
> [`PENDENCIAS_CONTADOR.md`](PENDENCIAS_CONTADOR.md).
>
> Nas premissas ainda não validadas, os valores foram escolhidos para que
> a simulação seja **compreensível e fácil de corrigir**, não para produzir
> precisão fiscal. Cada linha desta página é um ponto de decisão para a
> próxima rodada de revisão.

---

## Como o sistema está organizado

Todo número de natureza tributária vive em **um único arquivo**
(`calculation-rules.ts`). Nenhum componente de interface contém alíquota,
teto ou faixa. Para mudar o comportamento do simulador, altera-se aquele
arquivo — e só ele.

Cada premissa carrega, junto do valor, três metadados que aparecem na
interface do produto (tela `/premissas` e seção "Como chegamos a esse
resultado?"):

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
| Alíquota efetiva sobre o faturamento | 11% | Tributos da empresa | ⚠️ Incorreta |
| Custo contábil mensal | R$ 300,00/mês (editável) | Honorários e obrigações acessórias | A validar |
| INSS sobre pró-labore | 11% | Retenção do sócio | A validar |
| Pró-labore sugerido | 28% do faturamento | Valor inicial do formulário | Hipótese temporária |
| Lucro distribuído | Tratado como isento | Resultado após pró-labore | A validar |

**Ordem do cálculo:**

```
tributos do faturamento = receita × 11%
INSS do pró-labore      = min(pró-labore, teto do INSS) × 11%
base do IRRF            = pró-labore − INSS do pró-labore
IRRF                    = base do IRRF × alíquota da faixa − parcela a deduzir
                          (mesma tabela do IRPF)
encargos                = tributos + contabilidade + INSS + IRRF
resultado líquido       = receita − custos − encargos
```

---

## ⚠️ A maior simplificação desta versão

> **O cenário CNPJ usa uma alíquota efetiva única de 11% sobre o
> faturamento no lugar das tabelas do Simples Nacional.**

A revisão contábil de agosto/2026 confirmou que isto não é apenas
impreciso — **é errado por construção**:

> "o CNPJ com atividade de cunho intelectual pode transitar entre Anexo V
> e Anexo III; o Fator R define o anexo através da folha salarial"

Anexos e alíquotas iniciais informados na revisão:

| Anexo | Natureza | Alíquota inicial |
| --- | --- | ---: |
| I | Comércio | 4% |
| II | Indústria | 4,5% |
| III | Serviços gerais | 6% |
| IV | Serviços com encargos (CPP fora do DAS) | 4,5% |
| V | Serviços intelectuais | 15,5% |

O **Fator R** faz a empresa do Anexo V migrar para o III quando a folha
atinge 28% do faturamento. Para um prestador intelectual, a diferença
entre 15,5% e 6% é de **9,5 pontos percentuais** — que a alíquota única de
11% apaga completamente.

**O que falta para corrigir:** as tabelas completas de cada anexo (alíquota
nominal e parcela a deduzir por faixa) e o cálculo do RBT12. As alíquotas
iniciais acima valem apenas para a primeira faixa (RBT12 até R$ 180 mil);
acima disso, subestimam.

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
| Uma alíquota, teto ou faixa | `src/features/simulacao/domain/calculation-rules.ts` |
| A ordem/fórmula de um cenário | `src/features/simulacao/domain/calcular.ts` |
| O texto explicativo do resultado | `src/features/simulacao/domain/explicar.ts` |
| Limites e mensagens de validação | `src/features/simulacao/schemas/simulacao-schema.ts` |

Depois de qualquer alteração, rode `npm run test`. Os testes em
`calcular.test.ts` verificam invariantes (monotonicidade do IRPF, teto do
INSS, coerência entre encargos e líquido) e vão apontar inconsistências.

**Ao revisar as premissas, incremente `VERSAO_REGRAS`** (a revisão de
agosto/2026 levou de `v1-mvp-2026-08` para `v1.1-2026-08`). Ela
é gravada junto de cada simulação salva e de cada feedback enviado, para
sabermos com qual modelo aquele número foi produzido.
