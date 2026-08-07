"use client";

import { useId, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Painel, PainelCabecalho, PainelCorpo } from "@/components/ui/painel";
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
  const [enviado, setEnviado] = useState(false);

  /* A lista se atualiza sozinha a cada gravação — sem efeito de sincronia. */
  const registrados = useValorLocal(CHAVE_FEEDBACK, lerFeedbacks) ?? [];
  const salvaAtual = useValorLocal(CHAVE_ATUAL, lerSimulacaoAtual);

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

    salvarFeedback(resultado.data, {
      rota: window.location.pathname,
      entradaSimulacao: salvaAtual?.entrada ?? null,
    });
    registrarEvento("feedback_submitted", { categoria: resultado.data.categoria });

    setErros({});
    setMensagem("");
    setContato("");
    setEnviado(true);
  }

  function baixarJson() {
    const blob = new Blob([exportarFeedbacks()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clareza-feedback-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(20rem,26rem)_minmax(0,1fr)]">
      <Painel>
        <PainelCabecalho titulo="Registrar observação" />
        <form onSubmit={enviar} noValidate>
          <PainelCorpo className="space-y-3.5">
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
                  setEnviado(false);
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
                A simulação em aberto será anexada ao registro:{" "}
                <span className="tnum font-medium text-ink">
                  {formatarMoeda(salvaAtual.entrada.receitaMensal)}
                </span>{" "}
                de receita
                {salvaAtual.referencia ? ` · ${salvaAtual.referencia}` : ""}.
              </p>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" tamanho="lg">
                Registrar
              </Button>
              {/* aria-live: confirma o envio para quem usa leitor de tela. */}
              <p aria-live="polite" className="text-[0.8125rem]">
                {enviado && (
                  <span className="text-positivo">✓ Registrado.</span>
                )}
              </p>
            </div>
          </PainelCorpo>
        </form>
      </Painel>

      <Painel>
        <PainelCabecalho
          titulo="Registros neste aparelho"
          descricao="Não há envio para servidor nesta versão. Exporte para levar à revisão."
          acoes={
            registrados.length > 0 ? (
              <>
                <Button tamanho="sm" variante="secundaria" onClick={baixarJson}>
                  Exportar JSON
                </Button>
                <Button tamanho="sm" variante="sutil" onClick={limparFeedbacks}>
                  Limpar
                </Button>
              </>
            ) : undefined
          }
        />

        {registrados.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-[0.875rem] font-medium text-ink">
              Nenhum registro
            </p>
            <p className="mx-auto mt-1 max-w-sm text-[0.8125rem] leading-snug text-ink-muted">
              As observações registradas aparecem aqui, com a simulação e a
              versão das regras vigentes no momento.
            </p>
            <ButtonLink
              href="/premissas"
              variante="secundaria"
              tamanho="sm"
              className="mt-4"
            >
              Revisar premissas
            </ButtonLink>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {registrados.map((f) => (
              <li key={f.id} className="px-4 py-3">
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
      </Painel>
    </div>
  );
}
