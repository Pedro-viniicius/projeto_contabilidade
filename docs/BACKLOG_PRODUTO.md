# Backlog de produto — Clareza

Este documento separa o que **existe** do que é **hipótese**. Nada abaixo
da primeira seção deve ser implementado sem uma razão concreta —
preferencialmente vinda do feedback do contador ou de um usuário real.

---

## V1 entregue

Funcionalidades que estão no ar e foram testadas.

### Experiência
- [x] Landing mobile-first com proposta de valor e um único caminho de
      conversão dominante
- [x] Simulação guiada em 4 passos (perfil → receita → custos → cenário CNPJ)
- [x] Campos de moeda com máscara pt-BR e teclado numérico no celular
- [x] Validação por passo com mensagens em português
- [x] Tela de resultado com hierarquia clara: número herói, decomposição,
      composição visual do faturamento
- [x] Explicação em linguagem de negócio ("O que isso significa?"),
      gerada por regras determinísticas — sem IA
- [x] Comparativo Pessoa Física × CNPJ com diferença mensal e anual
- [x] Transparência total do cálculo ("Como chegamos a esse resultado?"):
      valores informados, passo a passo, encargos e premissas
- [x] Página pública de premissas (`/premissas`) com status de validação
- [x] Página "Como funciona", incluindo o que a simulação **não** calcula
- [x] Tela de feedback com categorias e exportação em JSON
- [x] Retomar a última simulação a partir da home
- [x] Editar e recalcular sem perder os dados
- [x] Estados vazios e página 404

### Técnico
- [x] Motor de cálculo puro, isolado de React, com 67 testes
- [x] Todas as premissas centralizadas em um único arquivo auditável
- [x] Persistência local (localStorage) com revalidação por schema na leitura
- [x] PWA: manifest, ícones, service worker, casca offline, fallback
- [x] Botão de instalação discreto (só aparece quando o navegador permite)
- [x] Abstração de analytics sem plataforma externa acoplada
- [x] SEO técnico: metadata, Open Graph, robots, sitemap
- [x] Acessibilidade: HTML semântico, foco visível, `aria-live`, alvos de
      toque de 44px, erros que não dependem de cor
- [x] Modo claro e escuro

---

## Melhorias após feedback do contador

Itens que **provavelmente** virão da revisão. Priorizar apenas o que ele
apontar.

### Alta prioridade esperada
- [ ] Corrigir a alíquota efetiva do cenário CNPJ (hoje 11% fixo)
- [ ] Confirmar/atualizar teto e piso do INSS e a tabela do IRPF
- [ ] Ajustar o tratamento do INSS na PF (plano completo × simplificado,
      retenção pelo tomador)
- [ ] Revisar termos e rótulos que se mostrarem confusos
- [ ] Ajustar o aviso legal conforme orientação profissional

### Provável
- [ ] Perguntar a atividade do usuário para escolher o anexo correto
- [ ] Implementar Fator R, se ele julgar essencial
- [ ] Quebrar "custos" em categorias com regras de dedutibilidade distintas
- [ ] Considerar exibir intervalo em vez de valor exato
- [ ] Incluir MEI como terceiro cenário
- [ ] Perguntar se os clientes do usuário são PF ou PJ (retenção)

---

## V2 possível

Só depois que a lógica contábil estiver validada.

- [ ] Tabelas reais do Simples Nacional com RBT12
- [ ] Escolha de regime: Simples, Lucro Presumido, MEI
- [ ] ISS por município
- [ ] Dependentes e deduções do IRPF
- [ ] Histórico de simulações com nomes ("cenário atual", "se eu aumentar
      o preço")
- [ ] Relatório em PDF para levar ao contador
- [ ] Segundo simulador: quanto separar por mês para impostos
- [ ] Terceiro simulador: precificação de hora / ponto de equilíbrio
- [ ] Sazonalidade e projeção anual com meses variáveis
- [ ] Persistência em servidor + envio real do feedback para API

---

## Ideias futuras

Registradas para não se perderem. **Nenhuma justifica trabalho hoje.**

- [ ] Autenticação e conta de usuário
- [ ] Histórico em nuvem, sincronizado entre aparelhos
- [ ] Painel para o contador acompanhar clientes
- [ ] Compartilhar simulação por link
- [ ] Explicações geradas por IA (só depois da lógica validada — hoje as
      explicações determinísticas são mais confiáveis e custam zero)
- [ ] Diagnóstico financeiro do negócio
- [ ] Acompanhamento recorrente de receitas e despesas
- [ ] Integração bancária / open finance
- [ ] Alertas de vencimento de obrigações
- [ ] Colaboração contador ↔ cliente dentro do produto
- [ ] Páginas de conteúdo/SEO por dúvida específica
- [ ] Modelo de negócio: gratuito com limite, assinatura, ou white-label
      para escritórios contábeis

---

## Decisões conscientes de "não fazer" no V1

Registradas para não serem revisitadas sem motivo novo.

| Decisão | Motivo |
| --- | --- |
| Sem backend | Nada no V1 exige servidor. Adicionar um seria custo sem função. |
| Sem autenticação | Pedir cadastro antes de entregar valor derruba a conversão e não é necessário. |
| Sem IA | Explicações determinísticas são previsíveis, testáveis e gratuitas. IA sobre lógica não validada só amplificaria o erro. |
| Sem biblioteca de gráficos | Uma barra empilhada em CSS responde à pergunta do usuário sem 50 kB de JavaScript. |
| Sem shadcn/ui | Precisávamos de 5 componentes. Escrevê-los custou menos que a configuração e o acoplamento. |
| Sem react-hook-form | O formulário tem 5 campos em 4 passos. Estado local + Zod resolve com menos peças. |
| Sem IndexedDB | Guardamos poucos objetos pequenos. localStorage é síncrono e suficiente. |
| Tabelas do Simples não implementadas | Implementá-las mal seria pior que assumir a simplificação abertamente. |
