"use client";

import { useId, useRef, useState, type RefObject } from "react";
import { Badge } from "@/components/ui/badge";
import {
  buscarAtividades,
  totalAtividades,
  type AtividadeTributaria,
} from "../domain/catalogo-atividades";

/**
 * SELETOR DE ATIVIDADE — o primeiro campo da análise.
 *
 * É aqui que o fluxo começa, porque é aqui que o raciocínio do
 * contador começa: sem saber a atividade, não há enquadramento, e sem
 * enquadramento não faz sentido pedir valor nenhum.
 *
 * Padrão ARIA 1.2 de combobox com listbox: o campo é `role="combobox"`,
 * a lista é `role="listbox"` e a opção em foco é apontada por
 * `aria-activedescendant` — o foco do teclado NUNCA sai do campo, que
 * é o que permite continuar digitando enquanto se navega pelas setas.
 *
 * O componente não classifica nada. Ele escolhe um id; quem decide
 * anexo é o domínio.
 */
export function SeletorAtividade({
  atividade,
  onSelecionar,
  onLimpar,
  campoRef,
}: {
  atividade: AtividadeTributaria | null;
  onSelecionar: (id: string) => void;
  onLimpar: () => void;
  /**
   * Deixa outra parte da tela trazer o foco para cá — é o que faz
   * "Informar atividade", lá no bloco de enquadramento, levar o
   * contador ao campo em vez de só o mandar procurá-lo.
   */
  campoRef?: RefObject<HTMLInputElement | null>;
}) {
  const id = useId();
  const idLista = `${id}-lista`;
  const idAjuda = `${id}-ajuda`;
  const idVazio = `${id}-vazio`;

  const [termo, setTermo] = useState("");
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const campoProprio = useRef<HTMLInputElement>(null);
  const campo = campoRef ?? campoProprio;
  const listaRef = useRef<HTMLUListElement>(null);

  const resultados = aberto ? buscarAtividades(termo) : [];
  /* Índice fora da lista atual não pode virar `aria-activedescendant`
     apontando para elemento que não existe. */
  const indiceAtivo = Math.min(ativo, Math.max(resultados.length - 1, 0));
  const opcaoAtiva = resultados[indiceAtivo];

  function abrirCom(valor: string) {
    setTermo(valor);
    setAberto(true);
    setAtivo(0);
  }

  function escolher(escolhida: AtividadeTributaria) {
    onSelecionar(escolhida.id);
    setTermo("");
    setAberto(false);
    setAtivo(0);
  }

  function aoTeclar(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!aberto) {
        abrirCom(termo);
        return;
      }
      if (resultados.length === 0) return;
      const passo = e.key === "ArrowDown" ? 1 : -1;
      const proximo =
        (indiceAtivo + passo + resultados.length) % resultados.length;
      setAtivo(proximo);
      rolarAteVisivel(listaRef.current, proximo);
      return;
    }

    if (e.key === "Home" || e.key === "End") {
      if (!aberto || resultados.length === 0) return;
      e.preventDefault();
      const proximo = e.key === "Home" ? 0 : resultados.length - 1;
      setAtivo(proximo);
      rolarAteVisivel(listaRef.current, proximo);
      return;
    }

    if (e.key === "Enter") {
      if (!aberto || !opcaoAtiva) return;
      /* Só engole o Enter quando há opção para escolher — senão ele
         precisa chegar ao formulário e disparar o cálculo. */
      e.preventDefault();
      escolher(opcaoAtiva);
      return;
    }

    if (e.key === "Escape" && aberto) {
      /* Fecha a lista sem propagar: um painel lateral atrás não pode
         fechar junto só porque a lista estava aberta. */
      e.preventDefault();
      e.stopPropagation();
      setAberto(false);
      return;
    }

    if (e.key === "Tab" && aberto) setAberto(false);
  }

  /* ---------- Atividade já escolhida ---------- */
  if (atividade) {
    return (
      <div>
        <p className="text-[0.8125rem] font-medium text-ink">
          Atividade analisada
        </p>
        <div className="superficie-sistema mt-1 flex items-start justify-between gap-2.5 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[0.875rem] font-medium text-ink">
              {atividade.descricao}
            </p>
            <p className="tnum mt-0.5 text-[0.75rem] text-ink-subtle">
              CNAE {atividade.cnae} · {atividade.categoria}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onLimpar();
              /* O foco volta para onde a próxima ação acontece. */
              requestAnimationFrame(() => campo.current?.focus());
            }}
            className="alvo-toque shrink-0 rounded-sm border border-border-base px-1.5 py-0.5 text-[0.75rem] text-ink-muted transition-colors hover:border-border-strong hover:bg-surface-muted hover:text-ink"
          >
            Trocar
            <span className="sr-only"> atividade analisada</span>
          </button>
        </div>
      </div>
    );
  }

  /* ---------- Busca ---------- */
  return (
    <div>
      <label htmlFor={id} className="block text-[0.8125rem] font-medium text-ink">
        Qual atividade será analisada?
      </label>

      <div className="relative mt-1">
        <input
          ref={campo}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={aberto}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={
            aberto && opcaoAtiva ? `${id}-opcao-${opcaoAtiva.id}` : undefined
          }
          aria-describedby={
            aberto && resultados.length === 0 ? idVazio : idAjuda
          }
          autoComplete="off"
          placeholder="Digite a atividade ou o CNAE…"
          value={termo}
          onChange={(e) => abrirCom(e.target.value)}
          onFocus={() => setAberto(true)}
          onBlur={() => {
            /* Deixa o clique na opção acontecer antes de fechar. */
            window.setTimeout(() => setAberto(false), 120);
          }}
          onKeyDown={aoTeclar}
          className="min-h-9 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-[0.875rem] text-ink transition-colors duration-[140ms] placeholder:text-ink-subtle focus:border-accent"
        />

        {aberto && (
          <ul
            ref={listaRef}
            id={idLista}
            role="listbox"
            aria-label="Atividades encontradas"
            /* Conteúdo TRANSITÓRIO: elevação de verdade, para que a
               lista pareça estar sobre o formulário e não dentro dele. */
            className="shadow-flutuante absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-border-strong bg-surface py-1"
          >
            {resultados.map((r, indice) => (
              <li
                key={r.id}
                id={`${id}-opcao-${r.id}`}
                role="option"
                aria-selected={indice === indiceAtivo}
                /* `onMouseDown` e não `onClick`: o clique só chegaria
                   depois do blur ter fechado a lista. */
                onMouseDown={(e) => {
                  e.preventDefault();
                  escolher(r);
                }}
                onMouseEnter={() => setAtivo(indice)}
                className={`cursor-pointer px-2.5 py-2 ${
                  indice === indiceAtivo
                    ? "bg-accent-soft"
                    : "hover:bg-surface-hover"
                }`}
              >
                <span className="block text-[0.8125rem] text-ink">
                  {r.descricao}
                </span>
                <span className="tnum mt-0.5 flex items-center gap-1.5 text-[0.75rem] text-ink-subtle">
                  CNAE {r.cnae}
                  <span aria-hidden="true">·</span>
                  {r.simples.sujeitaFatorR
                    ? "Anexo III ou V · Fator R"
                    : `Anexo ${r.simples.anexosPossiveis[0]}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Lista vazia é resposta, não silêncio: dizemos o que fazer. */}
      {aberto && resultados.length === 0 && (
        <p
          id={idVazio}
          role="status"
          className="mt-1 text-[0.75rem] leading-snug text-atencao"
        >
          Atividade não encontrada nesta versão. Você pode definir o anexo
          manualmente abaixo — a análise fica marcada como classificação
          manual.
        </p>
      )}

      {!(aberto && resultados.length === 0) && (
        <p id={idAjuda} className="mt-1 text-[0.75rem] leading-snug text-ink-subtle">
          {totalAtividades()} atividades de prestação de serviço nesta versão.
          Sem atividade, o cenário CNPJ sai sem enquadramento.
        </p>
      )}
    </div>
  );
}

/** Mantém a opção ativa visível durante a navegação por setas. */
function rolarAteVisivel(lista: HTMLUListElement | null, indice: number) {
  lista?.children[indice]?.scrollIntoView({ block: "nearest" });
}

/** Etiqueta compacta de anexo, reaproveitada no cartão e no resultado. */
export function EtiquetaAnexo({
  anexo,
  manual,
}: {
  anexo: string;
  manual?: boolean;
}) {
  return (
    <Badge tom={manual ? "atencao" : "neutro"}>
      Anexo {anexo}
      {manual ? " (manual)" : ""}
    </Badge>
  );
}
