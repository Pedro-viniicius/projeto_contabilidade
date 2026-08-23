# Auditoria de ações — clareza e acessibilidade

**Versão:** 2.2.0 · **Data:** 23 de agosto de 2026

Auditoria de **todos os controles de ação** da aplicação: rótulo,
posição, hierarquia, semântica, teclado, nome acessível e alvo de
toque. O critério aplicado a cada botão foi:

> Um contador entende, antes de clicar, **o que vai acontecer** e
> **sobre o que**?

Nada do motor de cálculo, das premissas ou das regras fiscais foi
tocado. A auditoria é de interação, não de conteúdo tributário.

---

## O que estava errado

O problema não era funcional — todos os botões funcionavam. Era de
**comunicação**:

1. **Rótulos sem objeto.** "Nova", "Calcular", "Abrir", "Limpar",
   "Registrar", "Contexto". O verbo estava lá; o substantivo, não.
2. **Estado usado como rótulo de ação.** O botão do registro em edição
   dizia "Em edição" — descrevia o que a análise *era*, não o que o
   clique faria.
3. **Ação disfarçada de informação.** "Modelo em validação" na barra
   superior era um botão sem preenchimento nem contorno, idêntico a um
   indicador passivo.
4. **Ação disfarçada de link.** "Premissas do modelo" era texto
   sublinhado cor de acento — mas abre um painel, não navega.
5. **Destruição sem aviso e sem destaque.** Excluir do histórico e
   limpar as observações apagavam dados locais irreversíveis com a
   aparência da ação mais discreta da tela.
6. **Vocabulário duplo.** A barra superior dizia "simulação"; o resto da
   interface, "análise".

---

## Tabela de ações revisadas

| Ação anterior | Problema | Nova ação | Motivo |
| --- | --- | --- | --- |
| `Nova` (coluna de dados) | Ambíguo — nova o quê? Aparência de link, alvo de ~16px, descartava a análise sem avisar | `+ Nova análise` | Explicita objeto, ganha corpo de botão e confirma quando há trabalho a perder |
| `Nova` (coluna de contexto) | Mesmo problema, em outro lugar e com outro peso visual | `+ Nova análise` | Mesmo componente nos dois pontos: rótulo, ícone e consequência idênticos por construção |
| `Calcular` | Objeto implícito | `Calcular análise` | Diz o que será calculado |
| `Recalcular` | Não se distinguia de "Calcular" à primeira leitura | `↻ Recalcular análise` | Ícone reforça "atualizar o que já existe", em oposição a "+" de "criar" |
| `Calcular` (estado vazio, `disabled`) | Botão desabilitado sai da ordem de tabulação e não dizia o que faltava | `Calcular análise` com `aria-disabled` + `aria-describedby` | Continua alcançável pelo teclado e anuncia o motivo ("Mínimo necessário") |
| `Abrir` (histórico) | Uma coluna de botões "Abrir" idênticos não identifica a análise | `Abrir` + nome acessível `Abrir análise {referência}` | Rótulo visível curto, nome acessível único por linha |
| `Em edição` (botão) | Estado usado como ação | Etiqueta de status `Em edição` + botão `Abrir` | Status é informação; ação é botão. Nunca o mesmo elemento |
| `✕` (remover do histórico) | Destrutivo com aparência de ação terciária, sem confirmação | `✕` destrutivo + confirmação nomeando a análise | Perda irreversível passa a exigir um segundo passo consciente |
| `Limpar` (observações) | Não dizia o quê; apagava todos os registros sem confirmar | `Excluir registros` + confirmação | Objeto explícito e consequência declarada antes de executar |
| `Registrar` | Objeto implícito | `Registrar observação` | Alinha o botão ao título do painel |
| `Exportar JSON` | Formato no lugar do objeto | `Exportar registros` | O contador exporta observações, não um formato |
| `Contexto` (barra superior) | Substantivo solto; nada indicava que abre painel | `Contexto` + `aria-haspopup="dialog"`, `aria-expanded` e nome acessível completo | Rótulo visível curto por espaço; o nome acessível diz o que abre |
| `Modelo em validação` | Botão indistinguível de indicador de status | Mesmo texto, com superfície e borda de controle secundário + nome acessível `— abrir premissas do modelo` | Passa a parecer clicável e a declarar o destino |
| `Premissas do modelo` (resultado) | Falso link para uma ação que não navega | `Ver premissas do modelo` (botão com contorno) | Semântica e aparência coerentes: `<button>` que parece botão |
| `Premissas do modelo` / `Escopo do modelo` (contexto) | Sem verbo; pareciam itens de lista | `Ver premissas do modelo` / `Ver escopo do modelo` + seta e `aria-haspopup` | Verbo + indicação de que abre painel |
| `Aplicar R$ X` (sugestão) | Fora de contexto não identifica o campo de destino; aparência de link | Mesmo texto + nome acessível ` em {campo}` e contorno | Diz onde o valor entra e parece acionável |
| `Sair` | Ambíguo (sair de quê?) | `Encerrar sessão` | Nomeia o objeto da ação |
| `Entrar` | Não dizia o destino | `Entrar na área de trabalho` | Anuncia para onde leva |
| `Área de trabalho` / `Acesso` (offline) | Substantivos como rótulo de ação | `Abrir área de trabalho` / `Ir para o acesso` | Verbo + objeto |
| `Nova simulação` (barra superior) | Vocabulário divergente do resto da interface | `Nova análise` | Um único nome para a mesma coisa |

---

## Hierarquia estabelecida

A variante deixou de ser escolha de aparência e passou a ser declaração
de intenção, no tipo de `Button`:

| Variante | Papel | Onde |
| --- | --- | --- |
| `primaria` | O próximo passo. **Uma por zona** | `Calcular análise` / `Recalcular análise` |
| `secundaria` | Apoio visível, subordinado | `+ Nova análise`, `Ver premissas do modelo`, `Abrir` |
| `sutil` | Baixa frequência | `Cancelar` |
| `destrutiva` | Perda que não volta | `Excluir análise`, `Excluir registros` |

`destrutiva` é a única variante com o tom negativo: uma ação destrutiva
nunca se parece com uma ação comum.

---

## Confirmação: onde sim, onde não

Confirmação em ação inofensiva ensina o contador a confirmar sem ler.
A regra ficou em módulo puro e testado
(`features/simulacao/components/acoes-analise.ts`):

| Situação | Confirma? | Por quê |
| --- | --- | --- |
| Formulário intocado | Não | Não há o que perder |
| Análise calculada e sem edição pendente | Não | Já está no histórico; "Nova análise" não apaga nada |
| Valores digitados e nunca calculados | **Sim** | Nada foi ao histórico: o clique perde o que está nos campos |
| Edição por cima de análise já calculada | **Sim** | O cálculo está salvo; as alterações posteriores, não |
| Excluir análise do histórico | **Sim** | Irreversível, sem cópia em servidor |
| Excluir observações registradas | **Sim** | Irreversível, sem cópia em servidor |

---

## Acessibilidade

- **Teclado.** Toda ação é operável sem mouse. As abas de cenário
  ganharam o padrão ARIA completo — tabulação *roving*, setas ←/→ com
  retorno circular, `Home`/`End`, `aria-controls` e `role="tabpanel"`.
  Antes havia `role="tab"` sem painel associado e sem navegação por
  setas: o leitor de tela prometia um comportamento que não existia.
- **Foco.** O indicador global (`:focus-visible`, 2px de acento com
  deslocamento) já era correto e foi preservado. Nenhum `outline: none`
  sem substituto.
- **Painéis.** Foco entra na abertura, fica preso enquanto aberto,
  `Escape` fecha e o foco volta ao controle de origem — verificado.
- **Nomes acessíveis.** Controle só de ícone passa pelo componente
  `BotaoIcone`, cujo `rotulo` é **obrigatório no tipo**: não há como
  criar um botão anônimo por esquecimento.
- **Rótulo visível dentro do nome acessível.** Onde o nome acessível é
  mais longo que o texto na tela, ele **começa** pelo texto visível
  (`Contexto — abrir painel…`), preservando o comando por voz.
- **Alvo de toque.** A classe `.alvo-toque` estende a área clicável a
  44x44px com pseudo-elemento, apenas em `pointer: coarse`. A densidade
  visual profissional (32–40px) não muda um pixel; o dedo passa a
  acertar. Aplicada a 16 controles.
- **Desabilitado.** `aria-disabled` no lugar de `disabled` onde o motivo
  precisa ser lido: o controle continua na ordem de tabulação e aponta,
  por `aria-describedby`, a lista do que falta preencher.

---

## Limite conhecido

Os tokens de borda da paleta (`--border`, `--border-strong`) ficam entre
**1,19:1 e 1,87:1** contra o fundo — abaixo dos 3:1 que a WCAG 1.4.11
pede para o contorno de um componente. Por isso os controles secundários
não dependem só da linha: usam **superfície elevada + borda**, e a
identificação real vem do texto, do papel semântico e do anel de foco.

Corrigir os tokens de borda exigiria mexer na paleta, o que está fora do
escopo desta mudança. Fica registrado como pendência de design.

---

## Ícones

Não foi adicionada biblioteca de ícones. Os glifos que a interface já
usava foram reunidos em `components/ui/icone.tsx` para que **um ícone
signifique sempre a mesma coisa**:

| Ícone | Significado — e nada mais |
| --- | --- |
| `+` | Nova análise |
| `↻` | Recalcular |
| `▤` | Abrir painel |
| `✕` | Fechar painel / excluir (só em controle de tom destrutivo) |

Todos são `aria-hidden`: o ícone reforça o rótulo, nunca o substitui.
