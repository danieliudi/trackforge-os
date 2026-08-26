"use client";

import { useLayoutEffect, useRef, useState } from "react";

export type Size = { width: number; height: number };

/**
 * Mede o elemento e reage a mudanças de viewport.
 *
 * O preview antes usava escalas cravadas (0.42 e 0.17): em monitor grande
 * sobrava área vazia e em tela pequena o slide estourava o container. Com a
 * medida real quem decide a escala é o espaço disponível.
 */
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // Só re-renderiza em mudança real; ResizeObserver dispara de sobra.
      setSize((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height },
      );
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}
