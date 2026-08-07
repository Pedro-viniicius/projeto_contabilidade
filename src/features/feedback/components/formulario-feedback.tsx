"use client";

import { useId, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitulo } from "@/components/ui/card";
import { registrarEvento } from "@/lib/analytics";
import { formatarData } from "@/lib/format";
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
    <div className="space-y-4">
      <Card>
        <form onSubmit={enviar} noValidate className="space-y-5">
          <div>
            <label
              htmlFor={idCategoria}
              className="block text-sm font-medium text-ink"
            >
              Sobre o que é o feedback?
            </label>
            <select
              id={idCategoria}
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="mt-2 min-h-13 w-full rounded-xl border border-border-strong bg-surface px-3.5 text-ink"
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
              className="block text-sm font-medium text-ink"
            >
              O que você observou?
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
              placeholder="Ex.: a alíquota usada no cenário CNPJ não corresponde ao anexo que se aplica a essa atividade."
              className={`mt-2 w-full rounded-xl border bg-surface p-3.5 leading-relaxed text-ink placeholder:text-ink-subtle ${
                erros.mensagem ? "border-negative" : "border-border-strong"
              }`}
            />
            {erros.mensagem && (
              <p
                id={`${idMensagem}-erro`}
                role="alert"
                className="mt-1.5 flex items-start gap-1.5 text-sm text-negative"
              >
                <span aria-hidden="true">⚠</span>
                <span>{erros.mensagem}</span>
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={idContato}
              className="block text-sm font-medium text-ink"
            >
              Contato{" "}
              <span className="font-normal text-ink-subtle">(opcional)</span>
            </label>
            <input
              id={idContato}
              type="text"
              value={contato}
              onChange={(e) => setContato(e.target.value)}
              placeholder="E-mail ou nome, se quiser retorno"
              className="mt-2 min-h-13 w-full rounded-xl border border-border-strong bg-surface px-3.5 text-ink placeholder:text-ink-subtle"
            />
          </div>

          <Button type="submit" tamanho="lg" className="w-full sm:w-auto">
            Registrar feedback
          </Button>

          {/* aria-live: confirma o envio para quem usa leitor de tela. */}
          <p aria-live="polite" className="text-sm">
            {enviado && (
              <span className="text-positive">
                ✓ Feedback registrado neste dispositivo. Obrigado!
              </span>
            )}
          </p>
        </form>
      </Card>

      {registrados.length > 0 && (
        <Card>
          <CardTitulo>
            Feedbacks registrados ({registrados.length})
          </CardTitulo>
          <p className="mt-1 text-sm text-ink-muted">
            Ficam salvos só neste aparelho. Exporte o arquivo para levar à
            conversa com o contador.
          </p>

          <ul className="mt-4 divide-y divide-[var(--border)]">
            {registrados.map((f) => (
              <li key={f.id} className="py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="rounded-md bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-muted">
                    {CATEGORIAS_FEEDBACK.find((c) => c.valor === f.categoria)
                      ?.rotulo ?? f.categoria}
                  </span>
                  <span className="text-xs text-ink-subtle">
                    {formatarData(f.criadoEm)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink">
                  {f.mensagem}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button variante="secundaria" onClick={baixarJson}>
              Exportar em JSON
            </Button>
            <Button variante="sutil" onClick={limparFeedbacks}>
              Apagar tudo deste aparelho
            </Button>
          </div>
        </Card>
      )}

      <Card className="bg-surface-muted">
        <p className="text-sm leading-relaxed text-ink-muted">
          Nesta versão o feedback não é enviado para nenhum servidor: fica no
          armazenamento local do navegador. O formato do registro já é o mesmo
          que uma API futura vai receber.
        </p>
        <ButtonLink href="/premissas" variante="secundaria" className="mt-4">
          Revisar as premissas de cálculo
        </ButtonLink>
      </Card>
    </div>
  );
}
