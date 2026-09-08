# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Versionamento semântico.

---

## [2.8.0] — 2026-09-07

Primeira iteração guiada pela **validação contábil de setembro/2026**
(um respondente, o contador que revisa o modelo). A análise completa,
anonimizada, está em
[`docs/VALIDACAO_CONTABIL_2026.md`](docs/VALIDACAO_CONTABIL_2026.md);
as decisões, em
[`docs/DECISOES_PRODUTO.md`](docs/DECISOES_PRODUTO.md).

**Nenhuma fórmula tributária foi alterada.** Quatro respostas
contrariavam a legislação ou a fonte oficial indicada pelo próprio
respondente e foram registradas como divergência, não aplicadas.

### Alterado

- **O pró-labore deixou de ser preenchido sozinho.** Digitar a receita
  escrevia 28% dela no campo. A validação vetou em uma frase: *"de
  início não devemos jogar os 28% no pró-labore, isso deve ser um
  caminho a parte"*. O motivo é de domínio: os 28% são o patamar do
  FATOR R, e usá-los como valor inicial transforma uma ESTRATÉGIA de
  enquadramento em um dado do cliente — o contador passava a comparar
  um cenário que ninguém decidiu adotar. A sugestão continua visível,
  com a origem escrita e um botão "Aplicar".
- **A economia ANUAL virou o resultado principal.** Perguntado qual
  resultado é mais útil para apresentar ao cliente, o contador
  respondeu "quanto economiza por ano"; a tela destacava a diferença
  mensal. O mensal desceu um degrau na escala tipográfica e o anúncio
  para leitor de tela também passou a liderar pelo ano.
- **Honorários contábeis da Pessoa Física partem de R$ 150,00** (eram
  R$ 0,00). O zero tinha sido escolha consciente de agosto/2026 — sem
  referência profissional, inventar um número inclinaria a comparação
  em silêncio. A validação forneceu a referência, e o zero passou a ser
  a distorção: a PF entrava na comparação sem custo contábil nenhum
  enquanto a empresa entrava com R$ 300,00. `VERSAO_REGRAS` para
  `v1.3-2026-09`.
- **O campo "Custos do negócio" declara a simplificação.** A ajuda
  dizia "custos operacionais dedutíveis", sugerindo um filtro que não
  existe. Agora diz que o modelo trata como dedutível tudo o que for
  informado, e que a validação apontou que isso não vale para toda
  despesa. Quais despesas ficam de fora não foi informado.
- **`inssProLaboreAliquota` promovida a `validada-tecnicamente`**; os
  11% foram confirmados.
- **`fatorRLimite` rebaixada para `a-validar`.** Uma premissa
  contestada não pode continuar anunciada como validada, mesmo que o
  valor tenha sido mantido.

### Documentado — e deliberadamente NÃO implementado

Quatro respostas contrariam a fonte legal. Nenhuma alterou o motor; as
quatro estão registradas dentro das premissas correspondentes, onde o
contador as lê no painel *Premissas do modelo*:

- **isenção do IRPF até R$ 5.000** marcada como "faixa com imposto
  zero" — a Lei 15.270/2025, na página da Receita Federal que o próprio
  respondente indicou, descreve um REDUTOR pós-cálculo:
  R$ 978,62 − (0,133145 × rendimento) entre R$ 5.000,01 e R$ 7.350,00.
  A pergunta que pedia a fórmula ficou em branco. Falta ainda confirmar
  se o redutor alcança o carnê-leão do autônomo e o IRRF sobre
  pró-labore, que são exatamente os dois lugares onde o Clareza usa a
  tabela;
- **limite de 28% do Fator R** respondido como incorreto, sem
  justificativa, contra o art. 18 da LC 123/2006;
- **FGTS fora da folha do Fator R**, contra o art. 18, § 24, que o cita
  nominalmente;
- **CPP fora do DAS nos Anexos III e V** — aceitar mudaria todo o
  cenário CNPJ, e a CPP fora da guia única é justamente o que define o
  Anexo IV.

### Segurança de dados

- **O CSV de respostas não entra no Git** (`.gitignore`): traz o nome do
  respondente. A análise versionada é anonimizada — "Respondente 01 —
  contador".

### Adicionado

- `docs/VALIDACAO_CONTABIL_2026.md` — amostra, limitações, matriz de
  evidências, priorização, pendências tributárias e as 10 perguntas da
  próxima rodada.
- `docs/DECISOES_PRODUTO.md` — registro de decisões com evidência,
  alternativas consideradas e motivo.
- Teste de regressão: o pró-labore precisa continuar em zero por padrão.
- Cache do service worker para `clareza-v2-8-0`.

---

## [2.7.1] — 2026-09-05

Correção da v2.7.0: o padrão claro não alcançava quem já usava o
produto.

### Corrigido

- **Preferência de tema anterior à v2.7 é descartada uma vez.** Trocar
  o padrão para o claro não bastou: em qualquer navegador que já tinha
  `clareza:tema` gravado, a escolha antiga continuava vencendo e a
  área de trabalho seguia abrindo escura — exatamente para as pessoas
  que já usam o Clareza. E esse valor não era confiável como decisão:
  foi produzido pelo modelo anterior, em que o escuro também acontecia
  sozinho por preferência do sistema operacional, então não havia como
  distinguir escolha do contador de herança do computador dele.

  A chave passou a ser versionada (`clareza:tema:2`) e a antiga é
  apagada na primeira carga após a atualização. Todo mundo cai no novo
  padrão uma vez; a escolha feita a partir daqui é respeitada para
  sempre, e quem prefere o escuro clica uma vez.

- **Cache do service worker** para `clareza-v2-7-1`.

---

## [2.7.0] — 2026-09-05

O produto passou a ter um tema PADRÃO, e o caminho de volta para ele
deixou de estar escondido. Nenhuma regra de cálculo foi tocada.

### Alterado

- **O claro é o padrão em qualquer máquina.** Havia um bloco
  `@media (prefers-color-scheme: dark)` que pintava a aplicação inteira
  de escuro para quem tivesse o sistema operacional em escuro, sem que
  nada tivesse sido escolhido dentro do produto — o Clareza mudava de
  aparência conforme o computador de quem abrisse. O bloco saiu. O
  escuro continua inteiro e a um clique, mas agora é uma ESCOLHA,
  gravada neste navegador; ausência de preferência significa claro, não
  "depende".
- **O seletor de tema mostra as duas opções.** Era um botão de ícone
  único: quem estava no escuro via uma lua e precisava passar o mouse
  para descobrir que o clique levava ao claro. Virou um seletor de dois
  estados, no mesmo desenho do `Escolha` do formulário — trilho fosco,
  pastilha branca na opção ativa. Cada opção é um botão com nome
  acessível e `aria-pressed`; o glifo reforça, não carrega o
  significado sozinho.
- **Preferência de tema virou dois estados, não três.** "Sistema"
  deixou de existir como valor: `temaEfetivo()` não consulta mais
  `matchMedia`, e `inscreverTema` não observa mais a preferência do
  sistema operacional.
- **`themeColor` virou cor única** (`#eceff0`). O par por
  `prefers-color-scheme` prometeria uma barra de navegador escura sobre
  uma interface que abre clara.
- **Cores do manifesto atualizadas** para a paleta da v2.6
  (`#eceff0` / `#07765f`); estavam nos valores da v2.1.
- **Instalação e tema só entram na barra a partir de 768px.** Medido em
  navegador: com o seletor de 64px e o botão de instalação de 32px, o
  conteúdo fixo da barra pede 725px assim que o rótulo "Revisar
  cálculo" aparece por extenso, e o menu de conta era recortado na
  borda direita. Corrige de quebra um recorte que já existia a 640px
  antes desta versão, sem o seletor novo.
- **Cache do service worker** para `clareza-v2-7-0`: sem o bump, quem
  já instalou continuaria com o CSS que seguia o sistema operacional.

---

## [2.6.0] — 2026-09-05

Release de MATURIDADE VISUAL. Nenhuma regra tributária, nenhuma fórmula
e nenhum comportamento de dado foram alterados — os 374 testes do
domínio passam sem edição. O que mudou foi a forma.

O diagnóstico: a interface estava CHAPADA. Fundo da aplicação, área de
trabalho, seção funcional, campo editável e valor calculado ocupavam
praticamente o mesmo plano visual, e o contador precisava LER a tela
para saber o que era o quê. Um produto que se vende a escritório
precisa que essa distinção seja reconhecida antes da leitura.

### Adicionado

- **Cinco degraus de superfície**, cada um com papel declarado:
  `background` (fundo da aplicação), `surface` (trabalho e painel),
  `surface-subtle` (agrupamento interno), `surface-muted` (informação
  DERIVADA — cabeçalho de tabela, total, classificação do sistema) e
  `surface-hover`. A coluna de dados passou a ser branca sobre o fundo
  cinza; a zona de decisão ficou sobre o fundo, e é nela que os painéis
  de resultado pousam. As duas zonas se distinguem à primeira vista sem
  precisar de título nem de moldura.
- **Escala do número financeiro** (`num-primario`, `num-cenario`,
  `num-secundario`, `num-apoio`), em `globals.css`. Todo valor
  monetário do produto sai de um destes quatro degraus — nenhum
  componente inventa um tamanho por conta própria. A diferença mensal
  virou o maior número da tela, que é o que responde à pergunta da
  análise.
- **`ComparacaoCenarios`** — o desenho ASSINATURA do Clareza para
  qualquer par de alternativas financeiras: os dois cenários com o
  MESMO peso, a direção em texto ("a mais para Pessoa Física") e a
  faixa de acento apenas reforçando o lado de maior resultado. Nenhum
  cenário tem cor fixa: qual deles é o melhor muda a cada análise, e um
  esquema fixo anteciparia um veredito que o cálculo ainda não deu.
- **`EstadoVazioResultado`** — responde "o que aparece aqui", "o que
  falta" e "quanto falta", com a lista derivada da entrada real. Antes
  era um retângulo vazio da largura inteira da zona de decisão.
- **`ValorFinanceiro` e `DadoDerivado`** — os dois formatos que separam
  o que o Clareza CALCULOU do que o contador DIGITA.
- **`.superficie-sistema`** — a forma da informação derivada:
  deliberadamente sem fundo branco, sem borda forte e sem altura de
  controle, para que nunca se pareça com um campo editável.
- **Barra de ação do formulário** com estado à esquerda e comando à
  direita, no lugar do botão verde de largura inteira no rodapé.
- **Rodapé da coluna de acesso** com a versão das regras vigente,
  derivada de `VERSAO_REGRAS`.

### Alterado

- **`--ink-subtle` subiu para 4,8:1** sobre superfície clara (era
  3,5:1). Era o token dos rótulos de seção, dos textos de apoio e dos
  cabeçalhos de tabela — ou seja, boa parte do texto pequeno do produto
  reprovava em AA. Com a correção, a tela de acesso deixou de precisar
  reescrever `.rotulo-secao` à mão.
- **Paleta refeita em torno de um grafite levemente esverdeado**, da
  mesma família do acento — texto e marca passam a parecer do mesmo
  sistema sem tingir nada. Acento `#07765f`, que carrega texto branco a
  5,6:1 e portanto dispensa exceção em botão de 13–14px.
- **Login com as camadas invertidas**: apresentação sobre o fundo da
  aplicação, acesso sobre a superfície branca — a mesma relação que a
  área de trabalho usa do outro lado da porta. Antes a coluna de acesso
  parecia uma barra técnica cinza colada na borda da tela. As três
  etapas ganharam numeração tabular `01/02/03` com filete conector, que
  passa a ser parte da identidade.
- **Definição manual de anexo virou divulgação progressiva**, também
  quando o enquadramento está pendente. O formulário — rótulo,
  `<select>`, dois botões e uma linha de ajuda — ficava permanentemente
  aberto, gastando ~120px com o CAMINHO ALTERNATIVO exatamente no
  momento em que a tela precisa mostrar o caminho principal sem
  competição. A alternativa continua a um clique e ganha peso de botão
  secundário quando há pendência.
- **"Manter classificação automática" virou "Fechar definição
  manual"**: com o enquadramento pendente não existia classificação
  automática para manter.
- **Barra superior de 48 para 52px**, sobre superfície branca, com
  divisores e agrupamento revistos.
- **Etiquetas com borda em todos os tons.** Uma etiqueta neutra sobre
  `surface-muted` — o que acontece no bloco de enquadramento e nos
  totais — sumia dentro do próprio fundo.
- **Tabelas** com linha mais confortável, linha de fechamento marcada
  por `data-total` (mesma forma em todo o produto) e realce de linha no
  ponteiro.
- **Elevação passou a ser token e ficou restrita ao que FLUTUA** —
  painel lateral, menu de conta, lista do combobox, aviso de nova
  análise. Conteúdo normal recebe no máximo a sombra de 1px que faz o
  painel pousar sobre o fundo.
- **Telas de erro, 404 e offline** centradas na janela e com largura
  contida.
- **Cache do service worker** para `clareza-v2-6-0`: sem o bump, quem
  já instalou continuaria vendo a interface antiga.

### Corrigido

- **Coluna de status da tabela de premissas ficava cortada.** O "valor"
  de uma premissa tanto pode ser `R$ 4.800.000,00` quanto uma frase
  ("receita acumulada ÷ meses de atividade × 12"), e o `white-space:
  nowrap` da coluna numérica esticava a tabela inteira, empurrando as
  etiquetas de validação para fora do painel. A coluna numérica ganhou
  a variante `.quebra` e o status passou a caber sempre em uma linha.
- **Ação do formulário ancorada à direita quando a barra quebra em
  duas linhas**, em coluna estreita e no celular.

---

## [2.4.1] — 2026-09-05

Release de linguagem. Só o cabeçalho mudou; nenhuma regra tributária,
nenhum cálculo e nenhum comportamento de dado foram alterados.

O cabeçalho descrevia o SISTEMA. Passou a descrever a TAREFA.

### Alterado

- **"Modelo em validação 13/18" virou "⚠ Revisar cálculo · 13
  pendências".** A fração era um placar interno: o contador tinha de
  inferir o que ela media, se aquilo era um problema, se era clicável e
  o que abriria depois do clique. Os números são os mesmos e continuam
  derivados de `resumoValidacao()` — o que mudou é que o número passou a
  dimensionar um trabalho ("quantas coisas faltam") em vez de relatar um
  estado ("quantas o sistema já processou"). Com tudo revisado, o
  controle vira "✓ Cálculo revisado" e o contador some.
- **Uma porta só para a revisão.** "Premissas" e "Auditoria" eram dois
  botões — em telas largas o estado do modelo, abaixo de 900px um botão
  "Auditoria" — para a mesma tarefa e o mesmo painel. Ficou um: "Revisar
  cálculo". O painel que ele abre também mudou de título, para que o
  rótulo e o destino contem a mesma história; lá dentro a terminologia
  técnica continua inteira.
- **"Análise: {referência}"** no lugar da referência solta. O rótulo
  livre da análise e o nome da conta podiam ser a mesma palavra, um de
  cada lado da barra, significando coisas diferentes. Sem referência,
  lê-se "Análise: sem referência"; nome longo é truncado com o valor
  inteiro no `title`.
- **Etiqueta de estado da análise**, ao lado da referência: "Salva"
  (neutro) ou "Desatualizada" (âmbar) — e nada numa análise nunca
  calculada, onde o formulário vazio já diz o que há para dizer. É
  ESTADO: sem contorno, sem hover, sem cursor de clique.
- **"Histórico" perdeu o glifo `≡`**, que se lê como menu de navegação e
  prometia uma gaveta de links. O rótulo já é curto o bastante para
  carregar-se sozinho.
- **Âmbar, e nunca vermelho, para pendência de revisão.** É trabalho a
  fazer, não falha. Vermelho segue reservado a cálculo que falhou e
  entrada inválida.
- **Estado aberto visível**, e não só anunciado: o botão que abriu o
  painel mantém um anel de acento enquanto ele está na tela.

### Adicionado

- **`revisao-calculo.ts`** — módulo puro com os textos do cabeçalho e a
  etiqueta de estado, com 13 testes. Inclui um que impede qualquer texto
  daqui de prometer validação contábil ou legal: o domínio significa
  "conferida contra a fonte citada na premissa", e prometer mais que
  isso é exatamente o que o produto existe para evitar.

- **Controles de preferência saem em telas muito estreitas.** Medido em
  navegador, o botão de instalação e a alternância de tema eram o que
  empurrava o cabeçalho para fora da tela a 360 e 390px. Saem abaixo de
  480px e 400px respectivamente: são os dois únicos controles da barra
  com equivalente fora do produto — o navegador oferece "Instalar
  aplicativo", e o tema segue a preferência do sistema para quem nunca
  clicou. O que fica são as cinco respostas do contador.

### Verificado em navegador

Chrome headless via CDP, sem dependência nova no projeto:

- **sem rolagem horizontal** em 360, 390, 768, 960, 1024, 1280, 1366,
  1440 e 1920px; cabeçalho em 48px e sem estouro interno em todas;
- **rótulo em três degraus**: "Revisar cálculo · 13 pendências" (≥1180px),
  "Revisar cálculo 13" (≥640px), "⚠ 13" (abaixo disso), com o nome
  acessível sempre completo;
- **referência longa** truncada com reticências e valor inteiro no
  `title`; sem referência lê-se "Análise: sem referência";
- **etiqueta** "Salva" presente na análise gravada e ausente na análise
  nova, como esperado;
- **teclado**: `Tab` percorre Revisar → Histórico → Nova análise →
  instalar → tema → conta → formulário; `Enter` e `Espaço` abrem os
  painéis, o foco entra no diálogo, `Escape` fecha e devolve o foco ao
  botão de origem; `aria-expanded` acompanha em todas as transições;
- **tema claro e escuro**: o tom âmbar da pendência tem contraste ≈5,2:1
  no claro (AA para texto normal) e usa os tokens da paleta escura sem
  ajuste manual.

### Preservado

- `?painel=auditoria` continua funcionando e abre "Revisar cálculo".
  Endereço antigo que deixa de funcionar é trabalho perdido de quem
  salvou o atalho.
- Menu de conta, alternância de tema, botão de instalação, histórico,
  "+ Nova análise" e todo o comportamento de sessão: intocados.

---

## [2.4.0] — 2026-09-05

Release de UX para uso repetido. Nenhuma regra tributária mudou:
`VERSAO_REGRAS` continua em `v1.2-2026-08`, e uma comparação de
resultados antes/depois em cinco cenários confirmou números idênticos.

O tema da versão é **tirar do contador o trabalho que a interface podia
fazer por ele**: decorar valores para comparar, inferir se um "+" é
vantagem ou custo, montar de cabeça a frase que vai repetir ao cliente, e
rolar por parágrafos de ajuda que ele já leu na primeira análise.

### Adicionado

- **Conclusão em uma frase.** O resultado abre por "Nas premissas atuais,
  Pessoa Física apresenta maior resultado líquido estimado", com a
  diferença mensal e anual logo abaixo. Antes abria por "MAIOR RESULTADO
  ESTIMADO" sobre um nome de cenário — o contador montava a frase de
  cabeça antes de repeti-la ao cliente. A frase é derivada do cálculo e
  vem condicionada às premissas: é estimativa sob hipóteses declaradas,
  nunca indicação de regime.
- **"O que explica a diferença?"** Frases factuais derivadas do cálculo,
  citando números que estão na tabela ao lado. Começam pelo que evita
  procurar a causa no lugar errado: receita e custos são iguais nos dois
  cenários, logo toda a diferença vem dos encargos.
- **Composição dos encargos com PF e CNPJ na mesma tabela.** Substitui as
  abas por cenário. Comparar em abas exigia inspecionar um lado, decorar
  os valores, trocar de aba e subtrair de cabeça. As linhas são casadas
  por CATEGORIA do encargo (`comparar-encargos.ts`), não por rótulo: o
  mesmo INSS aparece como "contribuinte individual" na Pessoa Física e
  "sobre o pró-labore" no CNPJ, e continua sendo uma linha só. Abrir a
  linha revela os dois lados ao mesmo tempo.
- **Conferências de entrada** (`avisos-entrada.ts`). Apontam o que é
  incomum sem bloquear: custos acima de 70% da receita, RBT12 defasada ou
  incoerente com a receita mensal, pró-labore zerado, folha menor que o
  pró-labore anual. Redigidas como pedido de conferência — "Confirme se
  deseja manter este valor" —, nunca como correção: declarar errado o que
  pode estar certo ensina a ignorar avisos. Os limiares NÃO são
  parâmetros tributários e não entram no motor.
- **Histórico com busca e duplicação.** Busca por referência, atividade
  ou CNAE, sem acento e sem caixa. "Duplicar" copia os valores para uma
  análise NOVA, descartando a identidade — sem isso o próximo cálculo
  sobrescreveria o registro original, e duplicar teria virado editar.
- **Ajuda por divulgação progressiva.** Botão `?` ao lado do rótulo,
  alcançável por teclado e por toque, ligado ao campo por
  `aria-describedby` enquanto aberto.
- **`MensagemStatus`**, forma única para erro, conferência, informação e
  confirmação. Cada nível tinha antes seu próprio símbolo e tom conforme
  o arquivo em que foi escrito à mão.

### Alterado

- **A terceira coluna permanente saiu.** Até a 2.3 uma coluna de contexto
  de 19,5rem ficava fixa à direita a partir de 1600px, com estágio de
  validação, histórico e auditoria. Era largura gasta o dia inteiro com
  informação consultada pontualmente. Agora são duas zonas (≈40/60);
  histórico e auditoria abrem em painel lateral. Nada foi removido: o
  estágio de validação aparece na barra superior **e** no resultado,
  colado ao número que ele qualifica.
- **`+ Nova análise` tem um lugar só.** Aparecia duas vezes na mesma
  tela, com o mesmo peso visual. Passou a ser a ação primária da barra
  superior, em posição fixa e previsível.
- **A coluna de diferença não depende mais de sinal.** Cada célula nomeia
  o cenário e a direção — "CNPJ: R$ 2.001,97 a mais", "CNPJ: 4,0 p.p.
  maior". "+" é vantagem no resultado líquido e custo nos encargos, e
  essa inferência linha a linha é onde a leitura rápida erra.
- **PF × CNPJ dividem-se por container query.** A pergunta que decide o
  layout passou a ser "cabe nesta coluna?" em vez de "que tamanho tem a
  janela?" — em meia tela os cenários ficavam espremidos, e a mesma
  coluna larga empilhava só porque a janela era pequena.
- **Contexto da análise encolhe depois de resolvido.** Atividade, CNAE,
  anexo e Fator R em uma linha, com "Alterar". O bloco de escolha só
  permanece aberto enquanto há o que decidir. A escolha manual de anexo
  nunca encolhe: fica visível com o caminho de volta ao automático.
- **Receita e custos viraram "Dados compartilhados"**, num bloco próprio
  com "aplicados aos dois cenários". Era o que fazia a comparação parecer
  dois formulários independentes.
- **"Enquadramento atual do cliente" virou "Situação atual do cliente"**,
  com uma linha de apoio única dizendo que os dois cenários são
  calculados de qualquer forma. O rótulo anterior colidia com o
  "enquadramento" do Simples e sugeria que a escolha decidia o que seria
  calculado.
- **"Recalcular análise" virou "Atualizar resultados"**, e "valores
  alterados" virou "resultados desatualizados". O rótulo passou a nomear
  o que muda na tela, não o que a máquina faz.
- **"Salvo neste navegador"** no lugar de "salvo no histórico deste
  aparelho", com a ausência de sincronização declarada. Acompanha a hora
  do último cálculo.
- **Sugestões explicam a origem.** "Sugestão: R$ 14.000,00 — 28% da
  receita, que é o patamar do Fator R" no lugar de "Aplicar R$
  14.000,00". Um número mágico num campo tributário é exatamente o que o
  contador precisa poder justificar ao cliente. Nenhuma sugestão
  sobrescreve valor: aplicar segue sendo um ato explícito.
- **"Ver N premissas pendentes"** abre o painel já filtrado no recorte
  prometido, em vez de na lista completa.
- **`TOM_STATUS` passou a ter fonte única** (`tom-status.ts`). O mesmo
  mapa existia em dois componentes, e bastava editar um para o mesmo
  status dizer coisas diferentes em painéis diferentes.

### Regras de negócio

Nenhuma alíquota, teto, faixa ou fórmula foi alterada. A única mudança no
domínio de cálculo é o campo `categoria` acrescentado a cada `Encargo` —
metadado de apresentação que permite casar as linhas dos dois cenários
sem depender do texto do rótulo. A verificação de regressão comparou
cinco cenários (com e sem atividade, com Fator R, com anexo único e com
anexo manual) antes e depois: os números são idênticos.

---

## [2.3.0] — 2026-08-24

Release de domínio. A segunda rodada com o contador pediu três coisas, e
as três estão implementadas: **o fluxo começa pela atividade**, **PF e PJ
são preenchidos juntos** e **os honorários contábeis são independentes**.

No caminho, o **bloqueio nº 2 do modelo saiu do ar**: o cenário CNPJ
deixou de usar uma alíquota fixa de 11% e passa a apurar a alíquota
efetiva real do Simples Nacional, pelo anexo resolvido a partir da
atividade e do Fator R.

`VERSAO_REGRAS` foi de `v1.1-2026-08` para `v1.2-2026-08`.

Detalhamento em
[`docs/CLASSIFICACAO_ATIVIDADES.md`](docs/CLASSIFICACAO_ATIVIDADES.md).

### Adicionado

- **Fluxo por atividade.** A primeira pergunta da análise passou a ser
  "qual atividade será analisada?". Um seletor com busca por descrição,
  CNAE ou sinônimo — padrão ARIA de combobox, operável só pelo teclado —
  encontra a atividade em um catálogo de 22 serviços. A partir dela, o
  sistema mostra o enquadramento antes de pedir qualquer valor.
- **Classificação tributária auditável.** Cartão de enquadramento com
  anexos possíveis, situação do Fator R e um "Por que esta
  classificação?" que abre o motivo, os números que o produziram e a
  fonte legal.
- **Tabelas dos cinco anexos do Simples Nacional.** Transcritas da
  LC 123/2006 (redação da LC 155/2016), com faixas de RBT12, alíquotas
  nominais e parcelas a deduzir. Testes de integridade garantem ordem,
  ausência de sobreposição, fechamento no teto do regime e que a parcela
  a deduzir só reduza a carga.
- **Fator R.** Apurado sobre a folha e a receita dos últimos 12 meses,
  com limite inclusivo em 28% — exatamente 28% já vale Anexo III. Os
  campos de RBT12 e folha só aparecem em atividade sujeita a ele.
- **Classificação manual.** O contador pode sobrepor o anexo, com motivo
  opcional. Fica gravada na análise e **nunca se apresenta como
  automática**.
- **Preenchimento simultâneo de PF e PJ.** A partir de 1280px os dois
  cenários ficam lado a lado, em `fieldset` próprios. Abaixo disso,
  empilham.

### Corrigido

- **Honorários contábeis deixaram de ser um valor só.** Havia um único
  `custoContabilidade`, aplicado apenas ao CNPJ. Agora são dois campos
  independentes, sem relação fixa entre eles. O da PF começa em **zero**
  de propósito: não recebemos referência profissional, e um número
  inventado inclinaria a comparação em silêncio.
- **O cenário Pessoa Física passou a ter custo contábil.** Antes ele
  simplesmente não existia, o que dava ao autônomo uma vantagem
  artificial na comparação.
- **A alíquota de 11% deixou de ser o caminho normal.** Sobrevive apenas
  como recurso para atividade não identificada — e, nesse caso, o
  resultado vem etiquetado como "Sem enquadramento", com aviso de que
  não representa o Simples Nacional.

### Escopo declarado

- **Anexo IV classificado, mas não calculado.** Advocacia, construção
  civil, limpeza e vigilância são reconhecidas corretamente, e o cálculo
  do cenário CNPJ é bloqueado com o motivo na tela: a contribuição
  patronal fica fora da guia única e o motor assume que está dentro.
  Calcular assim produziria erro por construção.
- **Anexos I e II** têm tabela, mas não têm atividade no catálogo:
  comércio e indústria estão fora do escopo do produto.
- **As tabelas não têm aceite do contador.** Estão como "a validar".

### Compatibilidade

- Análises gravadas pela v2.1 e v2.2 **continuam sendo lidas**. O
  honorário antigo vira o da empresa, o do autônomo entra zerado, e a
  análise volta como classificação pendente — ninguém informou atividade
  naquela época, e atribuir uma agora seria inventar dado.
- **Nenhum resultado de cálculo mudou** para entradas sem atividade:
  a comparação numérica com a v2.2.0 em seis cenários deu diferença
  zero.

---

## [2.2.0] — 2026-08-23

Release de interação. Auditoria de **todos os controles de ação** da
aplicação — rótulo, hierarquia, semântica, teclado, nome acessível e
alvo de toque. **O motor de cálculo não foi tocado:** nenhuma premissa,
alíquota, fórmula ou regra de arredondamento mudou, e `VERSAO_REGRAS`
segue a mesma. O que mudou é o que os botões dizem, não o que a
aplicação calcula.

Auditoria completa em [`docs/AUDITORIA_ACOES_UX.md`](docs/AUDITORIA_ACOES_UX.md).

### Corrigido

- **"Nova" virou "+ Nova análise".** O rótulo mais ambíguo da interface
  aparecia em dois lugares, com aparência de link, alvo de ~16px e sem
  dizer *nova o quê* — nem que fechava a análise em andamento. Agora é
  um único componente usado nos dois pontos, com ícone, corpo de botão
  e a distinção explícita em relação a "Recalcular análise": uma cria
  outra análise, a outra atualiza a que está aberta.
- **Estado deixou de ser rótulo de ação.** O registro em edição tinha um
  botão escrito "Em edição" — dizia o que a análise *era*, não o que o
  clique faria. Virou etiqueta de status, ao lado de um botão "Abrir".
- **Ações destrutivas passaram a se parecer com o que são.** Excluir do
  histórico e limpar as observações apagavam dados locais irreversíveis
  com a aparência da ação mais discreta da tela. Ganharam tom próprio e
  confirmação que nomeia o alvo e avisa que não volta.
- **Confirmação só onde há perda real.** "Nova análise" confirma quando
  existe trabalho fora do histórico — valores digitados e nunca
  calculados, ou edição por cima de um cálculo salvo — e não confirma
  quando não há o que perder. A regra está isolada e testada em
  `acoes-analise.ts`.
- **Botões que pareciam texto.** "Modelo em validação" era
  indistinguível de um indicador passivo; "Premissas do modelo" era um
  falso link para uma ação que não navega. Ambos ganharam tratamento de
  controle e nome acessível que declara o destino.
- **Abas de cenário com o padrão ARIA completo.** Havia `role="tab"` sem
  painel associado e sem navegação por setas — o leitor de tela
  prometia um comportamento que não existia. Agora há tabulação
  *roving*, setas com retorno circular, `Home`/`End`, `aria-controls` e
  `role="tabpanel"`.
- **Botão desabilitado deixou de ser um beco sem saída.** No estado
  vazio, "Calcular análise" usa `aria-disabled` em vez de `disabled`:
  continua na ordem de tabulação e aponta, por `aria-describedby`, a
  lista do que falta preencher.
- **Vocabulário único.** A barra superior dizia "Nova simulação"
  enquanto o resto da interface dizia "análise".
- **Rótulos sem objeto.** "Calcular", "Abrir", "Limpar", "Registrar",
  "Sair", "Entrar", "Acesso" e "Área de trabalho" passaram a nomear
  aquilo sobre o que agem.

### Adicionado

- **Variante `destrutiva` em `Button`.** A hierarquia de ação passou a
  ser declarada no tipo — primária, secundária, sutil, destrutiva —, e
  a destrutiva é a única com o tom negativo.
- **`BotaoIcone`** para controle só de ícone, com `rotulo` obrigatório
  no tipo: não há como criar um botão anônimo por esquecimento.
- **`components/ui/icone.tsx`** — os glifos que a interface já usava,
  reunidos para que um ícone signifique sempre a mesma coisa. Nenhuma
  biblioteca de ícones foi adicionada.
- **`.alvo-toque`** — estende a área clicável a 44x44px por
  pseudo-elemento, só em `pointer: coarse`. A densidade visual
  profissional de 32–40px não muda um pixel.
- **Confirmação de análise salva.** "✓ Análise salva no histórico deste
  aparelho", derivada do estado e sem toast, respondendo à pergunta
  "deu certo?".

### Testes

- `acoes-analise.test.ts`: 10 casos cobrindo os rótulos de cálculo, a
  regra de quando confirmar "Nova análise" e os nomes acessíveis do
  histórico. Total do projeto: 137 testes.

---

## [2.1.1] — 2026-08-20

Release de estabilização. Correção de defeitos operacionais encontrados
em auditoria técnica, com teste de regressão em volta de cada um. **O
motor de cálculo não foi tocado:** os resultados de dez cenários
representativos são idênticos, byte a byte, aos da `v2.1.0`. Nenhuma
premissa contábil, alíquota, fórmula ou regra de arredondamento mudou, e
a interface segue a mesma — só ganhou as mensagens que faltavam.

### Corrigido

- **Recalcular deixou de duplicar a análise.** Uma análise agora tem
  identidade estável: recalcular atualiza o mesmo registro, e só "Nova
  análise" gera `id` novo. Antes cada clique em Recalcular inseria um
  registro, e doze cliques consumiam o histórico inteiro — apagando em
  silêncio as análises de outros clientes. O limite de 12 posições passa
  a contar análises distintas, não eventos de cálculo.
- **Registros corrompidos não derrubam mais a aplicação.** O registro
  persistido inteiro passa por schema — `id`, `criadaEm`,
  `atualizadaEm`, `versaoRegras` e `referencia`, e não só `entrada`. Uma
  data ilegível levantava `RangeError` durante o render e deixava a área
  de trabalho permanentemente inacessível, sem saída pela interface. Os
  registros válidos sobrevivem, o inválido é ignorado e o contador é
  avisado.
- **Fronteiras de erro.** `app/error.tsx` e `app/global-error.tsx` com
  recuperação em dois passos: "Tentar novamente" e, só mediante
  confirmação explícita, limpeza dos dados locais — que apaga
  exclusivamente as chaves com prefixo `clareza:`.
- **Falha de gravação deixou de ser silenciosa.** `gravarJson` devolve
  resultado tipado e distingue cota estourada de armazenamento
  indisponível. A área de trabalho avisa quando não conseguiu salvar e
  mantém o resultado na tela; o acesso demonstrativo não navega para uma
  sessão que não existe; o registro de observação não confirma o que não
  foi gravado.
- **Atalho de recálculo restrito ao contexto certo.** Ctrl/Cmd + Enter
  não dispara mais o cálculo com o foco dentro de um diálogo ou com
  painel lateral aberto.
- **Comparação de estado desatualizado determinística.** A detecção de
  "Valores alterados" passou de `JSON.stringify` para comparação campo a
  campo, sem depender da ordem das chaves nem de chave extra vinda do
  armazenamento.

### Adicionado

- **Rastreabilidade de regras no histórico.** Quando a análise foi criada
  sob outra versão das premissas, a linha diz "Criada com regras X ·
  recalculada com as atuais Y". A `versaoRegras` do registro passou a ser
  preservada no recálculo, em vez de reescrita. Continuamos guardando
  entrada e recalculando sempre — nenhum resultado é congelado.
- **`atualizadaEm`** no registro persistido, opcional e ausente nos
  registros gravados antes desta versão.

### Testes

- 60 testes novos (67 → 127), cobrindo persistência, identidade da
  análise, dados corrompidos, falha de gravação, sessão demonstrativa,
  registro de observações, atalho de teclado e comparação de entrada.
- `vitest` passou a encontrar arquivos `.test.tsx`, que antes eram
  ignorados em silêncio, e a cobertura passou a incluir `services/`,
  `schemas/` e `lib/storage.ts` — de 124 para 314 statements medidos.
- `localStorage` falso em `src/lib/armazenamento-falso.ts`, que permite
  simular cota estourada e armazenamento bloqueado sem dependência nova.

### Preservado

- Motor de cálculo, premissas, `VERSAO_REGRAS` (`v1.1-2026-08`),
  arredondamento, tabela do IRPF, INSS, Fator R e alíquota efetiva do
  CNPJ — todos intactos e com os mesmos resultados.
- Layout, cores, tipografia, navegação e estratégia do PWA.

---

## [2.1.0] — 2026-08-20

Consolidação da área de trabalho em **uma tela só** e tela de acesso
demonstrativa. Iteração de interface e arquitetura de informação: o
modelo de cálculo não foi tocado.

### Adicionado

- **Tela de acesso (`/login`).** Protótipo de interface, sem servidor:
  valida formato de e-mail e senha não vazia, grava uma marca local de
  sessão e abre a área de trabalho. A senha é descartada no submit —
  não é gravada, comparada, derivada nem transmitida. Inclui alternância
  de visibilidade da senha e "lembrar meu e-mail neste aparelho" (só o
  e-mail, e só quando pedido).
- **Área de trabalho unificada (`/workspace`).** Três zonas — dados,
  resultado e contexto — com rolagem independente a partir de 960px.
- **Painéis laterais** para premissas, escopo, feedback e contexto:
  diálogos modais com foco preso, `Escape` para fechar, rolagem do
  documento travada e foco devolvido ao elemento de origem.
- **Auditoria no lugar.** Cada linha da composição dos encargos abre
  mostrando base × alíquota = resultado ao lado da premissa que a
  originou, com descrição, justificativa e estágio de validação.
- **Resumo executivo** acima do comparativo: maior resultado estimado,
  diferença mensal e impacto anual.
- **Controle de conta** na barra superior, com modo demonstração
  declarado e ação de sair.
- **Alternância de tema** claro/escuro persistida no aparelho, com script
  aplicado antes da primeira pintura. "Sistema" continua sendo o padrão
  de quem nunca escolheu.
- **Deep link `?painel=`** para abrir um painel já na chegada — é o que
  mantém úteis os atalhos do PWA e os endereços antigos.
- `docs/UX_WORKSPACE_CONTADOR.md` — decisões de layout, fluxo, princípios
  e a limitação explícita do acesso demonstrativo.

### Alterado

- **Arquitetura de informação.** Cinco rotas viraram uma. Depois do
  acesso, o fluxo profissional completo — lançar, calcular, comparar,
  auditar, alterar, recalcular, retomar análise e registrar observação —
  acontece **sem nenhuma troca de rota**.
- **Barra lateral de 224px substituída por barra superior de 48px.** Com
  tudo em uma tela, o menu apontaria para lugar nenhum e consumia espaço
  horizontal que agora pertence ao comparativo.
- **Histórico** deixou de ser tabela na visão geral e virou lista compacta
  na coluna de contexto. Abrir um registro repõe os campos e recalcula no
  lugar, sem navegar.
- **Feedback** passou a coluna única, para caber no painel lateral.
- **Passo a passo** agora vem recolhido: é conferência, não leitura
  primária.
- **Aviso de valores alterados** passou a aparecer também junto do botão
  que resolve o problema, e não só no topo do resultado.
- **Service worker** para `clareza-v2-1`, com casca reduzida a `/login`,
  `/workspace` e `/offline` — as demais telas deixaram de ser rotas.
- **Manifesto:** `start_url` para `/workspace`; atalhos apontam para
  `/workspace` e `/workspace?painel=premissas`.
- **Tokens de cor** reorganizados em duas paletas nomeadas, permitindo os
  três estados de tema sem repetir valores. As variantes `dark:` do
  Tailwind, que seguem só o sistema operacional, foram trocadas pelo
  token `--sobre-acento`.

### Rotas preservadas por redirecionamento

`/` e `/simulacao` e `/resultado` → `/workspace`; `/premissas` →
`/workspace?painel=premissas`; `/feedback` → `/workspace?painel=feedback`;
`/como-funciona` → `/workspace?painel=escopo`. Nenhum link salvo, atalho
instalado ou entrada em cache foi quebrado.

### Preservado

- **Motor de cálculo:** nenhum arquivo de `domain/` foi alterado.
  Alíquotas, INSS, IRPF, premissas do CNPJ, fórmulas e `VERSAO_REGRAS`
  (`v1.1-2026-08`) seguem intactos. Cinco cenários representativos foram
  serializados antes e depois e comparados campo a campo: sem diferença.
- 67 testes existentes, todos passando; typecheck, lint e build limpos.
- Comparação PF × CNPJ, transparência do cálculo e avisos de validação.
- Persistência local, histórico e exportação de feedback em JSON.
- PWA: manifesto, ícones, service worker, instalação e casca offline.
- Modo claro e escuro.

### Limitação declarada

O acesso **não é autenticação**. Não há servidor, banco, sessão de
servidor, token nem verificação de credencial; qualquer e-mail bem
formado com qualquer senha entra, e a marca de sessão pode ser gravada
pelo console. É protótipo de experiência — está dito na tela de acesso e
no menu da conta, e detalhado em `docs/UX_WORKSPACE_CONTADOR.md`.

---

## [2.0.1] — 2026-08-11

Primeira revisão contábil aplicada. Escopo deliberadamente restrito ao que
o contador informou com números — nada foi inferido.

### Alterado

- **INSS — piso** de R$ 1.518,00 para **R$ 1.621,00** e **teto** de
  R$ 8.157,41 para **R$ 8.475,55**, conforme a revisão. Efeito: em bases
  acima do teto, o líquido da PF cai R$ 46,13/mês (R$ 553,56/ano); no
  cenário CNPJ, cai R$ 25,36/mês quando o pró-labore supera o teto.
  Abaixo do teto, nada muda.
- **Status de validação:** as três premissas de INSS passam de
  hipótese/a-validar para **validada tecnicamente** — as primeiras do
  projeto. O painel `/premissas` reflete isso sozinho.
- `VERSAO_REGRAS` de `v1-mvp-2026-08` para **`v1.1-2026-08`**.
- **Retenção de 11%** pelo tomador PJ deixa de ser lacuna e passa a ser
  decisão documentada: é antecipação de pagamento e não altera o
  resultado prático.
- **Justificativas das premissas** reescritas com o retorno profissional.
  Duas passam a declarar-se explicitamente erradas na interface:
  - a **tabela do IRPF**, confirmada como desatualizada e sem a isenção
    de R$ 5.000;
  - a **alíquota única de 11%** do CNPJ, que apaga uma diferença de até
    9,5 p.p. entre os anexos III e V ao ignorar o Fator R.

### Adicionado

- `docs/PENDENCIAS_CONTADOR.md` — as 21 perguntas em aberto, priorizadas,
  com formulários prontos para as duas tabelas que destravam o produto.

### Não alterado, por decisão

- **Tabela do IRPF.** A revisão confirmou que está desatualizada mas não
  informou as novas faixas. Não foram preenchidas por inferência: a
  isenção de R$ 5.000 envolve um redutor de transição, e errar esse
  desenho distorceria a faixa de renda mais comum. Bloqueio nº 1.
- **Modelo do cenário CNPJ.** Corrigi-lo exige as tabelas completas dos
  anexos com RBT12, ainda não recebidas. As alíquotas iniciais informadas
  valem só para a primeira faixa. Bloqueio nº 2.

---

## [2.0.0] — 2026-08-07

Reposicionamento do produto: de simulador para usuário final a **área de
trabalho profissional para contadores**. Redesenho de fluxo, não apenas
visual. O motor de cálculo não foi alterado.

### Alterado

- **Persona e ambiente.** Interface passa a ser desktop-first
  (1280–1600px), otimizada para uso repetido ao longo do expediente.
  Mobile continua funcional como fluxo secundário.
- **Navegação.** Barra lateral persistente com as seções reais da
  aplicação, no lugar do header e do footer de marketing. Nenhum item de
  menu para funcionalidade inexistente.
- **Entrada de dados.** O wizard de 4 telas vira um formulário único
  agrupado em Enquadramento, Receita e custos e Parâmetros do cenário
  CNPJ. Validação, máscaras e acessibilidade preservadas.
- **Resultado.** Deixa de ser página separada e passa a conviver com o
  formulário em duas colunas a partir de 960px. Editar e recalcular não
  exige mais navegar.
- **Comparação PF × CNPJ.** Vira tabela com coluna de diferença, em reais
  e em pontos percentuais, cobrindo receita, custos, encargos, carga,
  resultado líquido, margem e projeção anual.
- **Transparência do cálculo.** Cada encargo passa a exibir base,
  alíquota, parcela a deduzir e o status de validação da premissa
  correspondente — no lugar de texto explicativo.
- **Painel de premissas.** `/premissas` vira tela de auditoria com
  contagens por status, filtros e detalhamento por linha.
- **Linguagem.** Microcopy revisada de ponta a ponta: "Compare os
  cenários tributários com base nos dados informados" no lugar de copy de
  conversão. "Maior resultado estimado" no lugar de "melhor opção" —
  premissas não validadas não sustentam recomendação.
- **Sistema visual.** Tokens mais densos, raios menores, numerais
  tabulares em toda coluna financeira, agrupamento por espaçamento no
  lugar de cartões. Cor reservada a significado de status.
- **Casca do PWA** promovida a `clareza-v2`, para que quem já instalou
  receba a nova interface em vez da versão em cache.
- **Ordem do `npm run verify`**: `build` antes de `typecheck`, porque o
  Next gera os tipos de rota durante o build.

### Adicionado

- **Visão geral** (`/`): área de trabalho inicial com acesso em uma
  interação a Nova simulação, simulações recentes e estágio do modelo.
- **Simulações recentes**: histórico local, que já era gravado na V1 mas
  nunca exibido. Mostra referência, receita e resultado nos dois cenários,
  com ações de abrir e remover.
- **Referência opcional** por simulação (ex.: "Cliente XPTO — cenário
  01"). Rótulo local de organização; não cria cadastro de clientes e não
  entra no cálculo.
- **Atalho Ctrl/Cmd + Enter** para calcular e recalcular, com a dica
  exibida discretamente ao lado da ação.
- **Indicador de estágio do modelo** na navegação e na Visão geral,
  derivado de `resumoValidacao()` sobre as premissas reais.
- **Metadados de auditoria nos encargos** (`base`, `aliquota`,
  `parcelaADeduzir`, `premissa`): descrevem o que o motor já calculou,
  para a interface exibir a conta sem recalcular nada.
- **Aviso de valores alterados** quando os campos divergem do último
  cálculo executado.
- **Primitivas de UI**: `Painel`, `Badge`, `AreaRolavel`, `CampoTexto`,
  além de `Button`, `CampoMoeda` e `Escolha` redesenhados.
- `docs/HISTORICO_DE_VERSOES.md` e este changelog.

### Corrigido

- **Rolagem horizontal em 390px.** Textos `sr-only` usam
  `position: absolute`; sem ancestral posicionado, escapavam do recorte
  das tabelas roláveis e ancoravam no documento. Resolvido pela primitiva
  `AreaRolavel`, que posiciona o contêiner.
- **Tabelas esticando a coluna** em vez de rolar dentro dela: itens de
  grid nascem com `min-width: auto` e precisavam de `min-w-0`.
- **Layout profissional não engatava em 1024px**, porque a barra de
  rolagem reduz a viewport útil para ~1009px. Ponto de corte movido para
  960px.
- **Contraste do painel desatualizado**: a opacidade reduzida foi
  substituída por selo e borda.

### Preservado

- Motor de cálculo, alíquotas, fórmulas e premissas — **sem qualquer
  alteração de resultado**. Sete cenários representativos conferidos
  antes e depois: valores idênticos aos da `v1.0.0`.
- Separação `entrada → validação → regras → motor → resultado →
  apresentação`, com o domínio independente de React.
- Os 67 testes existentes, todos passando.
- `/premissas`, `/feedback` e a exportação de feedback em JSON.
- Persistência local com revalidação por schema na leitura.
- PWA, manifest, casca offline e instalação.
- Modo claro e escuro.
- Avisos sobre o caráter estimativo dos resultados.

### Removido

- Landing de marketing dentro da aplicação (hero, "três passos", copy de
  conversão).
- Wizard de 4 passos e sua barra de progresso.
- Página `/resultado` como destino próprio — a rota permanece e
  redireciona para a área de trabalho, preservando links salvos e o
  atalho instalado do PWA.
- Gráfico de composição do faturamento: a tabela comparativa comunica a
  mesma informação com mais precisão para quem lê números.
- Explicação em texto corrido do resultado, substituída pelo resumo de
  uma linha e pela tabela.

---

## [1.0.0] — 2026-08-07

Primeira versão funcional. Simulador orientado ao usuário final.

### Adicionado

- Simulação guiada em 4 passos, mobile-first.
- Motor de cálculo puro, isolado de React, com premissas centralizadas e
  auditáveis.
- Comparação entre os cenários Pessoa Física e CNPJ.
- Transparência do cálculo com passo a passo e premissas.
- Páginas de premissas, escopo e feedback com exportação em JSON.
- Persistência local e retomada da última simulação.
- PWA com manifest, service worker e casca offline.
- 67 testes cobrindo o domínio, a validação e a formatação.
- Documentação de premissas, roteiro para o contador e backlog.
