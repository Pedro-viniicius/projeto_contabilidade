"use client";

import { useCallback, useSyncExternalStore } from "react";
import { inscreverNoArmazenamento } from "./storage";

/**
 * Leitura reativa do localStorage via `useSyncExternalStore`.
 *
 * Por que não `useEffect` + `setState`: o localStorage é uma fonte
 * externa de dados. Lê-lo dentro de efeito provoca render em cascata,
 * pisca conteúdo errado e é sinalizado pelo lint do React. Com
 * `useSyncExternalStore` o valor entra no render já correto, a
 * hidratação é consistente e alterações feitas em outra aba propagam
 * sozinhas.
 */

const semInscricao = () => () => {};
const verdadeiro = () => true;
const falso = () => false;

/**
 * `false` no servidor e durante a hidratação, `true` depois.
 * Serve para distinguir "ainda não li o dispositivo" de "não há dado".
 */
export function useHidratado(): boolean {
  return useSyncExternalStore(semInscricao, verdadeiro, falso);
}

/*
 * `useSyncExternalStore` exige um snapshot referencialmente estável.
 * Como cada leitura faz JSON.parse (objeto novo a cada chamada),
 * memorizamos o resultado enquanto a string bruta não mudar.
 */
const cache = new Map<string, { bruto: string | null; valor: unknown }>();

/**
 * @param chave chave do localStorage observada para invalidar o cache
 * @param ler função de leitura já validada; precisa ser estável entre
 *            renders (use uma função de módulo, não uma arrow inline)
 */
export function useValorLocal<T>(chave: string, ler: () => T): T | null {
  const snapshot = useCallback(() => {
    let bruto: string | null = null;
    try {
      bruto = window.localStorage.getItem(chave);
    } catch {
      bruto = null;
    }

    const anterior = cache.get(chave);
    if (anterior && anterior.bruto === bruto) return anterior.valor as T;

    const valor = ler();
    cache.set(chave, { bruto, valor });
    return valor;
  }, [chave, ler]);

  return useSyncExternalStore(inscreverNoArmazenamento, snapshot, () => null);
}
