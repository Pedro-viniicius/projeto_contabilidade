<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Clareza — regras do projeto

**Contexto:** simulador financeiro PWA para autônomos e prestadores de
serviço. MVP em validação contábil. Leia o `README.md` antes de mexer.

## Regras não negociáveis

1. **Nenhum número tributário fora de
   `src/features/simulacao/domain/calculation-rules.ts`.** Sem alíquota,
   teto ou faixa em componente React. Um contador precisa auditar as
   regras sem ler JSX.
2. **Toda premissa carrega metadados** (`descricao`, `porQueExiste`,
   `status`, `ondeUsada`). Eles aparecem na interface — não são comentário
   decorativo.
3. **Ao mudar qualquer regra, incremente `VERSAO_REGRAS`.** Ela é gravada
   em cada simulação salva e em cada feedback.
4. **Funções do domínio são puras.** Sem React, sem DOM, sem relógio, sem
   efeito colateral.
5. **Guardamos entrada, não resultado.** O resultado é sempre recalculado,
   para que correções nas premissas alcancem simulações antigas.
6. **Dado lido de `localStorage` é sempre revalidado por schema.**
7. **Interface toda em pt-BR natural.** Identificadores de código podem
   ficar em inglês quando for a convenção do ecossistema.
8. **Não inventar precisão contábil.** Se uma regra não foi validada,
   isole-a, documente a simplificação e marque o status.

## Antes de terminar qualquer alteração

```bash
npm run verify   # build + typecheck + lint + test
```

## Documentos que precisam ser mantidos junto do código

- `docs/PREMISSAS_DE_CALCULO.md` — auditoria das regras
- `docs/PERGUNTAS_PARA_CONTADOR.md` — roteiro de validação
- `docs/BACKLOG_PRODUTO.md` — o que existe vs. o que é hipótese
