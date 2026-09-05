"use client";

import { useState, type RefObject } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MensagemStatus } from "@/components/ui/mensagem-status";
import type { Anexo } from "../domain/calculation-rules";
import type { Classificacao } from "../domain/classificacao";
import { resumoBloqueio } from "../domain/classificacao";
import {
  enquadramentoResolvido,
  textoFatorR,
  type CampoPendente,
} from "./acao-enquadramento";
import { CartaoClassificacao } from "./cartao-classificacao";
import { SeletorAtividade } from "./seletor-atividade";

/**
 * Linha de metadados da versão compacta.
 *
 * O Fator R só entra quando a atividade está sujeita a ele E há valor
 * apurado. "Fator R: não se aplica a esta atividade" é uma frase de
 * quinze caracteres de informação em sessenta de espaço — cabe no
 * detalhe, não no resumo.
 */
function resumoCompacto(classificacao: Classificacao): string {
  const { atividade, anexo, manual, sujeitaFatorR, fatorR } = classificacao;
  const partes: string[] = [];

  if (atividade) partes.push(`CNAE ${atividade.cnae}`);
  partes.push(`Anexo ${anexo}${manual ? " (manual)" : ""}`);
  if (sujeitaFatorR && fatorR?.valor != null) {
    partes.push(`Fator R: ${textoFatorR(classificacao)}`);
  }

  return partes.join(" · ");
}

/**
 * CONTEXTO DA ANÁLISE — atividade e enquadramento, com dois tamanhos.
 *
 * Enquanto o contador está DECIDINDO, o bloco é grande: busca de
 * atividade, motivo da classificação, alternativa manual. Depois de
 * decidido, ele vira uma linha.
 *
 * A razão é operacional: a atividade se escolhe uma vez por análise e
 * se consulta o tempo todo. Manter o formulário de escolha aberto
 * depois da escolha custa meia coluna de altura permanente — altura
 * que sai do preenchimento dos dois cenários, que é onde o contador
 * realmente trabalha.
 *
 * O que a versão compacta NUNCA esconde: o anexo aplicado, se ele veio
 * de escolha manual, e qualquer bloqueio de cálculo. Isso é auditoria,
 * não detalhe.
 */
export function ContextoAnalise({
  classificacao,
  campoAtividadeRef,
  onSelecionarAtividade,
  onLimparAtividade,
  onAnexoManual,
  onMotivoManual,
  onIrPara,
  onVoltarAoAutomatico,
}: {
  classificacao: Classificacao;
  campoAtividadeRef: RefObject<HTMLInputElement | null>;
  onSelecionarAtividade: (id: string) => void;
  onLimparAtividade: () => void;
  onAnexoManual: (anexo: Anexo | null) => void;
  onMotivoManual: (motivo: string) => void;
  onIrPara: (campo: CampoPendente) => void;
  onVoltarAoAutomatico: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const { atividade, anexo, manual, bloqueio } = classificacao;

  /* Regra pura e testada: ver `enquadramentoResolvido`. */
  const resolvido = !editando && enquadramentoResolvido(classificacao);

  if (resolvido) {
    return (
      <section
        aria-label="Atividade e enquadramento"
        className="rounded-md border border-border-strong bg-surface-muted px-2.5 py-2"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[0.8125rem] font-medium leading-snug text-ink">
              {atividade?.descricao ?? "Atividade não identificada"}
            </p>
            <p className="tnum mt-0.5 text-[0.75rem] leading-snug text-ink-muted">
              {resumoCompacto(classificacao)}
            </p>
          </div>
          <Button
            type="button"
            tamanho="sm"
            variante="secundaria"
            className="shrink-0"
            onClick={() => setEditando(true)}
          >
            Alterar
            <span className="sr-only"> atividade e enquadramento</span>
          </Button>
        </div>

        {/*
          Escolha manual não pode virar detalhe: ela sobrepõe a
          classificação do sistema e precisa continuar visível depois
          de qualquer rolagem ou recálculo, com o caminho de volta ao
          lado.
        */}
        {manual && (
          <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border-base pt-2">
            <Badge tom="atencao" ponto>
              Anexo {anexo} definido manualmente
            </Badge>
            <Button
              type="button"
              tamanho="sm"
              variante="sutil"
              onClick={onVoltarAoAutomatico}
            >
              Voltar para classificação automática
            </Button>
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="space-y-2.5">
      <SeletorAtividade
        atividade={atividade}
        campoRef={campoAtividadeRef}
        onSelecionar={(id) => {
          onSelecionarAtividade(id);
          /* Escolhida a atividade, o bloco volta sozinho ao compacto. */
          setEditando(false);
        }}
        onLimpar={onLimparAtividade}
      />

      <CartaoClassificacao
        classificacao={classificacao}
        onAnexoManual={(a) => {
          onAnexoManual(a);
          setEditando(false);
        }}
        onMotivoManual={onMotivoManual}
        onIrPara={onIrPara}
        onVoltarAoAutomatico={onVoltarAoAutomatico}
      />

      {/*
        Só aparece quando o contador ABRIU a edição de um enquadramento
        que já estava resolvido — é o caminho de volta, e não existe
        quando há pendência de verdade.
      */}
      {editando && enquadramentoResolvido(classificacao) && (
        <Button
          type="button"
          tamanho="sm"
          variante="sutil"
          onClick={() => setEditando(false)}
        >
          Recolher enquadramento
        </Button>
      )}

      {bloqueio && !editando && (
        <MensagemStatus nivel="atencao" papel="status">
          {resumoBloqueio(bloqueio)}
        </MensagemStatus>
      )}
    </div>
  );
}
