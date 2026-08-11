# Pendências — segunda rodada com o contador

**Contexto:** a primeira revisão (agosto/2026) respondeu **9 de 30**
perguntas. As respostas aplicadas estão em
[`PREMISSAS_DE_CALCULO.md`](PREMISSAS_DE_CALCULO.md). Este documento
concentra o que ficou em aberto, priorizado.

Duas das respostas recebidas apontaram erros no modelo mas **não vieram
com os números** necessários para corrigi-los. Esses dois pedidos vêm
primeiro, e são os únicos que travam o produto.

---

## 🔴 Os dois bloqueios

Sem estes dois itens, o simulador continua produzindo números que sabemos
estar errados. Tudo o mais é refinamento.

### Bloqueio 1 — A tabela do IRPF com a isenção de R$ 5.000

Você respondeu: *"Precisamos fazer atualização também. Incluindo a isenção
dos R$ 5.000,00."*

Concordamos, mas não preenchemos por conta própria. A isenção não é só uma
faixa nova: existe uma zona de transição em que o benefício é reduzido
gradualmente, e errar o desenho dela distorce justamente a faixa de renda
mais comum entre os clientes.

**Preencha esta tabela, por favor:**

| Base mensal até | Alíquota | Parcela a deduzir |
| --- | ---: | ---: |
| R$ ______ | ____% | R$ ______ |
| R$ ______ | ____% | R$ ______ |
| R$ ______ | ____% | R$ ______ |
| R$ ______ | ____% | R$ ______ |
| acima | ____% | R$ ______ |

**E responda:**

1. A isenção até R$ 5.000 entra como faixa de 0% na tabela acima, ou é um
   **redutor aplicado depois** do cálculo normal?
2. Se for redutor: qual a fórmula e em que intervalo ele decresce?
3. Ela vale para o **carnê-leão mensal** do autônomo, ou só no ajuste anual?
4. Vale igualmente para o **IRRF sobre pró-labore**? Hoje usamos a mesma
   tabela nos dois lugares.

> Para referência, a tabela que está no ar hoje — e que você indicou estar
> desatualizada: 0% até 2.259,20 · 7,5% até 2.826,65 (deduz 169,44) · 15%
> até 3.751,05 (deduz 381,44) · 22,5% até 4.664,68 (deduz 662,77) · 27,5%
> acima (deduz 896,00).

---

### Bloqueio 2 — As tabelas do Simples por anexo

Você explicou o Fator R e listou as alíquotas iniciais de cada anexo. Isso
já nos permitiu documentar **por que** os 11% fixos de hoje estão errados,
mas não é suficiente para calcular.

As alíquotas iniciais que você deu valem para a primeira faixa do RBT12
(até R$ 180 mil/ano). Acima disso, a alíquota efetiva sobe — e sem a
parcela a deduzir de cada faixa, subestimaríamos o imposto de todo cliente
com faturamento acima de R$ 15 mil/mês.

**Precisamos das tabelas completas dos anexos III e V** (os dois que
importam para prestador de serviço):

| Faixa de RBT12 | Alíquota nominal | Parcela a deduzir |
| --- | ---: | ---: |
| até R$ 180.000 | ____% | R$ ______ |
| de R$ 180.000,01 a R$ 360.000 | ____% | R$ ______ |
| de R$ 360.000,01 a R$ 720.000 | ____% | R$ ______ |
| de R$ 720.000,01 a R$ 1.800.000 | ____% | R$ ______ |
| de R$ 1.800.000,01 a R$ 3.600.000 | ____% | R$ ______ |
| de R$ 3.600.000,01 a R$ 4.800.000 | ____% | R$ ______ |

**E responda:**

5. Como o usuário informa a atividade? Uma pergunta do tipo *"a atividade
   exige diploma para ser exercida?"* separa III de V com precisão
   suficiente, ou precisamos de uma lista de CNAEs?
6. **Fator R:** a folha entra como pró-labore + encargos, ou só o
   pró-labore? Considera os últimos 12 meses?
7. No primeiro ano de empresa, sem RBT12 de 12 meses, o que usar?
8. Vale começar só com III e V, deixando I, II e IV para depois? Nosso
   público é prestador de serviço.

---

## 🟡 Alto impacto — mudam o resultado

### Cenário CNPJ

9. **INSS sobre pró-labore (11%).** Assumimos que a contribuição patronal
   (CPP) está embutida na alíquota do DAS. Isso procede para o Anexo III?
   E para o Anexo IV, onde você mencionou que o INSS patronal fica fora da
   guia única?
10. **Lucro distribuído isento.** Em que condições deixa de valer?
    Precisamos alertar sobre limite de distribuição sem escrituração
    contábil regular?
11. **Pró-labore sugerido.** Hoje sugerimos 28% da receita, que é o
    patamar do Fator R. Faz sentido como padrão, ou o padrão deveria ser
    outro (um salário mínimo, por exemplo) e o Fator R virar uma
    simulação à parte?
12. **Custos de ter empresa.** Além de honorários contábeis, o que
    estamos esquecendo? Taxas municipais, alvará, certificado digital,
    honorário extra de fechamento anual?
13. **R$ 300/mês de contabilidade** é referência razoável? Varia muito
    por região ou porte?

### Cenário Pessoa Física

14. **Custos dedutíveis no livro-caixa.** Assumimos que tudo o que o
    usuário informa é dedutível. O que normalmente **não** entra? Vale
    quebrar o campo em categorias?
15. **Dependentes, despesas médicas e educação.** Qual tem mais impacto
    prático e valeria incluir primeiro?
16. **Ajuste anual do IRPF.** Só calculamos o carnê-leão mensal. Isso
    distorce a comparação com o CNPJ?
17. **ISS municipal do autônomo.** Deveria entrar? Como lidar com a
    variação entre municípios sem pedir o CEP?

---

## 🟢 Produto — moldam a próxima versão

18. **MEI como terceiro cenário.** Você disse que nem todo profissional
    pode ser MEI e que a triagem inicial olha faturamento e atividade.
    Vale colocá-lo como terceiro cenário, ou basta um alerta do tipo
    *"esta atividade não permite MEI"*?
19. **O resultado principal.** Você disse que o mais útil é *"o valor a
    ser economizado — custo anual de X na PF e custo anual de Y na PJ"*.
    Hoje mostramos "quanto sobra por mês". Confirma que devemos inverter
    o destaque para **custo anual comparado** e economia?
20. **Perguntas na triagem.** O que você pergunta a um cliente antes de
    recomendar PF ou PJ, além de receita, custos e pró-labore?
21. Existe alguma pergunta que, **sozinha**, elimina cenários?
22. Algum campo atual é **desnecessário** ou confunde?
23. **Terminologia.** Estão certos: "receita bruta mensal", "custos do
    negócio", "resultado líquido", "encargos estimados"? Ou você usaria
    outros termos com um cliente?
24. **Intervalo em vez de valor exato.** "Entre R$ 6.200 e R$ 6.900"
    comunicaria melhor a incerteza do modelo?
25. **Próximo simulador.** Precificação de hora? Reserva mensal para
    impostos? Ponto de equilíbrio? Pró-labore ideal?
26. **Ferramenta de trabalho.** Para você usar com clientes, o que
    precisaria existir — relatório em PDF? histórico por cliente? um
    espaço para você mesmo ajustar as alíquotas?
27. **Risco de publicar.** Você disse que o aviso atual basta porque a
    venda inicial seria entre contadores. Se isso mudar e chegar ao
    cliente final, o que precisa mudar antes?

---

## O que já foi resolvido

Registrado para não perguntarmos de novo.

| Tema | Decisão |
| --- | --- |
| Comparação PF × PJ é a triagem certa | ✅ Confirmado |
| INSS do autônomo: 20% | ✅ Confirmado como regra geral |
| INSS piso e teto | ✅ Atualizados para R$ 1.621,00 e R$ 8.475,55 |
| Retenção de 11% pelo tomador PJ | ✅ Ignorar — é antecipação, não muda o resultado |
| Aviso legal atual | ✅ Suficiente para venda entre contadores |
| Origem dos 28% de pró-labore | ✅ É o patamar do Fator R |

---

## Como responder

O mais prático é preencher direto neste arquivo, ou responder por número.
As duas tabelas dos bloqueios são o que realmente destrava o produto — se
o tempo for curto, só elas já valem a conversa.
