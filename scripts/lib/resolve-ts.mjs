import { dirname, join, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Resolve import sem extensao para `.ts`, traduz o alias `@/` e injeta o
 * atributo de tipo em JSON — as TRES coisas que o bundler do Next faz e o Node
 * cru nao faz.
 *
 * Este mora em `scripts/` porque e dependencia de um comando do
 * `package.json`, e `scratchpad/` e pasta que ninguem trata como suite
 * (secao 12 do CLAUDE.md).
 *
 * O ALIAS ENTROU EM 11/09/2026 e a ausencia dele nao aparecia: todo import `@/`
 * nos modulos que este resolvedor atravessava era `import type`, e tipo o
 * `--experimental-strip-types` apaga antes de resolver. Bastou `check.ts`
 * passar a importar um VALOR de `@/constants` para o roteiro inteiro morrer com
 * ERR_MODULE_NOT_FOUND. Nao era bug latente — era capacidade que nunca tinha
 * sido exercida.
 */
const SRC = join(resolvePath(dirname(fileURLToPath(import.meta.url)), "..", ".."), "src");

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const alvo = join(SRC, specifier.slice(2));
    for (const tentativa of [`${alvo}.ts`, `${alvo}.tsx`, alvo, join(alvo, "index.ts")]) {
      try {
        return await next(pathToFileURL(tentativa).href, context);
      } catch {
        /* tenta a proxima */
      }
    }
  }
  if (specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier)) {
    try {
      return await next(`${specifier}.ts`, context);
    } catch {
      /* cai no padrao */
    }
  }
  const resolvido = await next(specifier, context);
  if (resolvido.url.endsWith(".json")) {
    return { ...resolvido, importAttributes: { type: "json" }, shortCircuit: true };
  }
  return resolvido;
}
