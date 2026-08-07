# Premissas de cálculo — Clareza V1

**Versão das regras:** `v1-mvp-2026-08`
**Arquivo-fonte:** `src/features/simulacao/domain/calculation-rules.ts`
**Data:** agosto de 2026

> **Leia isto primeiro.** Nenhuma premissa deste documento foi validada por
> um contador. Os valores foram escolhidos para que a simulação seja
> **compreensível e fácil de corrigir**, não para produzir precisão fiscal.
> Este documento existe exatamente para tornar a revisão profissional
> simples: cada linha é um ponto de decisão.

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
| Validada tecnicamente | Revisada e aprovada. **Nenhuma premissa está neste estado no V1.** |
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
| INSS — alíquota | 20% | Cálculo do INSS do contribuinte individual | A validar |
| INSS — teto de contribuição | R$ 8.157,41/mês | Limite superior do salário de contribuição | Hipótese temporária |
| INSS — piso de contribuição | R$ 1.518,00/mês | Limite inferior do salário de contribuição | Hipótese temporária |
| IRPF — tabela progressiva mensal | 5 faixas, de 0% a 27,5% | Imposto de renda sobre a base do carnê-leão | Hipótese temporária |

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

**O que fica de fora:** plano simplificado de INSS (11%), retenção de 11%
quando o tomador é pessoa jurídica, dependentes, despesas médicas e de
educação, desconto simplificado, ajuste anual, ISS municipal.

---

### Cenário CNPJ / Prestador de serviço

| Regra | Valor/Premissa | Onde é usada | Status |
| --- | --- | --- | --- |
| Alíquota efetiva sobre o faturamento | 11% | Tributos da empresa | Hipótese temporária |
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

Não calculamos RBT12, Fator R, troca de anexo, partilha entre tributos,
sublimites nem ISS por município.

Esta foi uma decisão consciente de produto: preferimos um número
**compreensível e explicitamente aproximado** a uma precisão inventada que
o usuário não teria como auditar. É o **primeiro item** que precisa da sua
revisão.

O percentual de 28% sugerido como pró-labore é apenas um valor inicial de
formulário, inspirado no patamar associado ao Fator R — mas **o Fator R
não é calculado** em lugar nenhum do sistema.

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
5. **Nenhuma retenção na fonte** por parte dos tomadores de serviço.
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

**Ao revisar as premissas, lembre-se de incrementar `VERSAO_REGRAS`** — ela
é gravada junto de cada simulação salva e de cada feedback enviado, para
sabermos com qual modelo aquele número foi produzido.
