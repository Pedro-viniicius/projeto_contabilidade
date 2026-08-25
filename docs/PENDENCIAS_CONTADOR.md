# Pendências — segunda rodada com o contador

**Contexto:** a primeira revisão (agosto/2026) respondeu **9 de 30**
perguntas; a segunda rodada trouxe o pedido de fluxo por atividade,
preenchimento simultâneo de PF e PJ e honorários contábeis separados —
os três **implementados** na v2.3.0. As respostas aplicadas estão em
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

### Bloqueio 2 — As tabelas do Simples por anexo · **IMPLEMENTADO, FALTA ACEITE**

Você explicou o Fator R e listou as alíquotas iniciais de cada anexo.
Com isso, transcrevemos as **tabelas completas dos cinco anexos** da
LC 123/2006 (redação da LC 155/2016) e conferimos contra duas
referências profissionais de 2026. As alíquotas iniciais que você
informou batem com a primeira faixa de cada tabela.

O simulador **deixou de usar a alíquota fixa de 11%** no caminho normal.
Agora ele identifica a atividade, apura o Fator R e aplica a alíquota
efetiva real. O impacto, num faturamento de R$ 20 mil com RBT12 de
R$ 240 mil:

| Situação | Anexo | Alíquota efetiva | DAS mensal |
| --- | --- | ---: | ---: |
| Como era (11% fixos) | — | 11,00% | R$ 2.200,00 |
| Engenharia, folha 0 | V | 16,13% | R$ 3.225,00 |
| Engenharia, folha em 28% | III | 7,30% | R$ 1.460,00 |
| Contabilidade | III | 6,00% | R$ 1.200,00 |

Era exatamente o que você apontou: os 11% escondiam uma diferença de
**R$ 1.765,00 por mês** entre os dois anexos possíveis da mesma
atividade.

**O que ainda precisamos de você:**

1. **Confere a transcrição?** Estão em
   `docs/CLASSIFICACAO_ATIVIDADES.md` e no painel *Premissas do
   modelo*. Enquanto não houver seu aceite, elas seguem marcadas como
   "a validar" — não como validadas.
2. **A composição da folha do Fator R está certa?** Usamos: salários +
   contribuição patronal + FGTS + pró-labore, dos últimos 12 meses,
   em um campo único. Quebrar em parcelas ajudaria ou atrapalharia na
   triagem?
3. **Primeiro ano de empresa.** ✅ **Respondido pela sua planilha.** Ela
   proporcionaliza: `soma dos meses ÷ meses de atividade × 12`. Está
   implementado. Só confirme se o simulador deve **perguntar** os meses
   de atividade ou se dá para inferir de outra forma.
4. **Anexo IV.** Classificamos advocacia, construção civil, limpeza e
   vigilância corretamente, mas **bloqueamos o cálculo**: a CPP fica
   fora do DAS e o motor assume que ela está dentro. Vale implementar a
   CPP de 20% sobre a folha como encargo à parte, ou o Anexo IV fica
   fora do escopo por enquanto?
5. **CPP nos Anexos III e V.** Assumimos que a contribuição patronal
   está embutida no DAS. Procede para os dois?
6. **Teto do ISS.** Sua planilha trava o ISS em 5 pontos com um limiar
   fixo por anexo (14,92537 no III e V, 12,5 no IV). Implementamos a
   regra derivada da repartição da faixa, que dá o mesmo resultado.
   Confirma que é isso mesmo?
7. **Substituição tributária e ISS retido.** As colunas S e U da sua
   planilha ficaram de fora: dependem de saber se o tomador retém.
   Vale perguntar isso na triagem?
8. **O catálogo de atividades.** São 22 atividades de prestação de
   serviço. Quais faltam para cobrir o seu dia a dia? A lista está em
   `docs/CLASSIFICACAO_ATIVIDADES.md`.

---

## 🟡 Alto impacto — mudam o resultado

### Cenário CNPJ

9. **INSS sobre pró-labore (11%).** Assumimos que a contribuição patronal
   (CPP) está embutida na alíquota do DAS. Isso procede para o Anexo III?
   E para o V? *(O Anexo IV já está bloqueado no cálculo justamente por
   isso — ver Bloqueio 2, item 4.)*
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
13. **R$ 300/mês de contabilidade** é referência razoável para a
    **empresa**? Varia muito por região e porte?
14. **E para o autônomo?** Os honorários de PF e PJ agora são campos
    independentes, como você pediu. O da PF começa em **zero**, porque
    não recebemos referência — preferimos não inventar um número que
    inclinaria a comparação em silêncio. Qual valor você usaria como
    ponto de partida?

### Cenário Pessoa Física

15. **Custos dedutíveis no livro-caixa.** Assumimos que tudo o que o
    usuário informa é dedutível. O que normalmente **não** entra? Vale
    quebrar o campo em categorias?
16. **Dependentes, despesas médicas e educação.** Qual tem mais impacto
    prático e valeria incluir primeiro?
17. **Ajuste anual do IRPF.** Só calculamos o carnê-leão mensal. Isso
    distorce a comparação com o CNPJ?
18. **ISS municipal do autônomo.** Deveria entrar? Como lidar com a
    variação entre municípios sem pedir o CEP?

---

## 🟢 Produto — moldam a próxima versão

19. **MEI como terceiro cenário.** Você disse que nem todo profissional
    pode ser MEI e que a triagem inicial olha faturamento e atividade.
    Vale colocá-lo como terceiro cenário, ou basta um alerta do tipo
    *"esta atividade não permite MEI"*?
20. **O resultado principal.** Você disse que o mais útil é *"o valor a
    ser economizado — custo anual de X na PF e custo anual de Y na PJ"*.
    Hoje mostramos "quanto sobra por mês". Confirma que devemos inverter
    o destaque para **custo anual comparado** e economia?
21. **Perguntas na triagem.** O que você pergunta a um cliente antes de
    recomendar PF ou PJ, além de receita, custos e pró-labore?
22. Existe alguma pergunta que, **sozinha**, elimina cenários?
23. Algum campo atual é **desnecessário** ou confunde?
24. **Terminologia.** Estão certos: "receita bruta mensal", "custos do
    negócio", "resultado líquido", "encargos estimados"? Ou você usaria
    outros termos com um cliente?
25. **Intervalo em vez de valor exato.** "Entre R$ 6.200 e R$ 6.900"
    comunicaria melhor a incerteza do modelo?
26. **Próximo simulador.** Precificação de hora? Reserva mensal para
    impostos? Ponto de equilíbrio? Pró-labore ideal?
27. **Ferramenta de trabalho.** Para você usar com clientes, o que
    precisaria existir — relatório em PDF? histórico por cliente? um
    espaço para você mesmo ajustar as alíquotas?
28. **Risco de publicar.** Você disse que o aviso atual basta porque a
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
| Fluxo começa pela atividade | ✅ Implementado — atividade → anexo → dados |
| PF e PJ preenchidos juntos | ✅ Implementado — colunas lado a lado a partir de 1280px |
| Honorários contábeis separados | ✅ Implementado — campos independentes, sem relação fixa entre eles |
| Tabelas dos anexos I a V | ✅ Transcritas e em uso — falta seu aceite |
| Fator R decide III × V | ✅ Implementado, com limite inclusivo em 28% |
| Apuração conferida contra a planilha | ✅ Valores em cache reproduzidos com igualdade exata |
| Proporcionalização da RBT12 | ✅ Implementada, vinda da planilha |
| Teto do ISS em 5 pontos | ✅ Implementado — redistribui, não desconta |

---

## Como responder

O mais prático é preencher direto neste arquivo, ou responder por número.
As duas tabelas dos bloqueios são o que realmente destrava o produto — se
o tempo for curto, só elas já valem a conversa.
