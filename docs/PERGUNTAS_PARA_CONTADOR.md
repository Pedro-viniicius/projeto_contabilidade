# Perguntas para o contador — roteiro de validação do Clareza V1

Este documento é o roteiro da conversa. Ele foi escrito **durante** a
implementação: cada pergunta nasceu de uma decisão que precisou ser tomada
sem respaldo profissional.

Sugestão de uso: peça para ele fazer uma análise na área de trabalho
primeiro, depois abrir o painel **Premissas do modelo** — ou clicar em
qualquer linha da composição dos encargos, que mostra a premissa por trás
do número ali mesmo — e só então percorrer as perguntas abaixo. O produto
foi construído para ser auditável sem ler código e sem trocar de tela.

---

## 🔴 Bloco 1 — As perguntas que mais importam

Se o tempo for curto, faça só estas cinco.

1. **A comparação PF × CNPJ é a comparação certa para começar?**
   Ou existe uma dúvida mais frequente e mais útil na cabeça do cliente
   (por exemplo, "vale a pena virar MEI?", "quanto preciso cobrar por hora?",
   "quanto separar por mês para impostos?").

2. **Substituímos as tabelas do Simples Nacional por uma alíquota efetiva
   única de 11% sobre o faturamento. Isso é aceitável para um MVP?**
   Se sim, qual percentual você usaria como padrão? Se não, qual é o
   mínimo que precisa ser implementado para o número parar de ser
   enganoso — RBT12? Fator R? escolha de anexo pelo usuário?

3. **O que está faltando que torna o resultado errado, não apenas
   impreciso?** Ou seja: existe algo hoje no cálculo que levaria alguém a
   uma decisão ruim?

4. **Quais avisos legais ou de conselho profissional precisam aparecer?**
   O aviso atual é: *"Esta simulação possui caráter informativo e utiliza
   premissas simplificadas. Consulte um contador para decisões fiscais ou
   tributárias."* É suficiente? Há restrição do CFC sobre esse tipo de
   ferramenta?

5. **Que resultado seria realmente útil para um cliente seu?** O número
   que mostramos ("quanto sobra por mês") é o número que ele quer, ou o
   que ele realmente pergunta é outro?

---

## Bloco 2 — Cenário Pessoa Física

6. Usamos **20% de INSS** (plano completo) sobre o salário de contribuição.
   Deveríamos oferecer também o plano simplificado (11%)? Qual é o padrão
   mais comum entre autônomos?

7. Quando o autônomo presta serviço **para empresa**, há retenção de 11%
   pelo tomador. Isso muda materialmente o resultado? Vale perguntar ao
   usuário se os clientes dele são PF ou PJ?

8. Assumimos que **todos os custos informados são dedutíveis** no
   livro-caixa. Quais despesas normalmente **não** entram? Vale quebrar o
   campo "custos" em categorias?

9. Não tratamos **dependentes, despesas médicas nem educação**. Qual delas
   tem mais impacto prático e valeria a pena incluir primeiro?

10. Ignoramos o **ajuste anual do IRPF** — só calculamos o carnê-leão
    mensal. Isso distorce a comparação com o cenário CNPJ?

11. E o **ISS municipal** para o autônomo? Ele deveria entrar? Como
    lidamos com a variação entre municípios sem pedir o CEP?

12. Os valores de **teto (R$ 8.157,41) e piso (R$ 1.518,00)** do INSS
    estão corretos para o período atual? Com que frequência precisamos
    atualizá-los, e existe fonte confiável para automatizar isso?

13. A **tabela progressiva do IRPF** que usamos está atualizada? (Ver
    `docs/PREMISSAS_DE_CALCULO.md` para as faixas exatas.)

---

## Bloco 3 — Cenário CNPJ

14. **Qual anexo do Simples** se aplica ao prestador de serviço típico do
    nosso público? Vale perguntar a atividade ao usuário, ou dá para
    inferir por uma pergunta mais simples?

15. **Como tratar o Fator R** de forma compreensível? Ele muda o resultado
    o suficiente para justificar a complexidade no V2?

16. Assumimos que o **lucro distribuído é isento**. Em que condições isso
    deixa de valer? Precisamos alertar sobre limites de distribuição sem
    escrituração contábil?

17. Aplicamos **11% de INSS sobre o pró-labore** e assumimos que a
    contribuição patronal (CPP) está embutida na alíquota efetiva. Isso
    procede?

18. **Qual pró-labore sugerir por padrão?** Hoje sugerimos 28% do
    faturamento. Faz sentido? Existe um padrão melhor?

19. **R$ 300/mês de contabilidade** é uma referência razoável? Varia muito
    por região ou porte?

20. Que **custos de ter empresa** estamos esquecendo? (Taxas municipais,
    alvará, certificado digital, contador extra no fechamento anual…)

21. Deveríamos considerar **MEI** como um terceiro cenário? Ele resolveria
    a dúvida de boa parte do público, ou o limite de faturamento o torna
    irrelevante para quem usaria a ferramenta?

---

## Bloco 4 — Perguntas ao usuário

22. **Que perguntas você faz a um cliente antes de recomendar PF ou PJ?**
    Hoje perguntamos só quatro coisas (perfil, receita, custos, pró-labore
    + contabilidade). O que falta perguntar?

23. Existe alguma pergunta que, **sozinha**, elimina cenários? (Ex.: "seus
    clientes exigem nota fiscal de CNPJ?")

24. Algum dos campos atuais é **desnecessário** ou confunde mais do que
    ajuda?

25. Os termos que usamos são os certos? Especificamente:
    - "receita mensal" vs. "faturamento";
    - "custos do negócio" vs. "despesas";
    - "resultado líquido" vs. "quanto sobra";
    - "encargos estimados" vs. "impostos".

---

## Bloco 5 — Escopo, produto e próximos passos

26. **Quais simplificações do MVP são aceitáveis** para colocar na mão de
    um usuário real, e quais precisam ser corrigidas antes disso?

27. Precisamos de um **intervalo em vez de um número exato**? Ex.:
    "entre R$ 6.200 e R$ 6.900" comunicaria melhor a incerteza?

28. Qual seria o **próximo simulador** mais útil depois deste?
    (Precificação de hora? Reserva mensal para impostos? Ponto de
    equilíbrio? Pró-labore ideal?)

29. Se um contador usasse isso com clientes, **o que precisaria existir**
    para virar ferramenta de trabalho — relatório em PDF? histórico?
    espaço para ele ajustar as alíquotas?

30. Existe **risco** em publicar esta versão como está? O que mudaria para
    reduzi-lo?

---

## Como registrar o feedback dele

O app tem um painel **Registrar observação**, aberto pela coluna de
contexto sem sair da análise, com categorias já pensadas para esta
conversa (cálculo incorreto, premissa contábil errada, termo confuso,
campo faltando, etc.). Cada registro guarda junto a análise que estava
aberta e a versão das regras vigente. O feedback fica salvo no aparelho e
pode ser **exportado em JSON** pelo botão do próprio painel — assim nada
se perde entre a conversa e a próxima iteração.
