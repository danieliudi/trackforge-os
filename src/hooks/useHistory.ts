"use client";

import { useCallback, useMemo, useReducer } from "react";

/** Teto de memória. 50 passos cobre uma sessão de edição sem crescer sem fim. */
const LIMIT = 50;

type State<T> = {
  past: T[];
  present: T;
  future: T[];
  /** Chave do último commit, usada para agrupar digitação contínua. */
  lastKey: string | null;
};

type Action<T> =
  | { type: "commit"; update: (current: T) => T; coalesceKey?: string }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; value: T };

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case "commit": {
      const present = action.update(state.present);
      if (Object.is(present, state.present)) return state;

      // Digitar no mesmo campo agrupa num passo só; sem isso, um Ctrl+Z
      // desfaria uma letra por vez. Ação estrutural não manda chave, então
      // nunca agrupa — remover dois slides são dois undos, como se espera.
      const coalesce =
        action.coalesceKey !== undefined && action.coalesceKey === state.lastKey;

      return {
        past: coalesce ? state.past : [...state.past, state.present].slice(-LIMIT),
        present,
        future: [],
        lastKey: action.coalesceKey ?? null,
      };
    }

    case "undo": {
      const previous = state.past[state.past.length - 1];
      if (previous === undefined) return state;
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
        lastKey: null,
      };
    }

    case "redo": {
      const [next, ...rest] = state.future;
      if (next === undefined) return state;
      return {
        past: [...state.past, state.present],
        present: next,
        future: rest,
        lastKey: null,
      };
    }

    // Restaurar do storage ou trocar de carrossel zera o histórico: desfazer
    // para dentro de um documento que não existe mais não faz sentido.
    case "reset":
      return { past: [], present: action.value, future: [], lastKey: null };
  }
}

/**
 * Estado com desfazer/refazer.
 *
 * Remover um slide era irreversível e apagava o texto que a IA gerou — o
 * carrossel inteiro só existia em memória volátil.
 */
export function useHistory<T>(initial: T) {
  const [state, dispatch] = useReducer(reducer as typeof reducer<T>, {
    past: [],
    present: initial,
    future: [],
    lastKey: null,
  });

  const commit = useCallback(
    (update: (current: T) => T, coalesceKey?: string) =>
      dispatch({ type: "commit", update, coalesceKey }),
    [],
  );

  const reset = useCallback((value: T) => dispatch({ type: "reset", value }), []);
  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  return useMemo(
    () => ({
      present: state.present,
      commit,
      reset,
      undo,
      redo,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
    }),
    [state.present, state.past.length, state.future.length, commit, reset, undo, redo],
  );
}
