"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Painel } from "@/components/ui/painel";
import { limparDadosDoClareza } from "@/lib/storage";

/**
 * Fronteira de erro da aplicação.
 *
 * Existe porque o cálculo e a interface leem dados que vivem no
 * aparelho do contador. Até a v2.1.0 um único registro ilegível no
 * histórico levantava exceção durante o render e a área de trabalho
 * ficava inacessível — recarregar reproduzia o mesmo erro, e não havia
 * saída sem abrir o console do navegador.
 *
 * A recuperação é deliberada: "Tentar novamente" primeiro, e só então
 * a limpeza, que apaga exclusivamente as chaves do Clareza e diz o que
 * vai levar embora antes de fazê-lo.
 */
export default function ErroDaAplicacao({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);

  return (
    <main id="conteudo" className="mx-auto max-w-[1100px] px-4 py-5 sm:px-6">
      <Painel className="px-4 py-12 text-center">
        <p className="rotulo-secao">Erro</p>
        <h1 className="mt-1.5 text-base font-semibold tracking-tight text-ink">
          Não foi possível abrir esta tela
        </h1>
        <p className="mx-auto mt-1.5 max-w-md text-[0.8125rem] leading-relaxed text-ink-muted">
          O cálculo é local e nada foi enviado a servidor nenhum. Na maioria
          das vezes a causa é um registro salvo neste navegador que ficou
          ilegível.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button onClick={reset}>Tentar novamente</Button>
          {!confirmando && (
            <Button variante="destrutiva" onClick={() => setConfirmando(true)}>
              Limpar dados locais
            </Button>
          )}
        </div>

        {confirmando && (
          <div className="mx-auto mt-5 max-w-md border-t border-border-base pt-4">
            <p className="text-[0.8125rem] leading-relaxed text-ink-muted">
              A limpeza apaga deste navegador as análises salvas, o histórico,
              as observações registradas e o acesso demonstrativo. Nada fora do
              Clareza é tocado, e não há cópia em servidor: o que for apagado
              não volta.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Button
                variante="destrutiva"
                onClick={() => {
                  limparDadosDoClareza();
                  /* Recarga completa de propósito: a árvore React desta
                     tela já falhou, e um push de rota a manteria viva. */
                  window.location.reload();
                }}
              >
                Apagar e recarregar
              </Button>
              <Button variante="sutil" onClick={() => setConfirmando(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Painel>
    </main>
  );
}
