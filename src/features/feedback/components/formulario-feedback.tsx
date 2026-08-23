"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { registrarEvento } from "@/lib/analytics";
import { formatarData, formatarMoeda } from "@/lib/format";
import { useValorLocal } from "@/lib/armazenamento-reativo";
import {
  CHAVE_ATUAL,
  lerSimulacaoAtual,
} from "@/features/simulacao/services/simulacao-storage";
import {
  CATEGORIAS_FEEDBACK,
  feedbackSchema,
  type EntradaFeedback,
} from "../schemas/feedback-schema";
import {
  CHAVE_FEEDBACK,
  exportarFeedbacks,
  lerFeedbacks,
  limparFeedbacks,
  salvarFeedback,
} from "../services/feedback-storage";

type Erros = Partial<Record<keyof EntradaFeedback, string>>;

/**
 * Registro de divergências, em coluna única para caber no painel
 * lateral: o contador anota o que observou sem sair da análise que
 * motivou a observação — que é justamente o contexto anexado ao
 * registro.
 */
export function FormularioFeedback() {
  const idCategoria = useId();
  const idMensagem = useId();
  const idContato = useId();

  const [categoria, setCategoria] = useState<string>(
    CATEGORIAS_FEEDBACK[0].valor,
  );
  const [mensagem, setMensagem] = useState("");
  const [contato, setContato] = useState("");
  const [erros, setErros] = useState<Erros>({});
  const [envio, setEnvio] = useState<"nenhum" | "ok" | "falhou">(
    "nenhum",
  );
  /* Exclusão dos registros em dois passos: apaga tudo e não volta. */
  const [confirmandoLimpeza, setConfirmandoLimpeza] = useState(false);

  /* A lista se atualiza sozinha a cada gravação — sem efeito de sincronia. */
  const registrados = useValorLocal(CHAVE_FEEDBACK, lerFeedbacks) ?? [];
  const leituraAtual = useValorLocal(CHAVE_ATUAL, lerSimulacaoAtual);
  const salvaAtual = leituraAtual?.registro ?? null;

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const resultado = feedbackSchema.safeParse({ categoria, mensagem, contato });

    if (!resultado.success) {
      const novos: Erros = {};
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0] as keyof EntradaFeedback;
        if (!novos[campo]) novos[campo] = issue.message;
      }
      setErros(novos);
      return;
    }

    const gravacao = salvarFeedback(resultado.data, {
      rota: window.location.pathname,
      entradaSimulacao: salvaAtual?.entrada ?? null,
    });

    /* Sem gravação não há registro: não confirmamos o que não aconteceu,
       e o texto digitado continua no formulário para não se perder. */
    if (!gravacao.sucesso) {
      setEnvio("falhou");
      return;
    }

    registrarEvento("feedback_submitted", { categoria: resultado.data.categoria });

    setErros({});
    setMensagem("");
    setContato("");
    setEnvio("ok");
  }

  return (
    <div className="space-y-5">
      <form onSubmit={enviar} noValidate className="space-y-3.5">
        <div>
          <label
            htmlFor={idCategoria}
            className="block text-[0.8125rem] font-medium text-ink"
          >
            Natureza
          </label>
          <select
            id={idCategoria}
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="mt-1 min-h-9 w-full rounded-md border border-border-strong bg-surface px-2.5 text-[0.875rem] text-ink"
          >
            {CATEGORIAS_FEEDBACK.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.rotulo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor={idMensagem}
            className="block text-[0.8125rem] font-medium text-ink"
          >
            Descrição
          </label>
          <textarea
            id={idMensagem}
            rows={5}
            value={mensagem}
            onChange={(e) => {
              setMensagem(e.target.value);
              setErros((a) => ({ ...a, mensagem: undefined }));
              setEnvio("nenhum");
            }}
            aria-invalid={erros.mensagem ? true : undefined}
            aria-describedby={erros.mensagem ? `${idMensagem}-erro` : undefined}
            placeholder="Ex.: a alíquota efetiva de 11% não corresponde ao anexo aplicável a essa atividade."
            className={`mt-1 w-full rounded-md border bg-surface p-2.5 text-[0.875rem] leading-relaxed text-ink placeholder:text-ink-subtle ${
              erros.mensagem ? "border-negativo" : "border-border-strong"
            }`}
          />
          {erros.mensagem && (
            <p
              id={`${idMensagem}-erro`}
              role="alert"
              className="mt-1 flex items-start gap-1 text-[0.75rem] text-negativo"
            >
              <span aria-hidden="true">⚠</span>
              <span>{erros.mensagem}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={idContato}
            className="block text-[0.8125rem] font-medium text-ink"
          >
            Contato{" "}
            <span className="font-normal text-ink-subtle">(opcional)</span>
          </label>
          <input
            id={idContato}
            type="text"
            value={contato}
            onChange={(e) => setContato(e.target.value)}
            placeholder="Nome ou e-mail, se quiser retorno"
            className="mt-1 min-h-9 w-full rounded-md border border-border-strong bg-surface px-2.5 text-[0.875rem] text-ink placeholder:text-ink-subtle"
          />
        </div>

        {salvaAtual && (
          <p className="rounded-md bg-surface-muted p-2.5 text-[0.75rem] leading-snug text-ink-muted">
            A análise em aberto será anexada ao registro:{" "}
            <span className="tnum font-medium text-ink">
              {formatarMoeda(salvaAtual.entrada.receitaMensal)}
            </span>{" "}
            de receita
            {salvaAtual.referencia ? ` · ${salvaAtual.referencia}` : ""}.
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit">Registrar observação</Button>
          {/* aria-live: confirma o envio para quem usa leitor de tela. */}
          <p aria-live="polite" className="text-[0.8125rem] leading-snug">
            {envio === "ok" && (
              <span className="text-positivo">✓ Registrado.</span>
            )}
            {envio === "falhou" && (
              <span className="text-atencao">
                ⚠ Não foi possível registrar neste navegador. O texto continua
                aqui.
              </span>
            )}
          </p>
        </div>
      </form>

      <section className="border-t border-border-base pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[0.8125rem] font-semibold text-ink">
            Registros neste aparelho
          </h3>
          {registrados.length > 0 && (
            <div className="flex gap-1">
              <Button
                tamanho="sm"
                variante="secundaria"
                onClick={() => baixarJson()}
              >
                Exportar registros
              </Button>
              {/* "Limpar" não dizia o quê. Apaga todas as observações
                  gravadas neste navegador, sem cópia em servidor. */}
              <Button
                tamanho="sm"
                variante="destrutiva"
                aria-expanded={confirmandoLimpeza}
                onClick={() => setConfirmandoLimpeza((a) => !a)}
              >
                Excluir registros
              </Button>
            </div>
          )}
        </div>

        {confirmandoLimpeza && (
          <div
            role="alertdialog"
            aria-label="Confirmar exclusão dos registros"
            className="mt-2 rounded-md border border-negativo/40 bg-negativo-soft p-2.5"
          >
            <p className="text-[0.8125rem] leading-snug text-ink">
              Excluir as {registrados.length} observações gravadas neste
              navegador? Não há cópia em servidor — o que for apagado não
              volta. Exporte antes, se ainda precisar levá-las à revisão.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Button
                autoFocus
                tamanho="sm"
                variante="destrutiva"
                onClick={() => {
                  limparFeedbacks();
                  setConfirmandoLimpeza(false);
                }}
              >
                Excluir registros
              </Button>
              <Button
                tamanho="sm"
                variante="sutil"
                onClick={() => setConfirmandoLimpeza(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <p className="mt-1 text-[0.75rem] leading-snug text-ink-subtle">
          Não há envio para servidor nesta versão. Exporte para levar o
          material à revisão contábil.
        </p>

        {registrados.length === 0 ? (
          <p className="mt-3 text-[0.8125rem] leading-snug text-ink-muted">
            Nenhum registro ainda. As observações aparecem aqui com a análise e
            a versão das regras vigentes no momento.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--border)] border-t border-border-base">
            {registrados.map((f) => (
              <li key={f.id} className="py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge>
                    {CATEGORIAS_FEEDBACK.find((c) => c.valor === f.categoria)
                      ?.rotulo ?? f.categoria}
                  </Badge>
                  <span className="text-[0.75rem] text-ink-subtle">
                    {formatarData(f.criadoEm)} · regras {f.contexto.versaoRegras}
                  </span>
                </div>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink">
                  {f.mensagem}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** Exporta os registros como arquivo local. Nada sai do aparelho. */
function baixarJson() {
  const blob = new Blob([exportarFeedbacks()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `clareza-feedback-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
