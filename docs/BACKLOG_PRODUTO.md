# Backlog de produto — Clareza

Este documento separa o que **existe** do que é **hipótese**. Nada abaixo
da primeira seção deve ser implementado sem uma razão concreta —
preferencialmente vinda do feedback do contador ou de um usuário real.

---

## V1 entregue — simulador para usuário final

> Preservada na tag `v1.0.0`. Substituída pela V2.

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

## V2 entregue — workspace profissional para contadores

Reposicionamento da interface. O motor de cálculo não mudou.

- [x] Shell profissional com navegação lateral persistente
- [x] Visão geral com nova simulação a uma interação
- [x] Formulário único agrupado, no lugar do wizard de 4 passos
- [x] Formulário e resultado na mesma tela a partir de 960px
- [x] Comparação PF × CNPJ em tabela, com coluna de diferença
- [x] Composição dos encargos com base × alíquota = resultado
- [x] Status de validação de cada premissa ao lado do número
- [x] `/premissas` como painel de auditoria com filtros e contagens
- [x] Indicador de estágio do modelo derivado das premissas reais
- [x] Simulações recentes com referência opcional
- [x] Recálculo sob comando, com aviso de valores alterados
- [x] Atalho Ctrl/Cmd+Enter e foco automático no primeiro campo inválido
- [x] Microcopy revisada para linguagem profissional
- [x] Modo claro e escuro verificados
- [x] 390, 768, 1024 e 1440px sem rolagem horizontal

---

## V2.1 — entregue (tela única e acesso demonstrativo)

Arquitetura de informação. O motor de cálculo não mudou.

- [x] Tela de acesso `/login` — protótipo de interface, sem servidor
- [x] Sessão demonstrativa local, com logout na barra superior
- [x] Área de trabalho única em `/workspace`, em três zonas
- [x] Barra lateral substituída por barra superior compacta
- [x] Premissas, escopo, feedback e contexto em painel lateral
- [x] Linha de encargo expansível: conta + premissa + status no lugar
- [x] Resumo executivo com diferença mensal e impacto anual
- [x] Histórico reabre a análise sem trocar de rota
- [x] Rotas antigas preservadas por redirecionamento, com `?painel=`
- [x] Alternância de tema claro/escuro persistida
- [x] Zero trocas de rota no fluxo profissional depois do acesso

---

## V2.4 — entregue (área de trabalho de duas zonas)

Iteração de UX para uso repetido. **O motor de cálculo não mudou** —
apenas ganhou um campo de metadado (`categoria`) em cada encargo, para
que a composição possa ser casada entre os dois cenários sem depender do
texto do rótulo.

### Layout
- [x] Terceira coluna permanente removida; duas zonas (≈40/60)
- [x] Histórico e auditoria em painel lateral sob demanda
- [x] `+ Nova análise` como ação primária única, na barra superior
- [x] PF × CNPJ divididos por container query, não por media query
- [x] Contexto da análise compacto depois de resolvido, com "Alterar"

### Preenchimento
- [x] Receita e custos agrupados como dados compartilhados
- [x] "Situação atual do cliente" no lugar de "enquadramento atual"
- [x] Ajuda por divulgação progressiva (botão `?`) no lugar de texto fixo
- [x] Sugestões explicam a origem do valor antes de oferecer o clique
- [x] Conferências de entrada que pedem confirmação sem bloquear

### Resultado
- [x] Conclusão em uma frase, condicionada às premissas
- [x] Diferença mensal e anual com sentido explícito
- [x] Estágio de validação colado ao resultado, com atalho para as pendentes
- [x] Coluna de diferença nomeia cenário e direção, sem depender de sinal
- [x] Composição dos encargos PF × CNPJ na mesma tabela, sem abas
- [x] Seção "O que explica a diferença?" derivada do cálculo
- [x] Escolha manual de anexo visível junto do número que produziu

### Histórico
- [x] Busca por referência, atividade ou CNAE
- [x] Duplicar análise sem herdar a identidade do original
- [x] "Salvo neste navegador", com a ausência de sincronização declarada

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

## V3 possível — evolução do modelo de cálculo

Só depois que a lógica contábil estiver validada. Estes itens são de
domínio, não de interface.

- [ ] Tabelas reais do Simples Nacional com RBT12
- [ ] Escolha de regime: Simples, Lucro Presumido, MEI
- [ ] ISS por município
- [ ] Dependentes e deduções do IRPF
- [ ] Relatório em PDF para apresentar ao cliente
- [ ] Comparar mais de dois cenários lado a lado
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

## Decisões conscientes de "não fazer"

Registradas para não serem revisitadas sem motivo novo.

| Decisão | Motivo |
| --- | --- |
| Sem backend | Nada na aplicação exige servidor. Adicionar um seria custo sem função. |
| Sem autenticação | Pedir cadastro antes de entregar valor derruba a conversão e não é necessário. |
| Sem IA | Explicações determinísticas são previsíveis, testáveis e gratuitas. IA sobre lógica não validada só amplificaria o erro. |
| Sem biblioteca de gráficos | A tabela comparativa comunica melhor para quem lê números. |
| Sem cadastro de clientes | A persona é contador, mas o produto é simulador — não ERP. A referência local resolve a organização da sessão. |
| Recálculo sob comando | Números estáveis durante a digitação, e o estado desatualizado fica explícito. |
| Sem shadcn/ui | Poucas primitivas, sob medida para densidade de tabela. Escrevê-las custou menos que configurar e acoplar. |
| Sem react-hook-form | O formulário tem 6 campos numa tela. Estado local + Zod resolve com menos peças. |
| Sem IndexedDB | Guardamos poucos objetos pequenos. localStorage é síncrono e suficiente. |
| Tabelas do Simples não implementadas | Implementá-las mal seria pior que assumir a simplificação abertamente. |
